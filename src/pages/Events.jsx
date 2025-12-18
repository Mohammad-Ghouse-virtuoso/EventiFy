import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { eventsAPI } from '../services/api'
import EventCard from '../components/EventCard'
import VirtualizedEventsGrid from '../components/VirtualizedEventsGrid'
import { useAuth } from '../contexts/AuthContext'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import useDebounce from '../hooks/useDebounce'

export default function Events() {
  const { user } = useAuth()
  const location = useLocation()
  const highlightEventId = location.state?.highlightEventId
  const eventRefs = useRef({})
  const [events, setEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [userRSVPs, setUserRSVPs] = useState({}) // Store user's RSVP status for each event
  const [loading, setLoading] = useState(true)
  const [loadingPast, setLoadingPast] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    location: ''
  })
  const [page, setPage] = useState(1)
  const limit = 12
  const skip = useMemo(() => (page - 1) * limit, [page])
  const [lastPageCount, setLastPageCount] = useState(0)
  const categories = useMemo(() => ([
    'music','tech','sports','food','art','business','education','health','networking','entertainment','recreation','wedding','anniversary'
  ]), [])

  // Debounced search + filters
  const debouncedSearch = useDebounce(searchTerm, 350)
  const debouncedFilters = useDebounce(filters, 350)

  // Load on mount
  useEffect(() => {
    const t0 = performance?.now?.() || 0
    import.meta.env.DEV && console.debug('[DBG] events:load:start')
    loadEvents().finally(() => {
      const t1 = performance?.now?.() || 0
      import.meta.env.DEV && console.debug('[DBG] events:load:done in', (t1 - t0).toFixed(1), 'ms')
    })
    loadPastEvents()
  }, [])

  useEffect(() => {
    // Reload events when user logs in/out to get fresh RSVP data
    if (user) {
      loadEvents()
    } else {
      setUserRSVPs({}) // Clear RSVPs when user logs out
    }
  }, [user])

  // Reload when page changes (pagination)
  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Reload when debounced search/filters change
  useEffect(() => {
    setPage(1)
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedFilters])

  const loadEvents = async () => {
    try {
      setLoading(true)
  const data = await eventsAPI.getAll({ ...debouncedFilters, search: debouncedSearch, skip, limit })
      setEvents(data)
      setLastPageCount(data.length)

      // Load user RSVPs if logged in
      if (user) {
        await loadUserRSVPs(data)
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPastEvents = async () => {
    try {
      setLoadingPast(true)
      const data = await eventsAPI.getAll({ include_past: true, include_inactive: true, limit: 50 })
      const now = new Date()
      const past = data.filter((ev) => {
        const endDate = ev.event_end ? new Date(ev.event_end) : new Date(ev.event_start)
        return endDate < now
      })
      past.sort((a, b) => {
        const aDate = new Date(a.event_end || a.event_start)
        const bDate = new Date(b.event_end || b.event_start)
        return bDate - aDate // newest past first
      })
      setPastEvents(past)
    } catch (error) {
      console.error('Failed to load past events:', error)
    } finally {
      setLoadingPast(false)
    }
  }

  // Scroll and highlight effect when coming from hero section
  useEffect(() => {
    if (!highlightEventId || loading || events.length === 0) return
    
    // Wait for DOM to be ready
    setTimeout(() => {
      const targetElement = eventRefs.current[highlightEventId]
      if (targetElement) {
        // Scroll to the event with smooth behavior
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add highlight effect
        targetElement.classList.add('ring-4', 'ring-primary-400', 'ring-opacity-75', 'shadow-2xl')
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          targetElement.classList.remove('ring-4', 'ring-primary-400', 'ring-opacity-75', 'shadow-2xl')
        }, 3000)
      }
    }, 100)
  }, [highlightEventId, loading, events])

  const loadUserRSVPs = async (eventsList) => {
    if (!user) return
    
    try {
      const rsvpMap = {}
      // Get user's RSVP status for each event
      await Promise.all(
        eventsList.map(async (event) => {
          try {
            const rsvps = await eventsAPI.getRSVPs(event.id)
            const userRSVP = rsvps.find(rsvp => rsvp.user_id === user.id)
            if (userRSVP) {
              rsvpMap[event.id] = userRSVP
            }
          } catch (error) {
            // If no RSVP found, continue
            console.log(`No RSVP found for event ${event.id}`)
          }
        })
      )
      setUserRSVPs(rsvpMap)
    } catch (error) {
      console.error('Failed to load user RSVPs:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const t0 = performance?.now?.() || 0
    console.debug('[DBG] events:search:start', { searchTerm, filters })
    // Reset to first page on new search
    setPage(1)
    loadEvents().finally(() => {
      const t1 = performance?.now?.() || 0
      console.debug('[DBG] events:search:done in', (t1 - t0).toFixed(1), 'ms')
    })
  }

  const handleRSVP = useCallback(async (eventId, status) => {
    try {
      const result = await eventsAPI.rsvp(eventId, status)
      import.meta.env.DEV && console.debug('[DBG] rsvp:ok', { eventId, status, result })

      // Determine new status:
      // - If event requires approval and user marked going/maybe, reflect waiting_for_approval immediately
      // - Otherwise, prefer server-returned status (string); fallback to requested status
      const ev = events.find(e => e.id === eventId)
      let newStatus
      if (ev?.requires_approval && (status === 'going' || status === 'maybe')) {
        newStatus = 'waiting_for_approval'
      } else if (typeof result?.status === 'string') {
        newStatus = result.status
      } else {
        newStatus = status
      }
      const prevStatus = userRSVPs[eventId]?.status
      const countsAsAttendee = (s) => s === 'going' || s === 'approved'
      const prevCount = prevStatus ? (countsAsAttendee(prevStatus) ? 1 : 0) : 0
      const nextCount = countsAsAttendee(newStatus) ? 1 : 0
      const delta = nextCount - prevCount

      // Update local RSVP map with full object if available
      setUserRSVPs(prev => ({
        ...prev,
        [eventId]: { ...(prev[eventId] || {}), status: newStatus, user_id: user.id }
      }))

      // Apply attendees_count delta
      if (delta !== 0) {
        setEvents(prev => prev.map(ev => {
          if (ev.id !== eventId) return ev
          return { ...ev, attendees_count: Math.max(0, (ev.attendees_count || 0) + delta) }
        }))
      }
    } catch (error) {
      console.error('RSVP failed:', error)
      import.meta.env.DEV && console.debug('[DBG] rsvp:fail', { eventId, status, error: error?.message })
      // Remove the optimistic update on error
      setUserRSVPs(prev => {
        const updated = { ...prev }
        delete updated[eventId]
        return updated
      })
    }
  }, [events, user, userRSVPs])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Discover Events</h1>
        
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border dark:border-gray-700">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>
          <div className="space-y-3">
            {/* Modern category chips */}
            <div className="flex flex-wrap gap-2">
              {[{key:'',label:'All'}, ...categories.map(c=>({key:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))].map(cat => (
                <button
                  key={cat.key || 'all'}
                  type="button"
                  onClick={() => setFilters({ ...filters, category: cat.key })}
                  className={`${filters.category===cat.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200'} px-3 py-1 rounded-full text-sm transition-colors`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Date + Location */}
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 md:col-span-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        events.length > 24 ? (
          <VirtualizedEventsGrid events={events} userRSVPs={userRSVPs} onRSVP={handleRSVP} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 will-change-transform" style={{
            contain: 'paint layout style',
          }}>
            {events.map((event) => (
              <div key={event.id} ref={(el) => eventRefs.current[event.id] = el}>
                <EventCard
                  event={event}
                  onRSVP={handleRSVP}
                  userRSVP={userRSVPs[event.id]}
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 text-lg">No events found matching your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md border ${page === 1 ? 'text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:bg-gray-900'}`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={lastPageCount < limit}
            className={`px-4 py-2 rounded-md border ${lastPageCount < limit ? 'text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:bg-gray-900'}`}
          >
            Next
          </button>
        </div>
      )}

      {/* Past Events */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Past Events</h2>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
            {pastEvents.length}
          </span>
        </div>

        {loadingPast ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : pastEvents.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No past events yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Event Ended</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{event.title}</h3>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Past</span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    <span>{format(new Date(event.event_end || event.event_start), 'MMM dd, yyyy • h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="line-clamp-1">{event.location || 'Location not specified'}</span>
                  </div>
                  {event.category && (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-md text-xs font-medium capitalize">{event.category}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                  <Link
                    to={`/events/${event.id}`}
                    className="text-primary-600 dark:text-primary-300 font-medium hover:underline text-sm"
                  >
                    View details
                  </Link>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{event.is_active ? 'Active' : 'Ended'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
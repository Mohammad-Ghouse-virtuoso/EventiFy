import { useState, useEffect } from 'react'
import { eventsAPI } from '../services/api'
import EventCard from '../components/EventCard'
import { useAuth } from '../contexts/AuthContext'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [userRSVPs, setUserRSVPs] = useState({}) // Store user's RSVP status for each event
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    location: ''
  })

  useEffect(() => {
    loadEvents()
  }, [filters])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsAPI.getAll({ ...filters, search: searchTerm })
      setEvents(data)

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

  const loadUserRSVPs = async (eventsList) => {
    try {
      // For now, we'll simulate RSVP status tracking
      // In a real app, you'd have a getUserRSVPs API endpoint
      const rsvpMap = {}
      // We'll update this when user makes an RSVP
      setUserRSVPs(rsvpMap)
    } catch (error) {
      console.error('Failed to load user RSVPs:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadEvents()
  }

  const handleRSVP = async (eventId, status) => {
    try {
      await eventsAPI.rsvp(eventId, status)

      // Update local RSVP state immediately for better UX
      setUserRSVPs(prev => ({
        ...prev,
        [eventId]: { status }
      }))

      // Refresh events to update attendee count
      loadEvents()
    } catch (error) {
      console.error('RSVP failed:', error)
      // Remove the optimistic update on error
      setUserRSVPs(prev => {
        const updated = { ...prev }
        delete updated[eventId]
        return updated
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Discover Events</h1>
        
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="grid md:grid-cols-3 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="music">Music</option>
              <option value="tech">Technology</option>
              <option value="sports">Sports</option>
              <option value="food">Food & Drink</option>
              <option value="art">Art & Culture</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
              <option value="health">Health & Wellness</option>
              <option value="networking">Networking</option>
              <option value="entertainment">Entertainment</option>
            </select>

            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRSVP={handleRSVP}
              userRSVP={userRSVPs[event.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
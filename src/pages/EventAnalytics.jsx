import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { eventsAPI, adminAPI } from '../services/api'
import { CalendarIcon, EyeIcon, CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

export default function EventAnalytics() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [includePast, setIncludePast] = useState(true)
  const [openIds, setOpenIds] = useState({})

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, includePast])

  const load = async () => {
    if (!user) return
    try {
      setLoading(true)
      if (user.role === 'admin') {
        // Admin: show only events the admin created, with optional past
  // Backend: limit must be <= 100
  let mine = await eventsAPI.getAll({ created_by: user.id, include_past: includePast, include_inactive: true, limit: 100 })
        // Fallback: if none found (edge case), pull all and filter by organizer
        if (!Array.isArray(mine) || mine.length === 0) {
          const all = await adminAPI.getAllEventsWithRSVPs()
          mine = (all || []).filter(e => e.organizer_id === user.id)
        }
        const withRsvps = await Promise.all(mine.map(async (ev) => {
          try {
            const r = await adminAPI.getEventRSVPs(ev.id)
            return { ...ev, rsvps: Array.isArray(r) ? r : [] }
          } catch {
            return { ...ev, rsvps: [] }
          }
        }))
        setEvents(withRsvps)
      } else {
        // Organizer: only their events with RSVPs
  const mine = await eventsAPI.getAll({ created_by: user.id, include_past: includePast, include_inactive: true, limit: 100 })
        const withRsvps = await Promise.all(mine.map(async (ev) => {
          try {
            const r = await adminAPI.getEventRSVPs(ev.id)
            return { ...ev, rsvps: Array.isArray(r) ? r : [] }
          } catch {
            return { ...ev, rsvps: [] }
          }
        }))
        setEvents(withRsvps)
      }
    } finally {
      setLoading(false)
    }
  }

  const title = useMemo(() => 'Event Analytics', [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-gray-900">{title}</h1>
          <p className="text-gray-600">Review RSVP responses and attendee details</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includePast}
            onChange={(e) => setIncludePast(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Include past events
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-8 text-center text-gray-600">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          No events found
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const rsvps = event.rsvps || []
            const going = rsvps.filter(r => r.status === 'going').length
            const approved = rsvps.filter(r => r.status === 'approved').length
            const confirmed = going + approved
            const maybe = rsvps.filter(r => r.status === 'maybe').length
            const notGoing = rsvps.filter(r => r.status === 'not_going').length
            const eventDate = new Date(event.event_start)
            const showDetails = !!openIds[event.id]
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {event.location} • {eventDate.toLocaleDateString()}
                      {event.organizer_name && event.organizer_role !== 'admin' && (
                        <span className="ml-2 text-gray-500">by {event.organizer_name}</span>
                      )}
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary text-sm inline-flex items-center"
                    onClick={() => setOpenIds(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" /> {showDetails ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-1" />
                      <span className="font-semibold text-success-600">{confirmed}</span>
                    </div>
                    <p className="text-xs text-gray-600">Attending</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-warning-500 mr-1" />
                      <span className="font-semibold text-warning-600">{maybe}</span>
                    </div>
                    <p className="text-xs text-gray-600">Maybe</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <XCircleIcon className="h-5 w-5 text-error-500 mr-1" />
                      <span className="font-semibold text-error-600">{notGoing}</span>
                    </div>
                    <p className="text-xs text-gray-600">Can't Go</p>
                  </div>
                </div>

                {showDetails && (
                  <div className="border-t pt-4 animate-slide-up">
                    <h4 className="font-medium text-gray-900 mb-3">Attendee Responses ({rsvps.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {rsvps.map((rsvp) => (
                        <div key={rsvp.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{rsvp.user?.full_name || rsvp.user?.email || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">{rsvp.user?.email || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            rsvp.status === 'going' ? 'bg-success-100 text-success-800' :
                            rsvp.status === 'maybe' ? 'bg-warning-100 text-warning-800' :
                            rsvp.status === 'not_going' ? 'bg-error-100 text-error-800' :
                            rsvp.status === 'approved' ? 'bg-success-100 text-success-900' :
                            rsvp.status === 'waiting_for_approval' ? 'bg-warning-100 text-warning-800' :
                            rsvp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {String(rsvp.status).toUpperCase().replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

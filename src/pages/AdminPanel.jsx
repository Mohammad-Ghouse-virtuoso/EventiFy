import { useState, useEffect } from 'react'
import { eventsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  CalendarDaysIcon, 
  UsersIcon, 
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

export default function AdminPanel() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [rsvpData, setRsvpData] = useState({})

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData()
    }
  }, [user])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const eventsData = await eventsAPI.getAll()
      setEvents(eventsData)
      
      // Simulate RSVP data - In real app, you'd have an admin API endpoint
      const mockRsvpData = {}
      eventsData.forEach(event => {
        mockRsvpData[event.id] = {
          going: Math.floor(Math.random() * 20) + 5,
          maybe: Math.floor(Math.random() * 10) + 2,
          not_going: Math.floor(Math.random() * 5) + 1,
          attendees: [
            { id: 1, name: 'John Doe', email: 'john@example.com', status: 'going' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'maybe' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'going' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'not_going' },
            { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'going' },
          ]
        }
      })
      setRsvpData(mockRsvpData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'going':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />
      case 'maybe':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-warning-500" />
      case 'not_going':
        return <XCircleIcon className="h-5 w-5 text-error-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'going':
        return 'bg-success-100 text-success-800'
      case 'maybe':
        return 'bg-warning-100 text-warning-800'
      case 'not_going':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-md">
          Access denied. Admin privileges required.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const totalEvents = events.length
  const totalRSVPs = Object.values(rsvpData).reduce((sum, event) => 
    sum + event.going + event.maybe + event.not_going, 0
  )
  const totalGoing = Object.values(rsvpData).reduce((sum, event) => sum + event.going, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-display-md text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor events and user engagement across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 hover-lift">
          <div className="flex items-center">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center">
            <div className="bg-gradient-success p-3 rounded-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
              <p className="text-2xl font-bold text-gray-900">{totalRSVPs}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center">
            <div className="bg-gradient-secondary p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed Attendees</p>
              <p className="text-2xl font-bold text-gray-900">{totalGoing}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Analytics</h2>
        
        <div className="space-y-4">
          {events.map((event) => {
            const eventRsvp = rsvpData[event.id] || { going: 0, maybe: 0, not_going: 0, attendees: [] }
            const totalEventRsvps = eventRsvp.going + eventRsvp.maybe + eventRsvp.not_going
            
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-gray-600 text-sm">{event.location} • {new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                    className="btn btn-secondary text-sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {selectedEvent === event.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {/* RSVP Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-1" />
                      <span className="font-semibold text-success-600">{eventRsvp.going}</span>
                    </div>
                    <p className="text-xs text-gray-600">Going</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-warning-500 mr-1" />
                      <span className="font-semibold text-warning-600">{eventRsvp.maybe}</span>
                    </div>
                    <p className="text-xs text-gray-600">Maybe</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <XCircleIcon className="h-5 w-5 text-error-500 mr-1" />
                      <span className="font-semibold text-error-600">{eventRsvp.not_going}</span>
                    </div>
                    <p className="text-xs text-gray-600">Can't Go</p>
                  </div>
                </div>

                {/* Detailed Attendee List */}
                {selectedEvent === event.id && (
                  <div className="border-t pt-4 animate-slide-up">
                    <h4 className="font-medium text-gray-900 mb-3">Attendee Responses ({totalEventRsvps})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {eventRsvp.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{attendee.name}</p>
                            <p className="text-sm text-gray-600">{attendee.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(attendee.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendee.status)}`}>
                              {attendee.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No events found</p>
          </div>
        )}
      </div>
    </div>
  )
}

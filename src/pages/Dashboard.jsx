import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { eventsAPI } from '../services/api'
import { PlusIcon, CalendarIcon, UsersIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const [myEvents, setMyEvents] = useState([])
  const [rsvpEvents, setRsvpEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('created')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [created, rsvps] = await Promise.all([
        eventsAPI.getAll({ created_by: user.id }),
        eventsAPI.getAll({ rsvp_status: 'going' })
      ])
      setMyEvents(created)
      setRsvpEvents(rsvps)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(eventId)
        setMyEvents(myEvents.filter(event => event.id !== eventId))
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }

  // Create stats based on user role
  const stats = [
    {
      name: 'Events Created',
      value: myEvents.length,
      icon: CalendarIcon,
      color: 'bg-blue-500'
    },
    // Only show "Events Attending" for non-admin users
    ...(user?.role !== 'admin' ? [{
      name: 'Events Attending',
      value: rsvpEvents.length,
      icon: UsersIcon,
      color: 'bg-green-500'
    }] : []),
    {
      name: 'Total Attendees',
      value: myEvents.reduce((sum, event) => sum + (event.attendees_count || 0), 0),
      icon: QrCodeIcon,
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.full_name}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'admin' && 'Admin Dashboard - Manage platform and users'}
          {user?.role === 'organizer' && 'Organizer Dashboard - Manage your events and track attendance'}
          {user?.role === 'attendee' && 'Your Dashboard - Discover and attend amazing events'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <Link
              to="/create-event"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Event
            </Link>
          )}
          <Link
            to="/events"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Browse Events
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'created'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Events ({myEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('attending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Attending ({rsvpEvents.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'created' ? (
            <div className="space-y-4">
              {myEvents.length > 0 ? (
                myEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(event.date), 'PPP')} at {event.time}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {event.attendees_count} / {event.max_attendees} attendees
                        </div>
                      </div>
                      {/* Only show edit/delete for organizers and admins */}
                      {(user?.role === 'organizer' || user?.role === 'admin') && (
                        <div className="flex space-x-2 ml-4">
                          <Link
                            to={`/events/${event.id}/edit`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {user?.role === 'attendee' ? (
                    <>
                      <p className="text-gray-600">You haven't created any events yet.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        As an attendee, you can discover and join amazing events created by others!
                      </p>
                      <Link
                        to="/events"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Browse Events
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">You haven't created any events yet.</p>
                      <Link
                        to="/create-event"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Create your first event
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {rsvpEvents.length > 0 ? (
                rsvpEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {format(new Date(event.date), 'PPP')} at {event.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You're not attending any events yet.</p>
                  <Link
                    to="/events"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Browse events to attend
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { eventsAPI } from '../services/api'
import { PlusIcon, CalendarIcon, UsersIcon, QrCodeIcon, PhotoIcon, PencilIcon, CameraIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import BannerSelector from '../components/BannerSelector'
import AvatarSelector from '../components/AvatarSelector'

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentAvatar, userBanner, updateAvatar, updateBanner } = useProfile()
  const [myEvents, setMyEvents] = useState([])
  const [rsvpEvents, setRsvpEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('created')
  const [bannerSelectorOpen, setBannerSelectorOpen] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // Set default tab based on user role
    if (user?.role === 'attendee') {
      setActiveTab('rsvp')
    }
  }, [user])

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

  const handleBannerSelect = (banner) => {
    updateBanner(banner)
  }

  const handleAvatarSelect = (avatar) => {
    updateAvatar(avatar)
  }

  // Create stats based on user role
  const stats = [
    // Only show "Events Created" for organizers and admins
    ...(user?.role !== 'attendee' ? [{
      name: 'Events Created',
      value: myEvents.length,
      icon: CalendarIcon,
      color: 'bg-blue-500'
    }] : []),
    // Only show "Events Attending" for non-admin users
    ...(user?.role !== 'admin' ? [{
      name: 'Events Attending',
      value: rsvpEvents.length,
      icon: UsersIcon,
      color: 'bg-green-500'
    }] : []),
    // Only show "Total Attendees" for organizers and admins
    ...(user?.role !== 'attendee' ? [{
      name: 'Total Attendees',
      value: myEvents.reduce((sum, event) => sum + (event.attendees_count || 0), 0),
      icon: QrCodeIcon,
      color: 'bg-purple-500'
    }] : [])
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
      {/* Banner Section */}
      <div className="relative mb-8 rounded-lg overflow-hidden shadow-lg">
        {userBanner ? (
          <div className="relative h-48 md:h-64">
            <img
              src={userBanner.url}
              alt={userBanner.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="relative group"
                  >
                    {currentAvatar ? (
                      <img
                        src={currentAvatar.image}
                        alt={currentAvatar.name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-white group-hover:border-primary-200 transition-colors"
                        onError={(e) => {
                          e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                              <rect width="64" height="64" fill="#e5e7eb"/>
                              <path d="M32 32a10 10 0 1 0-10-10 10 10 0 0 0 10 10zm0 5c-6.67 0-20 3.33-20 10v5h40v-5c0-6.67-13.33-10-20-10z" fill="#9ca3af"/>
                            </svg>
                          `)}`
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <span className="text-white font-bold text-2xl">
                          {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-50 transition-colors">
                      <CameraIcon className="w-3 h-3 text-gray-600" />
                    </div>
                  </button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      Welcome, {user?.full_name}!
                    </h1>
                    <p className="text-lg opacity-90">
                      {user?.role === 'admin' && 'Admin Dashboard - Manage platform and users'}
                      {user?.role === 'organizer' && 'Organizer Dashboard - Manage your events and track attendance'}
                      {user?.role === 'attendee' && 'Your Dashboard - Discover and attend amazing events'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setBannerSelectorOpen(true)}
                className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-all duration-200"
                title="Change Banner"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  className="relative group mr-4"
                >
                  {currentAvatar ? (
                    <img
                      src={currentAvatar.image}
                      alt={currentAvatar.name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-white group-hover:border-primary-200 transition-colors"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                            <rect width="64" height="64" fill="#e5e7eb"/>
                            <path d="M32 32a10 10 0 1 0-10-10 10 10 0 0 0 10 10zm0 5c-6.67 0-20 3.33-20 10v5h40v-5c0-6.67-13.33-10-20-10z" fill="#9ca3af"/>
                          </svg>
                        `)}`
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                      <span className="text-white font-bold text-2xl">
                        {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-50 transition-colors">
                    <CameraIcon className="w-3 h-3 text-gray-600" />
                  </div>
                </button>
                <PhotoIcon className="h-16 w-16 opacity-70" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome, {user?.full_name}!
              </h1>
              <p className="text-lg opacity-90 mb-4">
                {user?.role === 'admin' && 'Admin Dashboard - Manage platform and users'}
                {user?.role === 'organizer' && 'Organizer Dashboard - Manage your events and track attendance'}
                {user?.role === 'attendee' && 'Your Dashboard - Discover and attend amazing events'}
              </p>
              <button
                onClick={() => setBannerSelectorOpen(true)}
                className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center mx-auto"
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Choose Banner
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        {/* Removed the duplicate welcome section since it's now in the banner */}
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
            {user?.role !== 'attendee' && (
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
            )}
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
          {(activeTab === 'created' && user?.role !== 'attendee') ? (
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
                          {format(new Date(event.date), 'PPP')} at {formatTime(event.time)}
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
                  <p className="text-gray-600">You haven't created any events yet.</p>
                  <Link
                    to="/create-event"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Create your first event
                  </Link>
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
                      {format(new Date(event.date), 'PPP')} at {formatTime(event.time)}
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

      {/* Banner Selector Modal */}
      <BannerSelector
        userRole={user?.role}
        currentBanner={userBanner}
        onBannerSelect={handleBannerSelect}
        isOpen={bannerSelectorOpen}
        onClose={() => setBannerSelectorOpen(false)}
      />

      {/* Avatar Selector Modal */}
      <AvatarSelector
        userRole={user?.role}
        currentAvatar={currentAvatar}
        onAvatarSelect={handleAvatarSelect}
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </div>
  )
}
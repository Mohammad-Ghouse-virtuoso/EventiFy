import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { useNotification } from '../contexts/NotificationContext'
import { eventsAPI, adminAPI } from '../services/api'
import { PlusIcon, CalendarIcon, UsersIcon, QrCodeIcon, PhotoIcon, PencilIcon, CameraIcon, CheckCircleIcon, XCircleIcon, UserGroupIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import BannerSelector from '../components/BannerSelector'
import AvatarSelector from '../components/AvatarSelector'
import EventTimer from '../components/EventTimer'

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

// Helper function to get time until event with color coding
const getEventReminder = (eventStartTime) => {
  const now = new Date()
  const eventStart = new Date(eventStartTime)
  const diffMs = eventStart - now
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.floor(diffHours / 24)
  const remainingHours = Math.floor(diffHours % 24)

  if (diffHours <= 0) return null // Event already started or passed
  
  let color = ''
  let text = ''
  
  if (diffHours <= 24) {
    // Red for events within 24 hours
    color = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
    text = diffHours < 1 ? '<1h' : `${Math.floor(diffHours)}h`
  } else if (diffHours <= 48) {
    // Yellow for events within 48 hours
    color = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
    text = diffDays === 1 ? `1d/${remainingHours}h` : `${diffDays}d/${remainingHours}h`
  } else {
    return null // No reminder needed for events more than 48 hours away
  }
  
  return { color, text }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentAvatar, userBanner, updateAvatar, updateBanner } = useProfile()
  const { showSuccess, showError } = useNotification()
  const [myEvents, setMyEvents] = useState([])
  const [rsvpEvents, setRsvpEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('created')
  const [bannerSelectorOpen, setBannerSelectorOpen] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [pendingRSVPs, setPendingRSVPs] = useState({})
  const [showRSVPManagement, setShowRSVPManagement] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('upcoming')

  useEffect(() => {
    loadDashboardData()
    // Set default tab based on user role
    if (user?.role === 'attendee') {
      setActiveTab('rsvp')
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [created, rsvps] = await Promise.all([
        eventsAPI.getAll({ created_by: user.id }),
        // Fetch attending events for the current user only (confirmed attendees)
        eventsAPI.getAll({ rsvp_status: 'going,approved', rsvp_user_id: user.id })
      ])
      setMyEvents(created)
      setRsvpEvents(rsvps)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem('dashboard_attendee_sort') || 'upcoming'
    setSortBy(savedSort)
  }, [])

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_attendee_sort', sortBy)
  }, [sortBy])

  const loadPendingRSVPs = async (eventId) => {
    try {
      const pending = await adminAPI.getPendingRSVPs(eventId)
      setPendingRSVPs(prev => ({ ...prev, [eventId]: pending }))
    } catch (error) {
      console.error('Failed to load pending RSVPs:', error)
    }
  }

  const handleApproveRSVP = async (eventId, rsvpId) => {
    try {
      await adminAPI.approveRSVP(eventId, rsvpId)
      // Reload data to update UI
      await loadPendingRSVPs(eventId)
      await loadDashboardData()
      showSuccess('RSVP approved successfully!')
    } catch (error) {
      console.error('Failed to approve RSVP:', error)
      showError('Failed to approve RSVP')
    }
  }

  const handleRejectRSVP = async (eventId, rsvpId) => {
    try {
      await adminAPI.rejectRSVP(eventId, rsvpId)
      // Reload data to update UI
      await loadPendingRSVPs(eventId)
      await loadDashboardData()
      showSuccess('RSVP rejected successfully')
    } catch (error) {
      console.error('Failed to reject RSVP:', error)
      showError('Failed to reject RSVP')
    }
  }

  const toggleRSVPManagement = (eventId) => {
    setShowRSVPManagement(prev => ({ ...prev, [eventId]: !prev[eventId] }))
    if (!pendingRSVPs[eventId]) {
      loadPendingRSVPs(eventId)
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

  // Compute filtered and sorted events
  const filteredEvents = useMemo(() => {
    let result = rsvpEvents

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      )
    }

    // Sort
    const sorted = [...result]
    switch (sortBy) {
      case 'upcoming':
        sorted.sort((a, b) =>
          new Date(a.event_start) - new Date(b.event_start)
        )
        break
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'added':
        // Reverse order (most recent first)
        sorted.reverse()
        break
      case 'distance':
        // Placeholder for future implementation
        break
    }

    return sorted
  }, [rsvpEvents, searchQuery, sortBy])

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
      icon: UserGroupIcon,
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
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <span className="text-white font-bold text-2xl">
                          {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md group-hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <CameraIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
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
                className="absolute top-4 right-4 bg-white dark:bg-gray-800 bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-all duration-200"
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
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                      <span className="text-white font-bold text-2xl">
                        {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md group-hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                    <CameraIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
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
                className="bg-white dark:bg-gray-800 bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center mx-auto"
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
          <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
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
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Browse Events
          </Link>
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <Link
              to="/event-analytics"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Event Analytics
            </Link>
          )}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {user?.role !== 'attendee' && (
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'created'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                My Events ({myEvents.length})
              </button>
            )}
            {user?.role !== 'admin' && (
              <button
                onClick={() => setActiveTab('attending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                Attending ({rsvpEvents.length})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {(activeTab === 'created' && user?.role !== 'attendee') ? (
            <div className="space-y-4">
              {myEvents.length > 0 ? (
                myEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(event.event_start), 'PPP')} at {formatTime(new Date(event.event_start).toISOString().split('T')[1]?.slice(0,5))}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {event.attendees_count} / {event.max_attendees} attendees
                        </div>
                        {/* RSVP Management for events that require approval */}
                        {event.requires_approval && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleRSVPManagement(event.id)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              {showRSVPManagement[event.id] ? 'Hide' : 'Manage'} RSVP Approvals
                            </button>
                            {showRSVPManagement[event.id] && (
                              <div className="mt-3 border-t pt-3">
                                <div className="space-y-2">
                                  {pendingRSVPs[event.id]?.length > 0 ? (
                                    pendingRSVPs[event.id].map((rsvp) => (
                                      <div key={rsvp.rsvp_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {rsvp.first_name} {rsvp.last_name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Status: {rsvp.status} • RSVP ID: {rsvp.rsvp_id}
                                          </p>
                                        </div>
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleApproveRSVP(event.id, rsvp.rsvp_id)}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                                          >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            <span>Approve</span>
                                          </button>
                                          <button
                                            onClick={() => handleRejectRSVP(event.id, rsvp.rsvp_id)}
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                                          >
                                            <XCircleIcon className="h-4 w-4" />
                                            <span>Reject</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">No pending RSVPs</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
                  <p className="text-gray-600 dark:text-gray-300">You haven't created any events yet.</p>
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
            <div>
              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white bg-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="added">Recently Added</option>
                  <option value="distance">Distance</option>
                </select>
              </div>

              {/* Event Count */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Attending Events ({filteredEvents.length})
              </p>

              {/* Events List */}
              <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const reminder = getEventReminder(event.event_start)
                    return (
                      <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          {reminder && (
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${reminder.color}`}>
                              {reminder.text}
                            </span>
                          )}
                          <EventTimer eventStartTime={event.event_start} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-32">{event.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(event.event_start), 'PPP')} at {formatTime(new Date(event.event_start).toISOString().split('T')[1]?.slice(0,5))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">
                      {searchQuery ? 'No events match your search.' : "You're not attending any events yet."}
                    </p>
                    {!searchQuery && (
                      <Link
                        to="/events"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Browse events to attend
                      </Link>
                    )}
                  </div>
                )}
              </div>
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
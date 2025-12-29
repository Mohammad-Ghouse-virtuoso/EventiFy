import { useState, useEffect } from 'react'
import { eventsAPI, adminAPI, testimonialsAPI } from '../services/api'
import { computeRsvpStats } from '../utils/rsvpCounts'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { useNotification } from '../contexts/NotificationContext'
import AvatarSelector from '../components/AvatarSelector'
import { 
  CalendarDaysIcon, 
  UsersIcon, 
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  CameraIcon,
  UserGroupIcon,
  StarIcon as StarIconOutline,
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

export default function AdminPanel() {
  const { user } = useAuth()
  const { currentAvatar, updateAvatar } = useProfile()
  const { showSuccess, showError } = useNotification()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [rsvpData, setRsvpData] = useState({})
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [pendingRSVPs, setPendingRSVPs] = useState({})
  const [showPendingRSVPs, setShowPendingRSVPs] = useState(false)
  const [showWhoIsGoing, setShowWhoIsGoing] = useState(true)
  const [revealEmailsByEvent, setRevealEmailsByEvent] = useState({})
  const [activeTab, setActiveTab] = useState('events')
  const [testimonials, setTestimonials] = useState([])
  const [testimonialLoading, setTestimonialLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'testimonials') {
      loadTestimonials()
    }
  }, [activeTab])

  const loadTestimonials = async () => {
    try {
      setTestimonialLoading(true)
      const data = await testimonialsAPI.adminList({ limit: 100 })
      setTestimonials(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load testimonials:', error)
      showError('Failed to load testimonials')
    } finally {
      setTestimonialLoading(false)
    }
  }

  const handleApproveTestimonial = async (id) => {
    try {
      await testimonialsAPI.adminUpdate(id, { is_approved: true })
      await loadTestimonials()
      showSuccess('Testimonial approved!')
    } catch (error) {
      console.error('Failed to approve:', error)
      showError('Failed to approve testimonial')
    }
  }

  const handleFeatureTestimonial = async (id) => {
    try {
      await testimonialsAPI.adminUpdate(id, { is_featured: true })
      await loadTestimonials()
      showSuccess('Testimonial featured!')
    } catch (error) {
      console.error('Failed to feature:', error)
      showError('Failed to feature testimonial')
    }
  }

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return
    try {
      await testimonialsAPI.adminDelete(id)
      await loadTestimonials()
      showSuccess('Testimonial deleted!')
    } catch (error) {
      console.error('Failed to delete:', error)
      showError('Failed to delete testimonial')
    }
  }

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const eventsWithRSVPs = await adminAPI.getAllEventsWithRSVPs()
      setEvents(eventsWithRSVPs)
      
      // Process RSVP data for dashboard
      const processed = {}
      eventsWithRSVPs.forEach(event => {
        processed[event.id] = computeRsvpStats(event.rsvps || [])
      })
      setRsvpData(processed)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Status icon/color helpers (used in pending RSVPs list badges if needed later)
  const getStatusIcon = (status) => {
    switch (status) {
      case 'going':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-success-600" />
      case 'maybe':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-warning-500" />
      case 'not_going':
        return <XCircleIcon className="h-5 w-5 text-error-500" />
      case 'waiting_for_approval':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-warning-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'going':
        return 'bg-success-100 text-success-800'
      case 'approved':
        return 'bg-success-100 text-success-900'
      case 'maybe':
        return 'bg-warning-100 text-warning-800'
      case 'not_going':
        return 'bg-error-100 text-error-800'
      case 'waiting_for_approval':
        return 'bg-warning-100 text-warning-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAvatarSelect = (avatar) => {
    updateAvatar(avatar)
  }

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
      await loadPendingRSVPs(eventId)
      await loadAdminData()
      showSuccess('RSVP approved successfully!')
    } catch (error) {
      console.error('Failed to approve RSVP:', error)
      showError('Failed to approve RSVP')
    }
  }

  const handleRejectRSVP = async (eventId, rsvpId) => {
    try {
      await adminAPI.rejectRSVP(eventId, rsvpId)
      await loadPendingRSVPs(eventId)
      await loadAdminData()
      showSuccess('RSVP rejected successfully')
    } catch (error) {
      console.error('Failed to reject RSVP:', error)
      showError('Failed to reject RSVP')
    }
  }

  // Guard non-admins
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
  const totalRSVPs = Object.values(rsvpData).reduce((sum, s) => 
    sum + s.confirmed + s.maybe + s.notGoing + s.pending + s.rejected, 0
  , 0)
  const totalGoing = Object.values(rsvpData).reduce((sum, s) => sum + s.confirmed, 0)
  const totalPending = Object.values(rsvpData).reduce((sum, s) => sum + s.pending, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display-md text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor events and user engagement across the platform</p>
        </div>
        
        {/* Admin Avatar Section */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Welcome, {user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <button
            onClick={() => setShowAvatarSelector(true)}
            className="relative group"
          >
            {currentAvatar ? (
              <img
                src={currentAvatar.image}
                alt={currentAvatar.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-200 group-hover:border-primary-400 transition-colors"
                onError={(e) => {
                  e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <rect width="48" height="48" fill="#e5e7eb"/>
                      <path d="M24 24a8 8 0 1 0-8-8 8 8 0 0 0 8 8zm0 4c-5.33 0-16 2.67-16 8v4h32v-4c0-5.33-10.67-8-16-8z" fill="#9ca3af"/>
                    </svg>
                  `)}`
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center group-hover:from-primary-600 group-hover:to-primary-700 transition-all">
                <span className="text-white font-semibold text-lg">
                  {user?.full_name?.[0] || user?.email?.[0] || 'A'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md group-hover:bg-gray-50 transition-colors">
              <CameraIcon className="w-3 h-3 text-gray-600" />
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'events'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Events & RSVPs
        </button>
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'testimonials'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Testimonials Moderation
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <>


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
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed Attendees</p>
              <p className="text-2xl font-bold text-gray-900">{totalGoing}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 hover-lift">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending RSVPs Section */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Pending RSVP Approvals</h2>
          <button
            onClick={() => setShowPendingRSVPs(!showPendingRSVPs)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {showPendingRSVPs ? 'Hide' : 'Show'} Pending RSVPs
          </button>
        </div>
        
        {showPendingRSVPs && (
          <div className="space-y-4">
            {events.filter(event => event.requires_approval).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No events require RSVP approval</p>
            ) : (
              events.filter(event => event.requires_approval).map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      {event.title}
                      {event.organizer_name && (
                        <span className="ml-2 text-gray-500 text-sm">(made by {event.organizer_name})</span>
                      )}
                    </h3>
                    <button
                      onClick={() => loadPendingRSVPs(event.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Load Pending RSVPs
                    </button>
                  </div>
                  
                  {pendingRSVPs[event.id] && (
                    <div className="space-y-2">
                      {pendingRSVPs[event.id].length === 0 ? (
                        <p className="text-sm text-gray-500">No pending RSVPs</p>
                      ) : (
                        pendingRSVPs[event.id].map((rsvp) => (
                          <div key={rsvp.rsvp_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                            <div>
                              <p className="font-medium text-gray-900">{rsvp.first_name} {rsvp.last_name}</p>
                              <p className="text-sm text-gray-600">{rsvp.user_email}</p>
                              {event.organizer_name && (
                                <p className="text-xs text-gray-500 mt-0.5">Organizer: {event.organizer_name}</p>
                              )}
                              {rsvp.notes && (
                                <p className="text-sm text-gray-500 mt-1">Note: {rsvp.notes}</p>
                              )}
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
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

  {/* Who's Going: upcoming events */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who's going (upcoming)</h2>
          <button
            onClick={() => setShowWhoIsGoing(!showWhoIsGoing)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {showWhoIsGoing ? 'Hide' : 'Show'} Going Lists
          </button>
        </div>

        {showWhoIsGoing && (
          <div className="space-y-4">
            {events
              .filter(e => {
                // Upcoming: event_start in future or today
                try {
                  const now = new Date()
                  const start = new Date(e.event_start)
                  return start >= now
                } catch {
                  return false
                }
              })
              .map((event) => {
                const stats = rsvpData[event.id] || { attendees: [], confirmed: 0 }
                const confirmed = (stats.attendees || []).filter(a => a.status === 'going' || a.status === 'approved')
                return (
                  <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                        {event.organizer_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Organizer: {event.organizer_name}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                          Confirmed: {confirmed.length}
                        </span>
                        <button
                          onClick={() => setRevealEmailsByEvent(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {revealEmailsByEvent[event.id] ? 'Hide emails' : 'Show emails'}
                        </button>
                      </div>
                    </div>

                    {confirmed.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No confirmed attendees yet.</p>
                    ) : (
                      <>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {confirmed.slice(0, revealEmailsByEvent[`expand_${event.id}`] ? confirmed.length : 10).map((a, idx) => (
                            <li key={idx} className="py-2 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusColor(a.status)}`}>
                                  {getStatusIcon(a.status)}
                                  <span className="ml-1 capitalize">{a.status}</span>
                                </span>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {a.name}
                                </span>
                              </div>
                              {revealEmailsByEvent[event.id] && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">{a.email || 'N/A'}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        {confirmed.length > 10 && (
                          <div className="mt-3 text-center">
                            <button
                              onClick={() => setRevealEmailsByEvent(prev => ({ ...prev, [`expand_${event.id}`]: !prev[`expand_${event.id}`] }))}
                              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                            >
                              {revealEmailsByEvent[`expand_${event.id}`] 
                                ? '▲ Show less' 
                                : `▼ Show all ${confirmed.length} attendees`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>

      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Testimonials Moderation</h2>
            <p className="text-sm text-gray-600 mt-1">Review and manage user testimonials</p>
          </div>

          {testimonialLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No testimonials yet</p>
          ) : (
            <div className="space-y-4">
              {testimonials.map((t) => (
                <div key={t.id} className={`border rounded-lg p-4 ${t.is_approved ? 'bg-white border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{t.user_name || 'Unknown User'}</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${i < t.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        {!t.is_approved && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pending</span>}
                        {t.is_featured && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Featured</span>}
                      </div>
                      <p className="text-gray-700 text-sm italic mb-2">"{t.quote}"</p>
                      <p className="text-xs text-gray-500">Submitted {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!t.is_approved && (
                      <button
                        onClick={() => handleApproveTestimonial(t.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </button>
                    )}
                    {t.is_approved && !t.is_featured && (
                      <button
                        onClick={() => handleFeatureTestimonial(t.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <StarIconOutline className="h-4 w-4" />
                        Feature
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTestimonial(t.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AvatarSelector
        userRole="admin"
        currentAvatar={currentAvatar}
        onAvatarSelect={handleAvatarSelect}
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </div>
  )
}

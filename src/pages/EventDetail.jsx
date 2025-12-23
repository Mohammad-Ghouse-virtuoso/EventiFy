import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { eventsAPI, bookmarkAPI } from '../services/api'
import { format } from 'date-fns'
import { ArrowLeftIcon, HeartIcon, ShareIcon, CalendarIcon, MapPinIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import placeholderImg from '../../assets/doodle.png'
import EventEssentials from '../components/event-detail/EventEssentials'
import OrganizerCard from '../components/event-detail/OrganizerCard'
import EventDescription from '../components/event-detail/EventDescription'
import TermsSection from '../components/event-detail/TermsSection'
import QASection from '../components/event-detail/QASection'
import ActionBar from '../components/event-detail/ActionBar'
import AdminEventEditModal from '../components/event-detail/AdminEventEditModal'
import ShareButtons from '../components/ShareButtons'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useNotification()
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [hasUsedEdit, setHasUsedEdit] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Check if current user is the organizer
  const isOrganizer = event && user && event.organizer_id === user.id
  const isAdmin = user?.role === 'admin' || user?.role === 'UserRole.ADMIN'

  // Fetch event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        const data = await eventsAPI.getById(id)
        setEvent(data)
        
        // Check if user has bookmarked
        if (user) {
          try {
            const isBookmarkedData = await bookmarkAPI.isBookmarked(id)
            setIsBookmarked(isBookmarkedData)
          } catch (err) {
            console.log('Could not fetch bookmark status')
          }
          
          // Get user's RSVP status (only if authenticated)
          if (user?.id) {
            try {
              const rsvps = await eventsAPI.getRSVPs(id)
              const userRsvp = rsvps.find(r => r.user_id === user.id)
              if (userRsvp) {
                setRsvpStatus(userRsvp.status)
              }
              const editKey = `hasEdited_${user?.id}_${id}`
              setHasUsedEdit(localStorage.getItem(editKey) === 'true')
            } catch (err) {
              // Silent fail - 401 is expected if not authenticated or endpoint fails
              console.debug('Could not fetch RSVP status:', err?.response?.status)
            }
          }
        }
      } catch (err) {
        setError(err.message)
        showError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id, user])

  const handleBookmark = async () => {
    if (!user) {
      showInfo('Please log in to bookmark events')
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }

    try {
      if (isBookmarked) {
        // Unbookmark
        await bookmarkAPI.unbookmark(id)
        setIsBookmarked(false)
        showSuccess('Removed from bookmarks')
      } else {
        // Bookmark
        await bookmarkAPI.bookmark(id)
        setIsBookmarked(true)
        showSuccess('Event bookmarked!')
      }
    } catch (err) {
      showError('Failed to update bookmark')
    }
  }

  const handleRSVP = async (status, options = {}) => {
    if (!user) {
      showInfo('Please log in to RSVP')
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return false
    }

    try {
      const result = await eventsAPI.rsvp(id, status)
      let nextStatus = status
      if (event?.requires_approval && (status === 'going' || status === 'maybe')) {
        nextStatus = 'waiting_for_approval'
      } else if (typeof result?.status === 'string') {
        nextStatus = result.status
      }
      setRsvpStatus(nextStatus)

      if (options.lockAfterEdit) {
        const editKey = `hasEdited_${user.id}_${id}`
        localStorage.setItem(editKey, 'true')
        setHasUsedEdit(true)
      }

      if (event?.requires_approval) {
        showInfo('RSVP sent for organizer approval')
      } else {
        showSuccess(`You are now marked as "${nextStatus}"`)
      }
      return true
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to update RSVP'
      showError(detail)
      return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
          <button
            onClick={() => navigate('/events')}
            className="text-primary-500 hover:text-primary-600"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    )
  }

  // Derive backend origin for static assets
  const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1'
  // Backend origin: if VITE_API_URL is absolute, use it; else use current origin (for proxied dev)
  const backendOrigin = /^https?:\/\//i.test(apiBase)
    ? new URL(apiBase).origin
    : window.location.origin
  const imageSrc = event?.image || event?.thumbnail || null
  // Build full URL: absolute URLs pass through; /static/ paths get backend origin prepended
  const fullImageUrl = imageSrc
    ? /^https?:\/\//i.test(imageSrc)
      ? imageSrc
      : imageSrc.startsWith('/static/')
        ? `${backendOrigin}${imageSrc}`
        : imageSrc
    : placeholderImg

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleBookmark}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              {isBookmarked ? (
                <HeartIconSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <ShareIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>

              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-80 z-50">
                  <ShareButtons
                    eventTitle={event.title}
                    eventUrl={window.location.href}
                    eventDate={format(new Date(event.event_start), 'PPP p')}
                    onClose={() => setShowShareMenu(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Image */}
        <div className="h-96 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
          <img
            src={fullImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = placeholderImg
            }}
          />
        </div>

        {/* Event Essentials */}
        <EventEssentials event={event} />

        {/* Organizer Card */}
        <OrganizerCard event={event} />

        {/* Description */}
        <EventDescription event={event} />

        {/* Terms & Conditions */}
        <TermsSection event={event} />

        {/* Q&A Section */}
        <QASection event={event} />
      </div>

      {/* Organizer/Admin Edit Button */}
      {(isOrganizer || isAdmin) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isAdmin ? 'You can edit this event (Admin)' : 'You created this event'}
              </span>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Details
            </button>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      <AdminEventEditModal
        event={event}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={setEvent}
      />

      {/* Sticky Action Bar - Only for non-organizers */}
      {!isOrganizer && !isAdmin && (
        <ActionBar
          event={event}
          rsvpStatus={rsvpStatus}
          onRSVP={handleRSVP}
          onBookmark={handleBookmark}
          isBookmarked={isBookmarked}
          hasUsedEdit={hasUsedEdit}
        />
      )}
    </div>
  )
}

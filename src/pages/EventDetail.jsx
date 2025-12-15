import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import ShareButtons from '../components/ShareButtons'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useNotification()
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState(null)
  const [showShareMenu, setShowShareMenu] = useState(false)

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
          
          // Get user's RSVP status
          try {
            const rsvps = await eventsAPI.getRSVPs(id)
            const userRsvp = rsvps.find(r => r.user_id === user.id)
            if (userRsvp) {
              setRsvpStatus(userRsvp.status)
            }
          } catch (err) {
            console.log('Could not fetch RSVP status')
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
      navigate('/login')
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

  const handleRSVP = async (status) => {
    if (!user) {
      showInfo('Please log in to RSVP')
      navigate('/login')
      return
    }

    try {
      await eventsAPI.rsvp(id, { status })
      setRsvpStatus(status)
      
      if (event?.requires_approval) {
        showInfo('RSVP sent for organizer approval')
      } else {
        showSuccess(`You are now marked as "${status}"`)
      }
    } catch (err) {
      showError('Failed to update RSVP')
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

  const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1'
  const imageSrc = event?.image || event?.thumbnail || placeholderImg
  const fullImageUrl = /^https?:\/\//i.test(imageSrc)
    ? imageSrc
    : imageSrc?.startsWith('/static/')
    ? `${new URL(apiBase, window.location.origin).origin}${imageSrc}`
    : imageSrc

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
        <QASection eventId={id} />
      </div>

      {/* Sticky Action Bar */}
      <ActionBar
        event={event}
        rsvpStatus={rsvpStatus}
        onRSVP={handleRSVP}
        onBookmark={handleBookmark}
        isBookmarked={isBookmarked}
      />
    </div>
  )
}

import { memo, useMemo, useState } from 'react'
import placeholderImg from '../../assets/doodle.png'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function EventCard({ event, onRSVP, userRSVP }) {
  // Use relative base so Vite proxy handles API origin in dev
  const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1'
  // Prefer thumbnail on list for performance; fall back to image
  const [imgError, setImgError] = useState(false)
  const cardImage = (!imgError && (event?.thumbnail || event?.image)) || event?.image || event?.thumbnail || placeholderImg
  const imageSrc = useMemo(() => {
    if (!cardImage) return null
    // If it's already absolute (http/https), use as-is
    if (/^https?:\/\//i.test(cardImage)) return cardImage
    // If it's a /static/... path, prefix with API base root (strip /api/v1)
    if (cardImage.startsWith('/static/')) {
      try {
        // Support both absolute and relative apiBase
        const url = new URL(apiBase, window.location.origin)
        const origin = `${url.protocol}//${url.host}`
        return `${origin}${cardImage}`
      } catch {
        return cardImage
      }
    }
    return cardImage
  }, [cardImage, apiBase])
  const { user } = useAuth()
  // [DBG] Render timing hook (can be removed later)
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.performance) {
    // eslint-disable-next-line no-console
    console.debug('[DBG] EventCard render for', event?.id, 'at', performance.now().toFixed(2), 'ms')
  }
  const { showSuccess, showError, showInfo } = useNotification()
  const [showEditRSVP, setShowEditRSVP] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Check if user has used their one-time edit for this event
  const hasEditedOnce = localStorage.getItem(`hasEdited_${user?.id}_${event.id}`) === 'true'

  const handleRSVP = (status) => {
    if (!user) {
      return // Do nothing if not logged in - message will guide them
    }
    onRSVP(event.id, status)
    setShowEditRSVP(false) // Hide edit buttons after RSVP
    
    // Show notification based on status and event approval requirement
    if (event.requires_approval) {
      if (status === 'going') {
        showInfo('Your RSVP has been sent to the organizer for approval')
      } else if (status === 'maybe') {
        showInfo('Your "Maybe" response has been sent to the organizer for approval')
      } else {
        showSuccess('Your RSVP has been updated')
      }
    } else {
      if (status === 'going') {
        showSuccess('You are now attending this event!')
      } else if (status === 'maybe') {
        showInfo('You might attend this event')
      } else {
        showInfo('You are not attending this event')
      }
    }
  }

  const handleEditRSVP = (status) => {
    handleRSVP(status)
    // Mark that user has used their one edit for this event
    localStorage.setItem(`hasEdited_${user.id}_${event.id}`, 'true')
    setShowEditRSVP(false)
  }

  // Helper function to check if current user is the organizer
  const isOrganizer = () => {
    return user && event.organizer_id === user.id
  }

  // Determine created-by label
  const createdByLabel = () => {
    if (event.organizer_role === 'admin' || event.organizer_role === 'UserRole.ADMIN') {
      return 'Created by Admin'
    }
    if (event.organizer_name) {
      return `Created by ${event.organizer_name}`
    }
    return 'Created by Organizer'
  }

  // Display name for organizer in Info card
  const organizerDisplayName = () => {
    if (event.organizer_role === 'admin' || event.organizer_role === 'UserRole.ADMIN') {
      return 'Admin'
    }
    return event.organizer_name || 'Organizer'
  }

  // Helper function to get RSVP status display info
  const getRSVPStatusInfo = (status) => {
    switch (status) {
      case 'going':
        return { text: '✓ Going', class: 'bg-green-600 text-white ring-2 ring-green-300' }
      case 'not_going':
        return { text: '✓ Can\'t Go', class: 'bg-red-600 text-white ring-2 ring-red-300' }
      case 'maybe':
        return { text: '✓ Maybe', class: 'bg-yellow-600 text-white ring-2 ring-yellow-300' }
      case 'waiting_for_approval':
        return { text: '⏳ Waiting for Admin Approval', class: 'bg-orange-600 text-white ring-2 ring-orange-300' }
      case 'approved':
        return { text: '✅ You are joining this event', class: 'bg-green-600 text-white ring-2 ring-green-300' }
      case 'rejected':
        return { text: '❌ Sorry, your RSVP was dismissed by the admin', class: 'bg-red-600 text-white ring-2 ring-red-300' }
      default:
        return { text: status, class: 'bg-gray-400 text-gray-600' }
    }
  }

  // Check if RSVP can be edited (only before admin takes action)
  const canEditRSVP = (rsvpStatus) => {
    return rsvpStatus && !['approved', 'rejected'].includes(rsvpStatus)
  }

  // Memoize formatted date/time to avoid recalculating on each render
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(event.event_start), 'PPP')
    } catch {
      return ''
    }
  }, [event.event_start])

  const formattedTime = useMemo(() => {
    try {
      const iso = new Date(event.event_start).toISOString()
      const hhmm = iso.split('T')[1]?.slice(0, 5)
      return formatTime(hhmm)
    } catch {
      return ''
    }
  }, [event.event_start])

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      style={{
        // Don’t render offscreen cards until scrolled near viewport
        contentVisibility: 'auto',
        // Reserve space to prevent layout shifts (approx card height)
        containIntrinsicSize: '480px',
      }}
    >
      <div className="relative w-full" style={{height: '160px'}}>
        {/* Skeleton / placeholder */}
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true"></div>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={event.title}
            className="w-full h-40 object-cover"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            referrerPolicy="no-referrer"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            width={300}
            height={200}
            onLoad={(e) => {
              // Hide skeleton when loaded
              const wrapper = e.currentTarget.parentElement
              const skel = wrapper?.querySelector('.animate-pulse')
              if (skel) skel.classList.add('hidden')
            }}
            onError={(e) => {
              setImgError(true)
              // Hide skeleton to avoid gray block, and swap to placeholder
              const wrapper = e.currentTarget.parentElement
              const skel = wrapper?.querySelector('.animate-pulse')
              if (skel) skel.classList.add('hidden')
              try {
                e.currentTarget.src = placeholderImg
              } catch {}
            }}
          />
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formattedDate} at {formattedTime}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            {event.attendees_count} / {event.max_attendees} attendees
          </div>
        </div>

        {/* Info card: Made by [organizer]; no admin link (display-only) */}
        <div className="mb-4">
          <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/70 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-blue-500 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 7a1 1 0 102 0 1 1 0 00-2 0zm-1 4a1 1 0 011-1h2a1 1 0 110 2v2a1 1 0 11-2 0v-2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="text-blue-800"><span className="font-medium">Made by</span> {organizerDisplayName()}</p>
              {(event?.organizer_role === 'admin' || event?.organizer_role === 'UserRole.ADMIN') && (
                <p className="text-blue-700">This event was created by an admin.</p>
              )}
            </div>
          </div>
        </div>

        {/* Show owner message if the viewer created this event */}
        {isOrganizer() ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                {user?.role === 'admin' ? (
                  <p className="text-sm text-blue-700 font-medium">You can manage this event from the Admin Panel.</p>
                ) : (
                  <p className="text-sm text-blue-700 font-medium">You can manage this event from the My Events panel.</p>
                )}
              </div>
            </div>
          </div>
        ) : user && user.role !== 'admin' ? (
          <div className="space-y-3">
            {/* Show current RSVP status if user has one */}
            {userRSVP?.status && (
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRSVPStatusInfo(userRSVP.status).class}`}>
                  {getRSVPStatusInfo(userRSVP.status).text}
                </div>
                {(userRSVP.status === 'waiting_for_approval' || userRSVP.status === 'rejected') && event.requires_approval && (
                  <p className="text-xs text-gray-500 mt-1">
                    {userRSVP.status === 'waiting_for_approval' 
                      ? 'Your RSVP is pending admin approval' 
                      : 'Your RSVP was not approved'}
                  </p>
                )}
              </div>
            )}

            {/* If user has already RSVP'd, show frozen buttons with edit option */}
            {userRSVP?.status ? (
              <div className="space-y-2">
                {/* Frozen RSVP buttons showing current selection */}
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium cursor-default ${
                      userRSVP.status === 'going' 
                        ? 'bg-green-600 text-white ring-2 ring-green-300' 
                        : 'bg-gray-400 text-gray-600'
                    }`}
                    disabled
                  >
                    {userRSVP.status === 'going' ? '✓ Going' : 'Going'}
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium cursor-default ${
                      userRSVP.status === 'maybe' 
                        ? 'bg-yellow-600 text-white ring-2 ring-yellow-300' 
                        : 'bg-gray-400 text-gray-600'
                    }`}
                    disabled
                  >
                    {userRSVP.status === 'maybe' ? '✓ Maybe' : 'Maybe'}
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium cursor-default ${
                      userRSVP.status === 'not_going' 
                        ? 'bg-red-600 text-white ring-2 ring-red-300' 
                        : 'bg-gray-400 text-gray-600'
                    }`}
                    disabled
                  >
                    {userRSVP.status === 'not_going' ? '✓ Can\'t Go' : 'Can\'t Go'}
                  </button>
                </div>

                {/* Edit button - only show if RSVP can be edited (not approved/rejected by admin) */}
                {canEditRSVP(userRSVP.status) && !hasEditedOnce ? (
                  <div className="text-center">
                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.145 2.145 0 1 1 3.033 3.033L7.5 19.915l-4.243 1.06 1.06-4.243 13.545-13.545z" />
                      </svg>
                      Change Response
                    </button>
                  </div>
                ) : !canEditRSVP(userRSVP.status) ? (
                  <div className="text-center">
                    <span className="text-xs text-gray-500 italic">Response locked by admin decision</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs text-gray-500 italic">Edit used - Response locked</span>
                  </div>
                )}

                {/* Show edit options when user clicks edit */}
                {showEditRSVP && (
                  <div className="flex space-x-2 animate-slide-up">
                    <button
                      onClick={() => handleEditRSVP('going')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        userRSVP.status === 'going' 
                          ? 'bg-green-100 text-green-800 cursor-default' 
                          : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                      }`}
                      disabled={userRSVP.status === 'going'}
                    >
                      Going
                    </button>
                    <button
                      onClick={() => handleEditRSVP('maybe')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        userRSVP.status === 'maybe' 
                          ? 'bg-yellow-100 text-yellow-800 cursor-default' 
                          : 'bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-105'
                      }`}
                      disabled={userRSVP.status === 'maybe'}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => handleEditRSVP('not_going')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        userRSVP.status === 'not_going' 
                          ? 'bg-red-100 text-red-800 cursor-default' 
                          : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                      }`}
                      disabled={userRSVP.status === 'not_going'}
                    >
                      Can't Go
                    </button>
                  </div>
                )}

                {/* Warning dialog */}
                {showConfirmDialog && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                      <h2 className="text-lg font-semibold mb-2 text-center">⚠️ Last Chance!</h2>
                      <p className="mb-4 text-center text-gray-600">You can only change your RSVP once. Are you sure?</p>
                      <div className="flex justify-center gap-3">
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          onClick={() => setShowConfirmDialog(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          onClick={() => { 
                            setShowConfirmDialog(false); 
                            setShowEditRSVP(true); 
                          }}
                        >
                          Proceed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged in users without RSVP yet */
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">Will you attend this event?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRSVP('going')}
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 hover:scale-105 transition-all duration-200"
                  >
                    Going
                  </button>
                  <button
                    onClick={() => handleRSVP('maybe')}
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-105 transition-all duration-200"
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRSVP('not_going')}
                    className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all duration-200"
                  >
                    Can't Go
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : user && user.role === 'admin' ? null : (
          /* Logged out users see login prompt */
          <div className="text-center py-3">
            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium text-blue-700">🎉 Join the Community!</span>
              <p className="text-blue-600 mt-1">
                <Link to="/login" className="underline hover:text-blue-800 transition-colors">
                  Please log in
                </Link> to RSVP and connect with amazing people!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Prevent unnecessary re-renders when unrelated event fields change
export default memo(EventCard, (prev, next) => {
  const a = prev.event
  const b = next.event
  // If RSVP status changed, re-render
  if ((prev.userRSVP?.status || null) !== (next.userRSVP?.status || null)) return false
  // Compare only fields used for rendering
  const keys = [
    'id', 'title', 'description', 'image', 'event_start', 'location',
    'attendees_count', 'max_attendees', 'organizer_id', 'organizer_role', 'organizer_name',
    'requires_approval'
  ]
  for (const k of keys) {
    if (a?.[k] !== b?.[k]) return false
  }
  // onRSVP is assumed stable from parent via useCallback
  return true
})
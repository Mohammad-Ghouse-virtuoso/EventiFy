import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export default function EventCard({ event, onRSVP, userRSVP }) {
  const { user } = useAuth()
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
  }

  const handleEditRSVP = (status) => {
    handleRSVP(status)
    // Mark that user has used their one edit for this event
    localStorage.setItem(`hasEdited_${user.id}_${event.id}`, 'true')
    setShowEditRSVP(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {event.image && (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {format(new Date(event.date), 'PPP')} at {formatTime(event.time || event.date?.split('T')[1]?.split(':').slice(0,2).join(':'))}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <UsersIcon className="h-4 w-4 mr-2" />
            {event.attendees_count} / {event.max_attendees} attendees
          </div>
        </div>

        {/* Show RSVP buttons only for logged in non-admin users */}
        {user && user.role !== 'admin' ? (
          <div className="space-y-3">
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

                {/* Edit button - only show if user hasn't edited once */}
                {!hasEditedOnce ? (
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
        ) : user && user.role === 'admin' ? (
          /* Admin users see a different message */
          <div className="text-center py-3">
            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium text-blue-700">👨‍💼 Admin View</span>
              <p className="text-blue-600 mt-1">You can manage this event from the Admin Panel</p>
            </div>
          </div>
        ) : (
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
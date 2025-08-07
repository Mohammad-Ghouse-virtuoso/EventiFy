import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function EventCard({ event, onRSVP, userRSVP }) {
  const { user } = useAuth()
  const [showChangeRSVP, setShowChangeRSVP] = useState(false)

  const handleRSVP = (status) => {
    if (!user) {
      alert('Please log in to RSVP to events! 🎉')
      return
    }
    onRSVP(event.id, status)
  }

  const getButtonStyle = (status) => {
    const isSelected = userRSVP?.status === status
    const baseStyle = "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105"

    if (status === 'going') {
      return isSelected
        ? `${baseStyle} bg-green-700 text-white shadow-lg ring-2 ring-green-300`
        : `${baseStyle} bg-green-600 text-white hover:bg-green-700 hover:shadow-md`
    } else if (status === 'maybe') {
      return isSelected
        ? `${baseStyle} bg-yellow-700 text-white shadow-lg ring-2 ring-yellow-300`
        : `${baseStyle} bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-md`
    } else {
      return isSelected
        ? `${baseStyle} bg-red-700 text-white shadow-lg ring-2 ring-red-300`
        : `${baseStyle} bg-red-600 text-white hover:bg-red-700 hover:shadow-md`
    }
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
            {format(new Date(event.date), 'PPP')} at {event.time}
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

        {/* Show RSVP buttons only for logged in users */}
        {user ? (
          <div className="space-y-3">
            {/* If user has already RSVP'd, show their selection and change option */}
            {userRSVP?.status ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {userRSVP.status === 'going' && <span className="text-green-600 font-semibold">✓ You're Going!</span>}
                      {userRSVP.status === 'maybe' && <span className="text-yellow-600 font-semibold">✓ You Might Attend</span>}
                      {userRSVP.status === 'not_going' && <span className="text-red-600 font-semibold">✓ You Can't Attend</span>}
                    </div>
                    <p className="text-sm text-gray-600">Thanks for your response!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangeRSVP(!showChangeRSVP)}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  {showChangeRSVP ? 'Hide Options' : 'Change Response'}
                </button>
                {showChangeRSVP && (
                  <div className="flex space-x-2 animate-slide-up">
                    <button
                      onClick={() => handleRSVP('going')}
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
                      onClick={() => handleRSVP('maybe')}
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
                      onClick={() => handleRSVP('not_going')}
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
              </div>
            ) : (
              /* Show initial RSVP options */
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
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => handleRSVP('going')}
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-primary-600 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Going
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-primary-600 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Maybe
            </button>
            <button
              onClick={() => handleRSVP('not_going')}
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-primary-600 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Can't Go
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function ActionBar({ event, rsvpStatus, onRSVP, onBookmark, isBookmarked }) {
  const { user } = useAuth()
  const { showInfo } = useNotification()

  if (!event) return null

  const handleRSVPClick = (status) => {
    if (!user) {
      showInfo('Please log in to RSVP')
      return
    }
    onRSVP(status)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 flex gap-2">
          <button
            onClick={() => handleRSVPClick('going')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              rsvpStatus === 'going'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {rsvpStatus === 'going' && <CheckIcon className="h-5 w-5" />}
            Going
          </button>

          <button
            onClick={() => handleRSVPClick('maybe')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              rsvpStatus === 'maybe'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {rsvpStatus === 'maybe' && <CheckIcon className="h-5 w-5" />}
            Maybe
          </button>

          <button
            onClick={() => handleRSVPClick('not_going')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              rsvpStatus === 'not_going'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {rsvpStatus === 'not_going' && <CheckIcon className="h-5 w-5" />}
            Can't Go
          </button>
        </div>

        <button
          onClick={onBookmark}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            isBookmarked
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {isBookmarked ? '❤️ Bookmarked' : '🤍 Bookmark'}
        </button>
      </div>
    </div>
  )
}

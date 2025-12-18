import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookmarkAPI } from '../services/api'
import { HeartIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import { CalendarIcon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import placeholderImg from '../../assets/doodle.png'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'

export default function Bookmarks() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    try {
      setLoading(true)
      const data = await bookmarkAPI.getMyBookmarks()
      setBookmarks(data)
    } catch (err) {
      showError('Failed to load bookmarks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnbookmark = async (eventId, eventTitle) => {
    try {
      await bookmarkAPI.unbookmark(eventId)
      setBookmarks(bookmarks.filter(b => b.id !== eventId))
      showSuccess(`Removed "${eventTitle}" from bookmarks`)
    } catch (err) {
      showError('Failed to remove bookmark')
      console.error('Failed to unbookmark:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Events
          </Link>
          
          <div className="flex items-center gap-3">
            <HeartIcon className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bookmarked Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Your saved events
              </p>
            </div>
            <span className="ml-auto px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-lg font-semibold">
              {bookmarks.length}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <HeartIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Bookmarks Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start bookmarking events you're interested in to keep track of them easily
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition font-semibold shadow-lg"
            >
              <CalendarIcon className="h-5 w-5" />
              Browse Events
            </Link>
          </div>
        ) : (
          /* Bookmarks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <Link to={`/events/${bookmark.id}`} className="block">
                  <div className="relative h-48 bg-gradient-to-br from-primary-500 to-secondary-500 overflow-hidden">
                    <img
                      src={bookmark.image || placeholderImg}
                      alt={bookmark.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = placeholderImg
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5">
                  <Link to={`/events/${bookmark.id}`}>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                      {bookmark.title}
                    </h3>
                  </Link>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(bookmark.event_start), 'MMM dd, yyyy • h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{bookmark.location}</span>
                    </div>

                    {bookmark.category && (
                      <div className="flex items-center gap-2 text-sm">
                        <TagIcon className="h-4 w-4 text-primary-500" />
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-md font-medium text-xs capitalize">
                          {bookmark.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to={`/events/${bookmark.id}`}
                      className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition font-medium text-center text-sm"
                    >
                      View Event
                    </Link>
                    
                    <button
                      onClick={() => handleUnbookmark(bookmark.id, bookmark.title)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition font-medium text-sm flex items-center gap-2"
                      title="Remove bookmark"
                    >
                      <HeartIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

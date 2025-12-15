import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookmarkAPI } from '../services/api'
import { HeartIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import placeholderImg from '../../assets/doodle.png'

export default function BookmarkedEventsShelf() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true)
        const data = await bookmarkAPI.getMyBookmarks()
        setBookmarks(data)
      } catch (err) {
        setError('Failed to load bookmarks')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [])

  const handleUnbookmark = async (eventId) => {
    try {
      await bookmarkAPI.unbookmark(eventId)
      setBookmarks(bookmarks.filter(b => b.id !== eventId))
    } catch (err) {
      console.error('Failed to unbookmark:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <HeartIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Bookmarks Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Bookmark events to save them for later
        </p>
        <Link
          to="/events"
          className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
        >
          Browse Events
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HeartIcon className="h-6 w-6 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bookmarked Events
        </h2>
        <span className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
          {bookmarks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map(bookmark => (
          <Link
            key={bookmark.id}
            to={`/events/${bookmark.id}`}
            className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            <div className="relative h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <img
                src={bookmark.image || placeholderImg}
                alt={bookmark.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.src = placeholderImg
                }}
              />
              
              {/* Unbookmark Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleUnbookmark(bookmark.id)
                }}
                className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <HeartIcon className="h-5 w-5 text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {format(new Date(bookmark.date), 'MMM dd, yyyy')}
              </p>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                {bookmark.title}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                📍 {bookmark.location}
              </p>

              {bookmark.category && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                    #{bookmark.category}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

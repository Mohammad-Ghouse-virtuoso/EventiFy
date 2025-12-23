import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, MapPinIcon, UserGroupIcon, FireIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// Evergreen events that auto-populate when real events are insufficient
const EVERGREEN_EVENTS = [
  {
    id: 'evergreen-1',
    title: 'Summer Music Festival',
    category: 'Music',
    location: 'Central Park Amphitheater',
    event_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    attendees_count: 342,
    npc_attendees: ['Sarah M.', 'Hugo C.', 'Maya P.', 'Alex R.'],
  },
  {
    id: 'evergreen-2',
    title: 'Golden Anniversary Gala',
    category: 'Celebration',
    location: 'Grand Ballroom',
    event_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    attendees_count: 156,
    npc_attendees: ['Emma W.', 'David K.', 'Olivia B.'],
  },
  {
    id: 'evergreen-3',
    title: 'Tech Innovators Meetup',
    category: 'Technology',
    location: 'Innovation Hub',
    event_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    attendees_count: 98,
    npc_attendees: ['John D.', 'Raj S.', 'Aleena K.'],
  },
  {
    id: 'evergreen-4',
    title: 'Sunset Yoga Retreat',
    category: 'Wellness',
    location: 'Oceanview Beach',
    event_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    attendees_count: 45,
    npc_attendees: ['Sofia D.', 'Aisha K.'],
  },
  {
    id: 'evergreen-5',
    title: 'Artisan Food & Wine Festival',
    category: 'Food & Drink',
    location: 'Vineyard Estate',
    event_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    attendees_count: 215,
    npc_attendees: ['Maruf K.', 'Mateo G.', 'Rita M.'],
  },
  {
    id: 'evergreen-6',
    title: 'Photography Workshop',
    category: 'Art',
    location: 'Creative Studio',
    event_start: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
    attendees_count: 52,
    npc_attendees: ['Chen L.', 'Priya N.'],
  },
]

/**
 * TrendingEvents - Shows top events by attendee count
 * Compact cards with attendee count badges
 * Falls back to evergreen events if fewer than required real events exist
 */
export default function TrendingEvents({ className = '', limit = 4 }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrending()
  }, [limit])

  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/trending?limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        // If we have fewer real events than limit, supplement with evergreen
        if (data.length < limit) {
          const needed = limit - data.length
          const realIds = new Set(data.map(e => e.id))
          const supplemental = EVERGREEN_EVENTS
            .filter(e => !realIds.has(e.id))
            .slice(0, needed)
          setEvents([...data, ...supplemental])
        } else {
          setEvents(data)
        }
      } else {
        // Fallback to evergreen events on error
        setEvents(EVERGREEN_EVENTS.slice(0, limit))
      }
    } catch (err) {
      console.error('Failed to fetch trending events:', err)
      setEvents(EVERGREEN_EVENTS.slice(0, limit))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <FireIcon className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Events</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FireIcon className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Events</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {events.map((event, idx) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
          >
            {/* Ranking badge */}
            {idx < 3 && (
              <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'
              }`}>
                {idx + 1}
              </div>
            )}
            
            {/* Thumbnail */}
            {event.thumbnail || event.image ? (
              <div className="h-20 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <img
                  src={event.thumbnail || event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800" />
            )}
            
            {/* Content */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {event.title}
              </h4>
              
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{format(new Date(event.event_start), 'MMM d')}</span>
              </div>
              
              {/* Attendee count badge */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                  <UserGroupIcon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {event.attendees_count} attending
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

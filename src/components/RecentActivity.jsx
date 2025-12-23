import { useState, useEffect } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/solid'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

/**
 * RecentActivity - Shows a live feed of recent RSVPs for social proof
 * Displays anonymized user activity like "Sarah R. RSVP'd to Tech Meetup"
 */
export default function RecentActivity({ className = '', limit = 5 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleIndex, setVisibleIndex] = useState(0)

  useEffect(() => {
    fetchActivity()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [limit])

  // Cycle through activities for animation effect
  useEffect(() => {
    if (activities.length <= 1) return
    
    const timer = setInterval(() => {
      setVisibleIndex((prev) => (prev + 1) % activities.length)
    }, 4000) // Change every 4 seconds
    
    return () => clearInterval(timer)
  }, [activities.length])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/recent-activity?limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || activities.length === 0) {
    return null
  }

  // Get background colors for avatar based on initial
  const getAvatarColor = (initial) => {
    const colors = [
      'bg-primary-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500'
    ]
    const index = initial.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className={`${className}`}>
      <div className="relative overflow-hidden h-12">
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ${
              idx === visibleIndex 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full ${getAvatarColor(activity.user_initial)} flex items-center justify-center text-white text-sm font-semibold`}>
              {activity.user_initial}
            </div>
            
            {/* Activity text */}
            <span className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">
                {activity.user_name_partial}
              </span>
              {' '}{activity.action}{' '}
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {activity.event_title.length > 25 
                  ? `${activity.event_title.slice(0, 25)}...` 
                  : activity.event_title}
              </span>
            </span>
            
            {/* Time ago */}
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              • {activity.time_ago}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

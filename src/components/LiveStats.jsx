import { useState, useEffect } from 'react'
import { CalendarDaysIcon, UserGroupIcon, TicketIcon, SparklesIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

/**
 * LiveStats - Displays animated platform statistics for social proof
 * Shows: Events this month, Total users, Total RSVPs
 */
export default function LiveStats({ className = '' }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animatedStats, setAnimatedStats] = useState({
    events_this_month: 0,
    total_users: 0,
    total_rsvps: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  // Animate numbers counting up
  useEffect(() => {
    if (!stats) return

    const duration = 1500 // ms
    const steps = 30
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3)
      
      setAnimatedStats({
        events_this_month: Math.round(stats.events_this_month * eased),
        total_users: Math.round(stats.total_users * eased),
        total_rsvps: Math.round(stats.total_rsvps * eased)
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [stats])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/summary`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return null // Don't show anything while loading
  }

  const statItems = [
    {
      icon: CalendarDaysIcon,
      value: animatedStats.events_this_month,
      label: 'Events This Month',
      color: 'text-primary-600 dark:text-primary-400'
    },
    {
      icon: UserGroupIcon,
      value: animatedStats.total_users,
      label: 'Active Users',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: TicketIcon,
      value: animatedStats.total_rsvps,
      label: 'RSVPs Made',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ]

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap justify-center gap-6 md:gap-12">
        {statItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value.toLocaleString()}+
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

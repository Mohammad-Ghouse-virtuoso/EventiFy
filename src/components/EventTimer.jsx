import { useEffect, useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function EventTimer({ eventStartTime }) {
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const eventTime = new Date(eventStartTime)
      const diffMs = eventTime - now

      // Hide if past or > 48 hours away
      if (diffMs <= 0 || diffMs > 48 * 60 * 60 * 1000) {
        setTimeRemaining(null)
        return
      }

      const totalMinutes = Math.floor(diffMs / 60000)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      let severity = 'info'
      if (hours < 10) {
        severity = 'danger'
      } else if (hours < 24) {
        severity = 'warning'
      }

      setTimeRemaining({
        hours,
        minutes,
        severity
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [eventStartTime])

  if (!timeRemaining) return null

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
      timeRemaining.severity === 'danger'
        ? 'bg-red-600 text-white'
        : timeRemaining.severity === 'warning'
          ? 'bg-orange-500 text-white'
          : 'bg-blue-500 text-white'
    }`}>
      <ClockIcon className="h-4 w-4" />
      <span>
        {timeRemaining.hours > 0
          ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
          : `${timeRemaining.minutes}m`
        }
      </span>
    </div>
  )
}

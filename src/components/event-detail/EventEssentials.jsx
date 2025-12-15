import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function EventEssentials({ event }) {
  if (!event) return null

  const eventStart = new Date(event.event_start)
  const attendeeCount = event.attendees_count || 0
  const maxAttendees = event.max_attendees || 0

  return (
    <div className="space-y-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
        {event.title}
      </h1>

      <div className="flex flex-wrap gap-4 text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary-500" />
          <span>{format(eventStart, 'EEEE, MMMM dd, yyyy')}</span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary-500" />
          <span>{format(eventStart, 'h:mm a')}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-primary-500" />
          <span>{event.location || 'TBD'}</span>
        </div>

        {event.price ? (
          <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            ${event.price}
          </div>
        ) : (
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            Free
          </div>
        )}
      </div>

      {/* RSVP Stats */}
      <div className="flex gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-primary-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {attendeeCount}/{maxAttendees}
          </span>
          <span className="text-gray-600 dark:text-gray-400">Attending</span>
        </div>

        {maxAttendees > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round((attendeeCount / maxAttendees) * 100)}% Full
          </div>
        )}
      </div>

      {/* Category Badge */}
      {event.category && (
        <div className="pt-2">
          <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
            #{event.category}
          </span>
        </div>
      )}
    </div>
  )
}

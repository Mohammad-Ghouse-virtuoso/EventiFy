export default function EventDescription({ event }) {
  if (!event) return null

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        About This Event
      </h2>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
          {event.description || 'No description provided'}
        </p>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold">
            Event Type
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize mt-1">
            {event.category || 'General'}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold">
            Capacity
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {event.max_attendees || 'Unlimited'}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 font-semibold">
            Attending
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {event.attendees_count || 0}
          </p>
        </div>
      </div>
    </div>
  )
}

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export default function TermsSection({ event }) {
  // If organizer has not set custom terms, don't display section
  if (!event?.terms_and_conditions) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <span>📋</span> Terms & Conditions
      </h2>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {event.terms_and_conditions}
        </p>
      </div>
    </div>
  )
}

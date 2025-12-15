import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

const defaultTerms = {
  refund_policy: 'Full refund available until 48 hours before the event. No refunds within 48 hours of event start.',
  code_of_conduct: 'Please be respectful to all attendees. Harassment, discrimination, or disruptive behavior will not be tolerated.',
  health_safety: 'Masks optional. Hand sanitizers provided. Event may be postponed if fewer than 20 attendees confirm 24 hours before.',
  cancellation_policy: 'Event will be rescheduled if cancelled by organizer. Refunds issued for postponed events.'
}

export default function TermsSection({ event }) {
  const [expandedSection, setExpandedSection] = useState(null)

  const terms = event?.terms_conditions || defaultTerms

  const sections = [
    { key: 'refund_policy', title: 'Refund Policy', icon: '💰' },
    { key: 'code_of_conduct', title: 'Code of Conduct', icon: '📋' },
    { key: 'health_safety', title: 'Health & Safety', icon: '🏥' },
    { key: 'cancellation_policy', title: 'Cancellation Policy', icon: '❌' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Terms & Conditions
      </h2>

      <div className="space-y-2">
        {sections.map(({ key, title, icon }) => (
          <div
            key={key}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedSection(expandedSection === key ? null : key)
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {title}
                </span>
              </div>
              {expandedSection === key ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {expandedSection === key && (
              <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {terms[key]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

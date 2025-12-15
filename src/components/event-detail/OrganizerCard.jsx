import { useState } from 'react'

const defaultOrganizerData = {
  full_name: 'Event Organizer',
  email: 'contact@eventify.com',
  phone: '+1 (555) 123-4567'
}

export default function OrganizerCard({ event }) {
  if (!event) return null

  const organizer = event.organizer || defaultOrganizerData

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-primary-200 dark:border-gray-600">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        About the Organizer
      </h2>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {organizer.full_name?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Organizer Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {organizer.full_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Event Organizer
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📧</span>
              <a
                href={`mailto:${organizer.email}`}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {organizer.email}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📱</span>
              <a
                href={`tel:${organizer.phone}`}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {organizer.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <button className="mt-4 w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium">
        Add to Network
      </button>
    </div>
  )
}

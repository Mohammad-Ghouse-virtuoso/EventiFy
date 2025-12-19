import { useState } from 'react'

export default function OrganizerCard({ event }) {
  if (!event) return null

  const organizer = event.organizer

  // If no organizer info available, don't show card
  if (!organizer) return null

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
          
          {/* Organizer Bio */}
          {event.organizer_bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {event.organizer_bio}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {/* Contact Info or Custom Contact */}
            {event.organizer_contact && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">📞</span>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {event.organizer_contact}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            {organizer.email && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📧</span>
                <a
                  href={`mailto:${organizer.email}`}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {organizer.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

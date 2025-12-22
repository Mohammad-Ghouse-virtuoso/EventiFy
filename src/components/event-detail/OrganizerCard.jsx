export default function OrganizerCard({ event }) {
  if (!event) return null

  // Backend returns flat fields: organizer_name, organizer_bio, organizer_contact
  const organizerName = event.organizer_name || event.organizer?.full_name
  const organizerBio = event.organizer_bio
  const organizerContact = event.organizer_contact

  // If no organizer name, don't show card
  if (!organizerName) return null

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-primary-200 dark:border-gray-600">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        About the Organizer
      </h2>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {organizerName?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Organizer Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {organizerName}
          </h3>
          
          {/* Organizer Bio */}
          {organizerBio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {organizerBio}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {/* Contact Info */}
            {organizerContact && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">📞</span>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {organizerContact}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

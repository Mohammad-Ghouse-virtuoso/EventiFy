import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { CheckIcon } from '@heroicons/react/24/outline'
import EventTimer from '../EventTimer'

const LOCKED_STATUSES = ['approved', 'rejected']

export default function ActionBar({ event, rsvpStatus, onRSVP, onBookmark, isBookmarked, hasUsedEdit }) {
  const { user } = useAuth()
  const { showInfo } = useNotification()
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!event) return null

  const canEdit = Boolean(rsvpStatus) && !hasUsedEdit && !LOCKED_STATUSES.includes(rsvpStatus)

  const handleRSVPClick = async (status, { lockAfterEdit = false } = {}) => {
    if (!user) {
      showInfo('Please log in to RSVP')
      return
    }
    setSubmitting(true)
    const ok = await onRSVP(status, { lockAfterEdit })
    setSubmitting(false)
    if (ok && lockAfterEdit) {
      setEditMode(false)
      setShowEditPrompt(false)
    }
  }

  const renderButtons = (lockAfterEdit = false) => (
    <div className="flex-1 flex gap-2">
      <button
        onClick={() => handleRSVPClick('going', { lockAfterEdit })}
        disabled={(Boolean(rsvpStatus) && !editMode) || submitting}
        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          rsvpStatus === 'going'
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {rsvpStatus === 'going' && <CheckIcon className="h-5 w-5" />}
        Going
      </button>

      <button
        onClick={() => handleRSVPClick('maybe', { lockAfterEdit })}
        disabled={(Boolean(rsvpStatus) && !editMode) || submitting}
        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          rsvpStatus === 'maybe'
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {rsvpStatus === 'maybe' && <CheckIcon className="h-5 w-5" />}
        Maybe
      </button>

      <button
        onClick={() => handleRSVPClick('not_going', { lockAfterEdit })}
        disabled={(Boolean(rsvpStatus) && !editMode) || submitting}
        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          rsvpStatus === 'not_going'
            ? 'bg-gray-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {rsvpStatus === 'not_going' && <CheckIcon className="h-5 w-5" />}
        Can't Go
      </button>
    </div>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {rsvpStatus ? `RSVP Status: ${rsvpStatus.replace('_', ' ')}` : 'Not RSVPed'}
        </div>
        <EventTimer eventStartTime={event.event_start} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {renderButtons(editMode)}
          <button
            onClick={onBookmark}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              isBookmarked
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isBookmarked ? '❤️ Bookmarked' : '🤍 Bookmark'}
          </button>
        </div>

        {rsvpStatus && (
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            {LOCKED_STATUSES.includes(rsvpStatus) ? (
              <span>Response locked by organizer decision.</span>
            ) : hasUsedEdit ? (
              <span>Your one-time change has been used. Responses are now locked.</span>
            ) : canEdit ? (
              <button
                className="text-primary-600 dark:text-primary-400 font-semibold"
                onClick={() => setShowEditPrompt(true)}
              >
                Change response (one-time)
              </button>
            ) : (
              <span>Responses are locked.</span>
            )}
          </div>
        )}

        {showEditPrompt && canEdit && (
          <div className="bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-100 flex flex-col gap-2">
            <span>Warning: you can edit your RSVP only once. After you confirm, buttons will be disabled.</span>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                onClick={() => { setEditMode(true); setShowEditPrompt(false) }}
              >
                Proceed to edit
              </button>
              <button
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                onClick={() => setShowEditPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editMode && canEdit && (
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
            <span>Select a new option; this will lock your response.</span>
            <button className="text-primary-600 dark:text-primary-400" onClick={() => setEditMode(false)}>Close edit mode</button>
          </div>
        )}
      </div>
    </div>
  )
}

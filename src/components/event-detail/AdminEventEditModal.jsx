import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { eventsAPI } from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'

export default function AdminEventEditModal({ event, isOpen, onClose, onUpdate }) {
  const { showSuccess, showError } = useNotification()
  const [formData, setFormData] = useState({
    terms_and_conditions: '',
    organizer_bio: '',
    organizer_contact: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        terms_and_conditions: event.terms_and_conditions || '',
        organizer_bio: event.organizer_bio || '',
        organizer_contact: event.organizer_contact || ''
      })
    }
  }, [event])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        terms_and_conditions: formData.terms_and_conditions,
        organizer_bio: formData.organizer_bio,
        organizer_contact: formData.organizer_contact
      }
      
      await eventsAPI.update(event.id, updateData)
      showSuccess('Event details updated successfully')
      onUpdate({ ...event, ...updateData })
      onClose()
    } catch (err) {
      showError('Failed to update event details')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <h2 className="text-2xl font-bold">Edit Event Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Terms & Conditions */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Terms & Conditions
            </label>
            <textarea
              name="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={handleChange}
              placeholder="Enter event terms and conditions..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Organizer Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              About Organizer
            </label>
            <textarea
              name="organizer_bio"
              value={formData.organizer_bio}
              onChange={handleChange}
              placeholder="Tell attendees about yourself..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Organizer Contact */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Contact Email / Info
            </label>
            <input
              type="text"
              name="organizer_contact"
              value={formData.organizer_contact}
              onChange={handleChange}
              placeholder="e.g., organizer@example.com or +1-234-567-8900"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsAPI } from '../services/api'
import { CalendarIcon, MapPinIcon, UsersIcon, PhotoIcon } from '@heroicons/react/24/outline'
import SuccessDialog from '../components/SuccessDialog'
import BannerSelector from '../components/BannerSelector'
import { useAuth } from '../contexts/AuthContext'
import DateTimeField from '../components/DateTimeField'
import CategorySelect from '../components/CategorySelect'

export default function CreateEvent() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_start: '',
    event_end: '',
    location: '',
    category: '',
    max_attendees: '',
    image: null,
    imageUrl: null,  // For predefined banners
    is_public: true,
    requires_approval: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateErrors, setDateErrors] = useState({ start: '', end: '' })
  const [imagePreview, setImagePreview] = useState(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdEvent, setCreatedEvent] = useState(null)
  const [showBannerSelector, setShowBannerSelector] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState(null)
  const [imageSource, setImageSource] = useState('upload') // 'upload' or 'banner'
  
  const navigate = useNavigate()

  const categories = [
    'music', 'tech', 'sports', 'food', 'art', 'business', 
    'education', 'health', 'networking', 'entertainment',
    'recreation', 'wedding', 'anniversary'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file, imageUrl: null })
      setSelectedBanner(null)
      setImageSource('upload')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerSelect = (banner) => {
    setSelectedBanner(banner)
    setFormData({ ...formData, imageUrl: banner.url, image: null })
    setImagePreview(banner.url)
    setImageSource('banner')
    setShowBannerSelector(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDateErrors({ start: '', end: '' })

    // Validate dates
    try {
      if (!formData.event_start) {
        setDateErrors((prev) => ({ ...prev, start: 'Event start is required' }))
        setLoading(false)
        return
      }
      const start = new Date(formData.event_start)
      if (isNaN(start.getTime())) {
        setDateErrors((prev) => ({ ...prev, start: 'Invalid start date' }))
        setLoading(false)
        return
      }
      if (formData.event_end) {
        const end = new Date(formData.event_end)
        if (isNaN(end.getTime())) {
          setDateErrors((prev) => ({ ...prev, end: 'Invalid end date' }))
          setLoading(false)
          return
        }
        if (end < start) {
          setDateErrors((prev) => ({ ...prev, end: 'End must be after start' }))
          setLoading(false)
          return
        }
      }
    } catch (_) {
      // fallback error
    }

    try {
      let event
      
      if (imageSource === 'banner' && formData.imageUrl) {
        // Use JSON for predefined banners
        const eventData = {
          title: formData.title,
          description: formData.description,
          event_start: formData.event_start,
          event_end: formData.event_end || null,
          location: formData.location,
          category: formData.category,
          max_attendees: parseInt(formData.max_attendees),
          price: parseFloat(formData.price || 0),
          image: formData.imageUrl,
          requires_approval: formData.requires_approval
        }
        event = await eventsAPI.create(eventData)
      } else if (imageSource === 'upload' && formData.image) {
        // Use FormData for file uploads (not implemented in backend yet)
        const eventData = new FormData()
        Object.keys(formData).forEach(key => {
          if (key !== 'imageUrl' && formData[key] !== null && formData[key] !== '') {
            eventData.append(key, formData[key])
          }
        })
        event = await eventsAPI.create(eventData)
      } else {
        // No image
        const eventData = {
          title: formData.title,
          description: formData.description,
          event_start: formData.event_start,
          event_end: formData.event_end || null,
          location: formData.location,
          category: formData.category,
          max_attendees: parseInt(formData.max_attendees),
          price: parseFloat(formData.price || 0),
          requires_approval: formData.requires_approval
        }
        event = await eventsAPI.create(eventData)
      }

      setCreatedEvent(event)
      setShowSuccessDialog(true)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        event_start: '',
        event_end: '',
        location: '',
        category: '',
        max_attendees: '',
        image: null,
        imageUrl: null,
        is_public: true,
        requires_approval: false
      })
      setImagePreview(null)
      setSelectedBanner(null)
      setImageSource('upload')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleViewEvent = () => {
    navigate('/events')
  }

  const handleCreateAnother = () => {
    setShowSuccessDialog(false)
    setCreatedEvent(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Create New Event</h1>
        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Fill in the details to create your event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white dark:text-white">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your event..."
              />
            </div>

            <div>
              <CategorySelect
                label="Category"
                required
                value={formData.category}
                onChange={(val) => setFormData((p) => ({ ...p, category: val }))}
                options={categories}
              />
            </div>

            <div>
              <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <UsersIcon className="h-4 w-4 inline mr-1" />
                Max Attendees *
              </label>
              <input
                type="number"
                id="max_attendees"
                name="max_attendees"
                required
                min="1"
                value={formData.max_attendees}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. 100"
              />
            </div>
          </div>
        </div>

        {/* Date & Location */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Date & Location</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <DateTimeField
                label={<span><CalendarIcon className="h-4 w-4 inline mr-1" />Event Start</span>}
                required
                value={formData.event_start}
                onChange={(iso) => setFormData((p) => ({ ...p, event_start: iso || '' }))}
                minDate={new Date()}
                error={dateErrors.start}
              />
            </div>

            <div>
              <DateTimeField
                label="Event End (optional)"
                value={formData.event_end}
                onChange={(iso) => setFormData((p) => ({ ...p, event_end: iso || '' }))}
                minDate={formData.event_start || undefined}
                error={dateErrors.end}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter event location"
              />
            </div>
          </div>
        </div>

        {/* Event Image */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Event Image</h2>
          
          {/* Image Source Selection */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setImageSource('upload')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  imageSource === 'upload'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                }`}
              >
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => setImageSource('banner')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  imageSource === 'banner'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                }`}
              >
                Choose Banner
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {imageSource === 'upload' ? (
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <PhotoIcon className="h-4 w-4 inline mr-1" />
                  Upload Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <PhotoIcon className="h-4 w-4 inline mr-1" />
                  Predefined Banners
                </label>
                <button
                  type="button"
                  onClick={() => setShowBannerSelector(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  {selectedBanner ? `Selected: ${selectedBanner.name}` : 'Click to choose a banner'}
                </button>
              </div>
            )}

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
                {selectedBanner && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{selectedBanner.description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Event Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Make this event public (visible to everyone)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_approval"
                name="requires_approval"
                checked={formData.requires_approval}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Require approval for RSVPs
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleCreateAnother}
        title="Event Created Successfully!"
        message={`Your event "${createdEvent?.title}" has been created and is now live. People can start discovering and joining your event.`}
        actionText="View Events"
        onAction={handleViewEvent}
      />

      {/* Banner Selector Modal */}
      <BannerSelector
        userRole={user?.role}
        currentBanner={selectedBanner}
        onBannerSelect={handleBannerSelect}
        isOpen={showBannerSelector}
        onClose={() => setShowBannerSelector(false)}
      />
    </div>
  )
}
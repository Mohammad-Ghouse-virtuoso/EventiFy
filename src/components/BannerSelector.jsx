import { useState } from 'react'
import { PhotoIcon, CheckIcon } from '@heroicons/react/24/outline'

// Predefined banner images for different user roles
const BANNER_IMAGES = {
  attendee: [
    {
      id: 'attendee-1',
      name: 'Concert Vibes',
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Live music and festival atmosphere'
    },
    {
      id: 'attendee-2',
      name: 'Social Gathering',
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
      description: 'Friends and community events'
    },
    {
      id: 'attendee-3',
      name: 'Adventure Time',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Outdoor adventures and exploration'
    },
    {
      id: 'attendee-4',
      name: 'Urban Nightlife',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80',
      description: 'City events and nightlife'
    },
    {
      id: 'attendee-5',
      name: 'Cultural Events',
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Art, culture, and exhibitions'
    },
    {
      id: 'attendee-6',
      name: 'Celebration',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Parties and celebrations'
    }
  ],
  admin: [
   
    {
      id: 'admin-1',
      name: 'Leadership Conclave',
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80',
      description: 'Executive leadership summits and strategic business discussions'
    },
    {
      id: 'admin-2',
      name: 'Future Forum',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Technology conferences, innovation panels, and professional development'
    },
    {
      id: 'admin-3',
      name: 'Cultural Caravan',
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Arts exhibitions, music performances, and cultural celebrations'
    },
    {
      id: 'admin-4',
      name: 'Saga Nights',
      url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Elegant evening celebrations, formal ceremonies, and milestone events'
    },
    {
      id: 'admin-5',
      name: 'Contemporary Chronicles',
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
      description: 'Community meetings, organizational assemblies, and local gatherings'
    },
    {
      id: 'admin-6',
      name: 'Festival Fiesta',
      url: 'https://images.unsplash.com/photo-1482575832494-771f74bf6aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Large-scale festivals, holiday celebrations, and traditional events'
    }
  ],
  organizer: [
    {
      id: 'organizer-1',
      name: 'Event Planning',
      url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2062&q=80',
      description: 'Professional event organization'
    },
    {
      id: 'organizer-2',
      name: 'Conference Setup',
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
      description: 'Conference and seminar management'
    },
    {
      id: 'organizer-3',
      name: 'Wedding Coordination',
      url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Wedding and celebration planning'
    },
    {
      id: 'organizer-4',
      name: 'Corporate Events',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Business event coordination'
    },
    {
      id: 'organizer-5',
      name: 'Festival Management',
      url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      description: 'Large-scale festival organization'
    },
    {
      id: 'organizer-6',
      name: 'Community Events',
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
      description: 'Local community gatherings'
    }
  ]
}

export default function BannerSelector({ userRole, currentBanner, onBannerSelect, isOpen, onClose }) {
  const [selectedBanner, setSelectedBanner] = useState(currentBanner || null)
  
  const banners = BANNER_IMAGES[userRole] || BANNER_IMAGES.attendee

  const handleSave = () => {
    if (selectedBanner) {
      onBannerSelect(selectedBanner)
      // User-specific storage is now handled in ProfileContext
    }
    onClose()
  }

  const handleBannerClick = (banner) => {
    setSelectedBanner(banner)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Choose Your Banner</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select a banner image that represents your style
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedBanner?.id === banner.id
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleBannerClick(banner)}
              >
                <div className="aspect-video relative">
                  <img
                    src={banner.url}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedBanner?.id === banner.id && (
                    <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-primary-500 rounded-full p-2">
                        <CheckIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm">{banner.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{banner.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedBanner}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

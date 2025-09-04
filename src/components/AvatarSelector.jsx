import { useState } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'

const AVATAR_OPTIONS = [
  // Admin/Professional avatars
  {
    id: 1,
    name: 'Professional Leader',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    category: 'admin'
  },
  {
    id: 2,
    name: 'Executive',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    category: 'admin'
  },
  {
    id: 3,
    name: 'Business Leader',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    category: 'admin'
  },
  
  // Enhanced attendee avatars - more diverse and appealing
  {
    id: 4,
    name: 'Creative Professional',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 5,
    name: 'Student',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 6,
    name: 'Young Professional',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 7,
    name: 'Entrepreneur',
    image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 8,
    name: 'Developer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  // New enhanced avatars for attendees
  {
    id: 9,
    name: 'Tech Enthusiast',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 10,
    name: 'Artist',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 11,
    name: 'Designer',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 12,
    name: 'Musician',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 13,
    name: 'Athlete',
    image: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 14,
    name: 'Writer',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 15,
    name: 'Photographer',
    image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  },
  {
    id: 16,
    name: 'Social Butterfly',
    image: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=150&h=150&fit=crop&crop=face',
    category: 'attendee'
  }
]

export default function AvatarSelector({ userRole = 'attendee', currentAvatar, onAvatarSelect, isOpen, onClose }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)

  const availableAvatars = AVATAR_OPTIONS.filter(avatar => 
    userRole === 'admin' ? true : avatar.category === 'attendee'
  )

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar)
    onAvatarSelect(avatar)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Choose Your Avatar
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {userRole === 'admin' 
            ? 'Select from professional avatars or student options:' 
            : 'Choose from our curated collection of avatars:'
          }
        </p>

        <div className="grid grid-cols-3 gap-3">
          {availableAvatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => handleSelect(avatar)}
              className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                selectedAvatar?.id === avatar.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">
                        <rect width="150" height="150" fill="#e5e7eb"/>
                        <path d="M75 75a25 25 0 1 0-25-25 25 25 0 0 0 25 25zm0 12.5c-16.67 0-50 8.33-50 25v12.5h100v-12.5c0-16.67-33.33-25-50-25z" fill="#9ca3af"/>
                      </svg>
                    `)}`
                  }}
                />
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {avatar.name}
                </span>
                {avatar.category === 'admin' && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    Professional
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSelect(selectedAvatar)}
            disabled={!selectedAvatar}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}

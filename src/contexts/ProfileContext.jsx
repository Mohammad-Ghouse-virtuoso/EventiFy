import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ProfileContext = createContext()

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth()
  
  // Get user-specific storage keys
  const getStorageKey = (type) => {
    if (!user?.id) return null
    return `user_${user.id}_${type}`
  }

  // Unified state for both avatar and banner (user-specific)
  const [currentAvatar, setCurrentAvatar] = useState(() => {
    if (!user?.id) return null
    const key = getStorageKey('avatar')
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  })

  const [userBanner, setUserBanner] = useState(() => {
    if (!user?.id) return null
    const key = getStorageKey('banner')
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  })

  // Update state when user changes
  useEffect(() => {
    if (user?.id) {
      const avatarKey = getStorageKey('avatar')
      const bannerKey = getStorageKey('banner')
      
      const savedAvatar = localStorage.getItem(avatarKey)
      const savedBanner = localStorage.getItem(bannerKey)
      
      setCurrentAvatar(savedAvatar ? JSON.parse(savedAvatar) : null)
      setUserBanner(savedBanner ? JSON.parse(savedBanner) : null)
    } else {
      setCurrentAvatar(null)
      setUserBanner(null)
    }
  }, [user?.id])

  // Update avatar and persist to user-specific localStorage
  const updateAvatar = (avatar) => {
    setCurrentAvatar(avatar)
    if (user?.id) {
      const key = getStorageKey('avatar')
      if (avatar) {
        localStorage.setItem(key, JSON.stringify(avatar))
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  // Update banner and persist to user-specific localStorage
  const updateBanner = (banner) => {
    setUserBanner(banner)
    if (user?.id) {
      const key = getStorageKey('banner')
      if (banner) {
        localStorage.setItem(key, JSON.stringify(banner))
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  const value = {
    currentAvatar,
    userBanner,
    updateAvatar,
    updateBanner
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

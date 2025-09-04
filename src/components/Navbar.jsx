import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { Bars3Icon, XMarkIcon, CalendarDaysIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline'

// Custom sparkles star icon component
const CustomSparklesIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
      fill="url(#sparkleGradient)"
      stroke="url(#sparkleStroke)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="50%" stopColor="#FF8FB3" />
        <stop offset="100%" stopColor="#FFB3D1" />
      </linearGradient>
      <linearGradient id="sparkleStroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#FF69B4" />
      </linearGradient>
    </defs>
  </svg>
)

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { currentAvatar } = useProfile()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold text-gray-800 hover:text-primary-600 transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <CustomSparklesIcon className="h-8 w-8 drop-shadow-md" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-gradient">EventiFy</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/events"
              className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 hover:scale-105"
            >
              <CalendarDaysIcon className="h-5 w-5" />
              <span>Events</span>
            </Link>
            {user ? (
              <>
                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Link
                    to="/create-event"
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 hover:scale-105"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Event</span>
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 hover:scale-105"
                >
                  <span>Dashboard</span>
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 hover:scale-105"
                  >
                    <span>Admin</span>
                  </Link>
                )}
                <div className="flex items-center space-x-3 ml-4">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar.image}
                      alt={currentAvatar.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <rect width="32" height="32" fill="#e5e7eb"/>
                            <path d="M16 16a6 6 0 1 0-6-6 6 6 0 0 0 6 6zm0 3c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" fill="#9ca3af"/>
                          </svg>
                        `)}`
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="text-gray-600 text-sm">
                    <span className="text-primary-600">Welcome,</span>
                    <br />
                    <span className="font-medium text-gray-800">{user.full_name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn bg-gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn bg-gradient-primary text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/events" className="block px-3 py-2 text-gray-700">
                Events
              </Link>
              {user ? (
                <>
                  {(user.role === 'organizer' || user.role === 'admin') && (
                    <Link to="/create-event" className="block px-3 py-2 text-gray-700">
                      Create Event
                    </Link>
                  )}
                  <Link to="/dashboard" className="block px-3 py-2 text-gray-700">
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-3 py-2 text-gray-700">
                      Admin
                    </Link>
                  )}
                  <div className="px-3 py-2 text-sm text-gray-500 capitalize">
                    Role: {user.role}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-gray-700">
                    Login
                  </Link>
                  <Link to="/register" className="block px-3 py-2 text-gray-700">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
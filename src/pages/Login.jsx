import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, SparklesIcon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline'

// Custom sparkles star icon component (same as Navbar, Home, and Footer)
const CustomSparklesIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
      fill="url(#sparkleGradientLogin)"
      stroke="url(#sparkleStrokeLogin)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient id="sparkleGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="50%" stopColor="#FF8FB3" />
        <stop offset="100%" stopColor="#FFB3D1" />
      </linearGradient>
      <linearGradient id="sparkleStrokeLogin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#FF69B4" />
      </linearGradient>
    </defs>
  </svg>
)

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Welcome Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 text-white">
          <div className="animate-slide-up">
            <div className="flex items-center mb-8">
              <CustomSparklesIcon className="h-12 w-12 drop-shadow-md mr-4" />
              <h1 className="text-display-lg font-bold">EventiFy</h1>
            </div>

            <h2 className="text-display-md mb-6 leading-tight">
              Welcome back to your
              <span className="block text-secondary-300">event universe</span>
            </h2>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Discover amazing events, connect with like-minded people, and create unforgettable memories.
            </p>

            <div className="space-y-4">
              <div className="flex items-center text-white/90">
                <CalendarDaysIcon className="h-6 w-6 text-secondary-300 mr-3" />
                <span>Discover events that match your interests</span>
              </div>
              <div className="flex items-center text-white/90">
                <UsersIcon className="h-6 w-6 text-secondary-300 mr-3" />
                <span>Connect with amazing people in your community</span>
              </div>
              <div className="flex items-center text-white/90">
                <CustomSparklesIcon className="h-6 w-6 mr-3" />
                <span>Create and manage your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-bounce-in">
              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center mb-6">
                  <CustomSparklesIcon className="h-10 w-10 drop-shadow-md mr-3" />
                  <h1 className="text-3xl font-bold text-white">EventiFy</h1>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back!
                </h2>
                <p className="text-white/70 mb-4">
                  Sign in to continue your journey
                </p>
                <Link
                  to="/register"
                  className="text-secondary-300 hover:text-secondary-200 font-medium transition-colors"
                >
                  Don't have an account? Create one →
                </Link>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-error-500/20 border border-error-300/30 text-error-100 px-4 py-3 rounded-lg backdrop-blur-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-secondary-300 focus:bg-white/20"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-secondary-300 focus:bg-white/20 pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn bg-gradient-secondary text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in to EventiFy'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

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
      navigate(redirectTo)
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Subtle warm gradient overlay - Notion/iOS inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-orange-50/60"></div>
      
      {/* Subtle mesh gradient accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-orange-100/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Welcome Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
          <div className="animate-slide-up">
            <div className="flex items-center mb-10">
              <CustomSparklesIcon className="h-10 w-10 drop-shadow-sm mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">EventiFy</h1>
            </div>

            <h2 className="text-4xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight">
              Welcome back to your
              <span className="block bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">event universe</span>
            </h2>

            <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-md">
              Discover amazing events, connect with like-minded people, and create unforgettable memories.
            </p>

            <div className="space-y-5">
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[15px]">Discover events that match your interests</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mr-4">
                  <UsersIcon className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-[15px]">Connect with amazing people in your community</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mr-4">
                  <CustomSparklesIcon className="h-5 w-5" />
                </div>
                <span className="text-[15px]">Create and manage your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 animate-bounce-in">
              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center mb-6">
                  <CustomSparklesIcon className="h-8 w-8 drop-shadow-sm mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">EventiFy</h1>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome Back!
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Sign in to continue your journey
                </p>
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Don't have an account? Create one →
                </Link>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
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

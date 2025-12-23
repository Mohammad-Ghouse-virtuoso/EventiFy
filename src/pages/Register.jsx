import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, SparklesIcon, CalendarDaysIcon, UsersIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      })
      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Subtle warm gradient overlay - Notion/iOS inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white to-blue-50/60"></div>
      
      {/* Subtle mesh gradient accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Welcome Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
          <div className="animate-slide-up">
            <div className="flex items-center mb-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-4 shadow-lg shadow-orange-500/20">
                <UserPlusIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Join EventiFy</h1>
            </div>

            <h2 className="text-4xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight">
              Start your journey to
              <span className="block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">amazing events</span>
            </h2>

            <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-md">
              Create your account and unlock access to incredible events, connect with your community, and start making memories.
            </p>

            <div className="space-y-5">
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mr-4">
                  <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-[15px]">Access to exclusive events in your area</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[15px]">Connect with like-minded event enthusiasts</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mr-4">
                  <SparklesIcon className="h-5 w-5 text-pink-500" />
                </div>
                <span className="text-[15px]">Create and manage your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 animate-bounce-in">
              <div className="text-center mb-6">
                <div className="lg:hidden flex items-center justify-center mb-6">
                  <SparklesIcon className="h-8 w-8 text-orange-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">EventiFy</h1>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-500 text-sm mb-3">
                  Join thousands of event enthusiasts
                </p>
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Already have an account? Sign in →
                </Link>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

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
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Info about capabilities */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-sm text-gray-600">
                      ✨ With your account you can discover events, RSVP, <strong className="text-gray-900">and create your own events</strong> — all in one place!
                    </p>
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
                        placeholder="Create a password"
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

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
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
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Join EventiFy'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal bottom line */}
      <div className="absolute bottom-4 left-0 right-0 z-10">
        <p className="text-center text-gray-400 text-xs">
          © {currentYear}, Copyright EventiFy. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

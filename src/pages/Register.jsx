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
    <div className="min-h-screen relative overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-500 to-orange-400"></div>
      {/* Soft overlay for glass effect */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-80 h-80 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Welcome Content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 text-white">
          <div className="animate-slide-up">
            <div className="flex items-center mb-8">
              <UserPlusIcon className="h-12 w-12 text-secondary-300 mr-4" />
              <h1 className="text-display-lg font-bold">Join EventiFy</h1>
            </div>

            <h2 className="text-display-md mb-6 leading-tight">
              Start your journey to
              <span className="block text-secondary-300">amazing events</span>
            </h2>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Create your account and unlock access to incredible events, connect with your community, and start making memories.
            </p>

            <div className="space-y-4">
              <div className="flex items-center text-white/90">
                <CalendarDaysIcon className="h-6 w-6 text-secondary-300 mr-3" />
                <span>Access to exclusive events in your area</span>
              </div>
              <div className="flex items-center text-white/90">
                <UsersIcon className="h-6 w-6 text-secondary-300 mr-3" />
                <span>Connect with like-minded event enthusiasts</span>
              </div>
              <div className="flex items-center text-white/90">
                <SparklesIcon className="h-6 w-6 text-secondary-300 mr-3" />
                <span>Create and manage your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-bounce-in">
              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center mb-6">
                  <SparklesIcon className="h-10 w-10 text-secondary-400 mr-3" />
                  <h1 className="text-3xl font-bold text-white">EventiFy</h1>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create Account
                </h2>
                <p className="text-white/70 mb-4">
                  Join thousands of event enthusiasts
                </p>
                <Link
                  to="/login"
                  className="text-secondary-300 hover:text-secondary-200 font-medium transition-colors"
                >
                  Already have an account? Sign in →
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
                    <label htmlFor="full_name" className="block text-sm font-medium text-white/90 mb-2">
                      Full Name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-secondary-300 focus:bg-white/20"
                      placeholder="Enter your full name"
                    />
                  </div>

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

                  {/* Info about capabilities */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/70">
                      ✨ With your account you can discover events, RSVP, <strong className="text-white">and create your own events</strong> — all in one place!
                    </p>
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
                        placeholder="Create a password"
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

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
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
                        className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-secondary-300 focus:bg-white/20 pr-12"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn bg-gradient-primary text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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

      {/* Minimal bottom line (no footer sections) */}
      <div className="absolute bottom-3 left-0 right-0 z-10">
        <p className="text-center text-white/80 text-xs sm:text-sm">
          © {currentYear}, Copyright EventiFy. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

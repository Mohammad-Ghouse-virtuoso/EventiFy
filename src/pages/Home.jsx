import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarDaysIcon, UserGroupIcon, QrCodeIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { user } = useAuth()

  const features = [
    {
      icon: CalendarDaysIcon,
      title: 'Easy Event Creation',
      description: 'Create and manage events with our intuitive interface'
    },
    {
      icon: UserGroupIcon,
      title: 'Smart RSVP System',
      description: 'Track attendees and manage capacity effortlessly'
    },
    {
      icon: QrCodeIcon,
      title: 'QR Code Check-ins',
      description: 'Seamless event check-ins with QR code generation'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to EventiFy
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              The modern way to create, manage, and attend events. 
              Built for Gen-Z with clean design and lightning-fast performance.
            </p>
            
            <div className="space-x-4">
              {user ? (
                <>
                  <Link
                    to="/events"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Browse Events
                  </Link>
                  <Link
                    to="/create-event"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    Create Event
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/events"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    Browse Events
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose EventiFy?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to create memorable events and connect with your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
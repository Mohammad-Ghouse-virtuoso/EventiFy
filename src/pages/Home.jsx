import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CalendarDaysIcon, UserGroupIcon, QrCodeIcon, SparklesIcon, ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline'

// Custom sparkles star icon component (same as Navbar)
const CustomSparklesIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
      fill="url(#sparkleGradientHome)"
      stroke="url(#sparkleStrokeHome)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient id="sparkleGradientHome" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="50%" stopColor="#FF8FB3" />
        <stop offset="100%" stopColor="#FFB3D1" />
      </linearGradient>
      <linearGradient id="sparkleStrokeHome" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#FF69B4" />
      </linearGradient>
    </defs>
  </svg>
)

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
      <div className="relative bg-gradient-hero text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <CustomSparklesIcon className="h-16 w-16 drop-shadow-md animate-bounce-in" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-display-xl font-bold ml-4">
                Event<span className="text-secondary-300">iFy</span>
              </h1>
            </div>

            <h2 className="text-display-md mb-8 leading-tight animate-slide-up">
              The modern way to create, manage,
              <br />
              <span className="text-secondary-300">and attend events</span>
            </h2>

            <p className="text-xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed animate-slide-up">
              Built for Gen-Z with clean design, lightning-fast performance, and intuitive features.
              Connect with your community and create unforgettable memories.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up">
              {user ? (
                <>
                  <Link
                    to="/events"
                    className="btn bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                  >
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    Browse Events
                  </Link>
                  <Link
                    to="/create-event"
                    className="btn border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-200 flex items-center justify-center"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Create Event
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn bg-gradient-secondary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                  >
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Get Started
                  </Link>
                  <Link
                    to="/events"
                    className="btn border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-200 flex items-center justify-center"
                  >
                    Browse Events
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </Link>
                </>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slide-up">
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary-300 mb-2">1000+</div>
                <div className="text-white/80">Events Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary-300 mb-2">5000+</div>
                <div className="text-white/80">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary-300 mb-2">50+</div>
                <div className="text-white/80">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-display-md text-gray-900 mb-6">
              Why Choose EventiFy?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to create memorable events and connect with your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 card hover-lift animate-slide-up" style={{animationDelay: `${index * 200}ms`}}>
                <div className="bg-gradient-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
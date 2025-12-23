import { SparklesIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

// Custom sparkles star icon component (same as Navbar and Home)
const CustomSparklesIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14.09 8.26L20 10L14.09 11.74L12 18L9.91 11.74L4 10L9.91 8.26L12 2Z"
      fill="url(#sparkleGradientFooter)"
      stroke="url(#sparkleStrokeFooter)"
      strokeWidth="0.5"
    />
    <defs>
      <linearGradient id="sparkleGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B9D" />
        <stop offset="50%" stopColor="#FF8FB3" />
        <stop offset="100%" stopColor="#FFB3D1" />
      </linearGradient>
      <linearGradient id="sparkleStrokeFooter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="100%" stopColor="#FF69B4" />
      </linearGradient>
    </defs>
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()
  // Resolve social icon asset URLs
  let iconFacebook, iconX, iconLinkedIn, iconInstagram
  try {
    iconFacebook = new URL('../../assets/icons8-facebook-48.png', import.meta.url).href
    iconX = new URL('../../assets/icons8-x-50.png', import.meta.url).href
    iconLinkedIn = new URL('../../assets/icons8-linkedin-48.png', import.meta.url).href
    iconInstagram = new URL('../../assets/icons8-instagram-64.png', import.meta.url).href
  } catch {}

  return (
    <footer className="relative text-white mt-auto overflow-hidden">
      {/* Softer blue-orange gradient at 35% opacity */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-blue-500/70 to-orange-400/80"></div>
      {/* Soft overlay for glass effect */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <CustomSparklesIcon className="h-8 w-8 drop-shadow-md" />
              <h3 className="text-2xl font-bold">EventiFy</h3>
            </div>
            <p className="text-white/80 mb-6 max-w-md">
              Discover amazing events, connect with like-minded people, and create unforgettable memories. 
              Your gateway to the best events in your community.
            </p>
            <div className="flex space-x-4">
              {/* Social Links */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label="Facebook"
              >
                {iconFacebook ? (
                  <img src={iconFacebook} alt="Facebook" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="sr-only">Facebook</span>
                )}
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label="X (Twitter)"
              >
                {iconX ? (
                  <img src={iconX} alt="X (Twitter)" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="sr-only">X</span>
                )}
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label="Instagram"
              >
                {iconInstagram ? (
                  <img src={iconInstagram} alt="Instagram" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="sr-only">Instagram</span>
                )}
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label="LinkedIn"
              >
                {iconLinkedIn ? (
                  <img src={iconLinkedIn} alt="LinkedIn" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="sr-only">LinkedIn</span>
                )}
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-secondary-300">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-white/80 hover:text-white transition-colors duration-200">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-white/80 hover:text-white transition-colors duration-200">
                  Create Event
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-white/80 hover:text-white transition-colors duration-200">
                  Join EventiFy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-secondary-300">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-white/80 hover:text-white transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-white transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/80 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/80 hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm">
            © {currentYear} EventiFy. All rights reserved. Made with ❤️ for amazing events.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-white/60 text-sm">Powered by</span>
            <div className="flex items-center space-x-1">
              <SparklesIcon className="h-4 w-4 text-secondary-400" />
              <span className="text-sm font-medium text-secondary-300">EventiFy Platform</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

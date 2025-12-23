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
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-5">
              <CustomSparklesIcon className="h-7 w-7" />
              <h3 className="text-xl font-semibold">EventiFy</h3>
            </div>
            <p className="text-gray-400 mb-8 max-w-sm leading-relaxed text-[15px]">
              Discover amazing events, connect with like-minded people, and create unforgettable memories. 
              Your gateway to the best events in your community.
            </p>
            <div className="flex space-x-3">
              {/* Social Links */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-all duration-200"
                aria-label="Facebook"
              >
                {iconFacebook ? (
                  <img src={iconFacebook} alt="Facebook" className="h-5 w-5 object-contain opacity-70" />
                ) : (
                  <span className="sr-only">Facebook</span>
                )}
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-all duration-200"
                aria-label="X (Twitter)"
              >
                {iconX ? (
                  <img src={iconX} alt="X (Twitter)" className="h-5 w-5 object-contain opacity-70" />
                ) : (
                  <span className="sr-only">X</span>
                )}
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-all duration-200"
                aria-label="Instagram"
              >
                {iconInstagram ? (
                  <img src={iconInstagram} alt="Instagram" className="h-5 w-5 object-contain opacity-70" />
                ) : (
                  <span className="sr-only">Instagram</span>
                )}
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-all duration-200"
                aria-label="LinkedIn"
              >
                {iconLinkedIn ? (
                  <img src={iconLinkedIn} alt="LinkedIn" className="h-5 w-5 object-contain opacity-70" />
                ) : (
                  <span className="sr-only">LinkedIn</span>
                )}
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-5 text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/events" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Create Event
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Join EventiFy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold mb-5 text-white uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 text-[15px]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} EventiFy. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-gray-500 text-sm">Made with</span>
            <span className="text-red-400">❤️</span>
            <span className="text-gray-500 text-sm">for amazing events</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

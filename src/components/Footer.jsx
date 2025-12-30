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
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <CustomSparklesIcon className="h-6 w-6" />
              <h3 className="text-lg font-bold">EventiFy</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Where FOMO meets IRL. 🎉
            </p>
            {/* Quirky Social Links */}
            <div className="flex space-x-2">
              <a
                href="https://facebook.com/eventify"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Stalk us on Facebook"
                title="Stalk us on Facebook"
              >
                {iconFacebook ? (
                  <img src={iconFacebook} alt="Facebook" className="h-4 w-4 object-contain opacity-90" />
                ) : (
                  <span className="text-xs">f</span>
                )}
              </a>
              <a
                href="https://x.com/eventify"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-black hover:bg-gray-800 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Tweet at us"
                title="Tweet at us (we reply!)"
              >
                {iconX ? (
                  <img src={iconX} alt="X" className="h-4 w-4 object-contain opacity-90" />
                ) : (
                  <span className="text-xs">X</span>
                )}
              </a>
              <a
                href="https://instagram.com/eventify"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 hover:from-purple-500 hover:via-pink-400 hover:to-orange-400 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Double-tap us on Instagram"
                title="Double-tap worthy content"
              >
                {iconInstagram ? (
                  <img src={iconInstagram} alt="Instagram" className="h-4 w-4 object-contain opacity-90" />
                ) : (
                  <span className="text-xs">IG</span>
                )}
              </a>
              <a
                href="https://linkedin.com/company/eventify"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-blue-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label="Connect on LinkedIn"
                title="Let's get professional"
              >
                {iconLinkedIn ? (
                  <img src={iconLinkedIn} alt="LinkedIn" className="h-4 w-4 object-contain opacity-90" />
                ) : (
                  <span className="text-xs">in</span>
                )}
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white">Explore</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/events" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Find Events
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Host an Event
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  Join the Fun
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white">Support</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-secondary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">💬</span>
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:support@eventify.com" className="text-gray-400 hover:text-secondary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">📧</span>
                  Email Us
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-secondary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">🔒</span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-secondary-400 transition-colors text-sm flex items-center group">
                  <span className="mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">📜</span>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-white">Stay in the Loop</h4>
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              Get event drops, insider tips, and maybe some bad jokes.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-sm font-medium transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs">
          <p className="text-gray-500">
            © {currentYear} EventiFy. Built with ✨ and caffeine.
          </p>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Status</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">API</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Careers</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

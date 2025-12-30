import { Link } from 'react-router-dom'

import instagramPng from '../../assets/icons8-instagram-64.png'
import xPng from '../../assets/icons8-x-50.png'
import linkedinPng from '../../assets/icons8-linkedin-48.png'
import facebookPng from '../../assets/icons8-facebook-48.png'

const socialIcons = {
  instagram: instagramPng,
  x: xPng,
  linkedin: linkedinPng,
  facebook: facebookPng,
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const handleSocial = (platform) => {
    const messages = {
      instagram: 'We post the photogenic snacks here. 📸',
      x: '140 characters of event chaos. 🐦',
      linkedin: 'Let’s connect and talk shop. 🔗',
      facebook: 'RSVP with your aunt’s account. 👍',
    }
    alert(messages[platform] || 'See you online!')
  }

  return (
    <footer className="bg-gray-900 text-white mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold">EventiFy</h3>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              Real people. Real events. Built by humans.
            </p>
            <div className="flex gap-3 mt-3 items-center">
              {[
                { key: 'facebook', label: 'Facebook', icon: socialIcons.facebook },
                { key: 'x', label: 'X', icon: socialIcons.x },
                { key: 'instagram', label: 'Instagram', icon: socialIcons.instagram },
                { key: 'linkedin', label: 'LinkedIn', icon: socialIcons.linkedin },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSocial(item.key)}
                  className="w-8 h-8 rounded-md hover:bg-gray-800/60 transition-colors flex items-center justify-center"
                  aria-label={item.label}
                >
                  <img src={item.icon} alt={item.label} className="h-4 w-4 object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Explore</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/events" className="hover:text-white transition-colors">Find Events</Link></li>
              <li><Link to="/create-event" className="hover:text-white transition-colors">Host an Event</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Join the Fun</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><a href="mailto:support@eventify.com" className="hover:text-white transition-colors">Email Us</a></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/socials" className="hover:text-white transition-colors">Socials</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Stay in the Loop</h4>
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              Get drops, tips, and the occasional bad joke.
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
        <div className="border-t border-gray-800 mt-8 pt-5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {currentYear} EventiFy. Built with caffeine.</p>
        </div>
      </div>
    </footer>
  )
}

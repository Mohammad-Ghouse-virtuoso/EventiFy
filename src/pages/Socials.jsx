import instagramPng from '../../assets/icons8-instagram-64.png'
import xPng from '../../assets/icons8-x-50.png'
import linkedinPng from '../../assets/icons8-linkedin-48.png'
import facebookPng from '../../assets/icons8-facebook-48.png'

const socials = [
  { key: 'instagram', label: 'Instagram', handle: '@eventify', icon: instagramPng, message: 'We post the photogenic snacks here. 📸' },
  { key: 'x', label: 'X', handle: '@eventify', icon: xPng, message: '140 characters of event chaos. 🐦' },
  { key: 'linkedin', label: 'LinkedIn', handle: 'EventiFy', icon: linkedinPng, message: 'Let’s connect and talk shop. 🔗' },
  { key: 'facebook', label: 'Facebook', handle: 'EventiFy', icon: facebookPng, message: 'RSVP with your aunt’s account. 👍' },
]

export default function Socials() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Socials</h1>
      <p className="text-gray-700 mb-6">Find us everywhere you scroll. We promise real humans behind the posts.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {socials.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => alert(s.message)}
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <img src={s.icon} alt={s.label} className="h-8 w-8 object-contain" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white">{s.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{s.handle}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{s.message}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useNotification } from '../contexts/NotificationContext'

export default function ShareButtons({ 
  eventTitle, 
  eventUrl, 
  eventDate,
  onClose 
}) {
  const { showSuccess } = useNotification()

  const handleShare = (platform) => {
    const shareText = `I'm attending ${eventTitle}`
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}&hashtags=EventiFy`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`Check out: ${eventTitle}`)}&body=${encodeURIComponent(`I'm attending ${eventTitle}\n\nDate: ${eventDate}\n\n${eventUrl}`)}`
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(eventUrl).then(() => {
        showSuccess('Copied to clipboard!')
      })
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Share Event</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { platform: 'whatsapp', icon: '💬', label: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600' },
          { platform: 'twitter', icon: '𝕏', label: 'Twitter', color: 'bg-black hover:bg-gray-900' },
          { platform: 'facebook', icon: 'f', label: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
          { platform: 'email', icon: '✉', label: 'Email', color: 'bg-gray-600 hover:bg-gray-700' },
          { platform: 'copy', icon: '🔗', label: 'Copy Link', color: 'bg-gray-400 hover:bg-gray-500' }
        ].map(({ platform, icon, label, color }) => (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={`${color} text-white px-3 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 dark:text-white`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

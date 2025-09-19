import { useNotification } from '../contexts/NotificationContext'

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out transform
            ${notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border-blue-400 text-blue-700' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 text-lg leading-none opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationContainer

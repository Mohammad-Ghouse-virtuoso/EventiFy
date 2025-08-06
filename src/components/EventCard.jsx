import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function EventCard({ event, onRSVP }) {
  const handleRSVP = (status) => {
    onRSVP(event.id, status)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {event.image && (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {format(new Date(event.date), 'PPP')} at {event.time}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <UsersIcon className="h-4 w-4 mr-2" />
            {event.attendees_count} / {event.max_attendees} attendees
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleRSVP('going')}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
          >
            Going
          </button>
          <button
            onClick={() => handleRSVP('maybe')}
            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 text-sm"
          >
            Maybe
          </button>
          <button
            onClick={() => handleRSVP('not_going')}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm"
          >
            Can't Go
          </button>
        </div>
      </div>
    </div>
  )
}
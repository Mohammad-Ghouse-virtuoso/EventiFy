import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, MapPinIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

/**
 * LumaHero - Luma-inspired dark landing page hero
 * 
 * Features:
 * - Dark gradient background
 * - Bold headline with gradient accent
 * - Phone mockup showing live event preview
 * - Floating 3D decorative elements
 * - Attendee avatars with names
 */

// Floating decorative elements
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Megaphone */}
    <div className="absolute top-1/4 left-[45%] w-16 h-16 animate-float-slow">
      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl rotate-12 shadow-lg shadow-pink-500/30 flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.27 5.57L4.42 6.72C4.78 6.36 5.23 6.09 5.73 5.94L4.58 4.79C4.08 4.94 3.63 5.21 3.27 5.57M19.77 18.43L18.62 17.28C18.26 17.64 17.81 17.91 17.31 18.06L18.46 19.21C18.96 19.06 19.41 18.79 19.77 18.43M12 17.27C12 17.27 12 17.27 12 17.27C12 17.27 12 17.27 12 17.27M20 12L18 8L6 4L2 8L4 16L8 20L16 16L20 12M16.32 12L14.24 15.1L12 12.86L9.76 15.1L7.68 12L10.78 8L12 6.78L13.22 8L16.32 12Z"/>
        </svg>
      </div>
    </div>
    
    {/* Calendar */}
    <div className="absolute top-1/3 right-[8%] w-14 h-14 animate-float-medium">
      <div className="w-full h-full bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
        <div className="bg-pink-500 h-4 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">DEC</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white">
          <span className="text-xl font-bold text-gray-800">23</span>
        </div>
      </div>
    </div>
    
    {/* Speaker Left */}
    <div className="absolute bottom-1/4 left-[35%] w-12 h-16 animate-float-fast">
      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-lg shadow-orange-500/30 flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-900 rounded-full border-2 border-gray-700"></div>
      </div>
    </div>
    
    {/* Speaker Right */}
    <div className="absolute bottom-1/3 right-[15%] w-10 h-14 animate-float-slow rotate-12">
      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg shadow-lg shadow-pink-500/30 flex items-center justify-center">
        <div className="w-5 h-5 bg-gray-900 rounded-full border-2 border-gray-700"></div>
      </div>
    </div>
    
    {/* Geometric shapes */}
    <div className="absolute top-1/2 left-[40%] w-8 h-8 animate-float-medium">
      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rotate-45 shadow-lg shadow-yellow-500/30"></div>
    </div>
    
    {/* Sparkles */}
    <div className="absolute top-20 left-10 text-white/20 animate-pulse">✦</div>
    <div className="absolute top-32 right-20 text-white/30 animate-pulse delay-500">✦</div>
    <div className="absolute bottom-40 left-20 text-white/20 animate-pulse delay-1000">✦</div>
  </div>
)

// Phone mockup showing event
const PhoneMockup = ({ event, attendees }) => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0 })
  
  useEffect(() => {
    if (!event?.event_start) return
    
    const updateCountdown = () => {
      const now = new Date()
      const eventDate = new Date(event.event_start)
      const diff = eventDate - now
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        setCountdown({ days, hours })
      }
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [event?.event_start])

  if (!event) return null

  const eventDate = new Date(event.event_start)
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="relative w-[280px] sm:w-[320px] mx-auto">
        {/* Phone bezel */}
        <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl shadow-pink-500/20 border border-gray-700">
          {/* Screen */}
          <div className="bg-gray-950 rounded-[2rem] overflow-hidden">
            {/* Status bar */}
            <div className="flex justify-between items-center px-6 py-2 text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3/4 h-full bg-white rounded-sm"></div>
                </div>
              </div>
            </div>
            
            {/* App header */}
            <div className="flex justify-between items-center px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-pink-500 font-bold text-sm">EventiFy</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs">Create Event</span>
                <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
              </div>
            </div>
            
            {/* Event image */}
            <div className="relative h-32 overflow-hidden">
              <img 
                src={event.image || event.thumbnail || '/assets/doodle.png'} 
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
            </div>
            
            {/* Event details */}
            <div className="px-4 py-3 space-y-3">
              <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <CalendarIcon className="w-4 h-4 text-pink-500" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-pink-500">🕐</span>
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPinIcon className="w-4 h-4 text-pink-500" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
              
              {/* Attendees */}
              {attendees && attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {attendees.slice(0, 4).map((attendee, i) => (
                      <div 
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-gray-950 flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: attendee.color }}
                      >
                        {attendee.initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {attendees.length} Guests • {attendees.slice(0, 2).map(a => a.name.split(' ')[0]).join(' & ')}
                  </span>
                </div>
              )}
              
              {/* Confirmed badge */}
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-3 border border-pink-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">You're In</p>
                    <p className="text-gray-400 text-xs">Confirmation sent to email</p>
                  </div>
                </div>
              </div>
              
              {/* Countdown & Calendar */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  ⏱ Event starting in <span className="text-pink-400 font-semibold">{countdown.days}d {countdown.hours}h</span>
                </span>
                <span className="text-pink-400">📅 Add to Calendar</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect behind phone */}
        <div className="absolute -inset-10 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 rounded-full"></div>
      </div>
    </div>
  )
}

export default function LumaHero({ featuredEvent, attendees = [] }) {
  return (
    <section className="relative min-h-[90vh] bg-gray-950 overflow-hidden flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"></div>
      
      {/* Circular gradient behind phone */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-full opacity-50 blur-sm"></div>
      
      {/* Floating elements */}
      <FloatingElements />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Logo/brand */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-8">
              <span className="text-2xl">✦</span>
              <span className="text-white/60 text-xl tracking-wide">eventify</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              Delightful
              <br />
              events
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                start here.
              </span>
            </h1>
            
            {/* Subtext */}
            <p className="text-gray-400 text-lg sm:text-xl max-w-md mx-auto lg:mx-0 mb-8">
              Set up an event page, invite friends and connect with your community. Host a memorable event today.
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/create-event"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-105"
              >
                Create Your First Event
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-700 text-white font-semibold rounded-xl hover:bg-white/5 transition-all duration-200"
              >
                Explore Events ↗
              </Link>
            </div>
          </div>
          
          {/* Right: Phone mockup */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <PhoneMockup event={featuredEvent} attendees={attendees} />
          </div>
        </div>
      </div>
    </section>
  )
}

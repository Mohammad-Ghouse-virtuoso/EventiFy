import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LumaHero from '../components/LumaHero'
import TrustedPartnersSection from '../components/TrustedPartnersSection'
import HowItWorks from '../components/HowItWorks'
import TestimonialsSection from '../components/TestimonialsSection'
import ClosingCTA from '../components/ClosingCTA'
import TrendingEvents from '../components/TrendingEvents'
import LiveStats from '../components/LiveStats'

// NPC attendees for social proof (fake users who "attend" events)
const NPC_ATTENDEES = [
  { name: 'Sarah Mitchell', initial: 'S', color: '#EC4899' },
  { name: 'Hugo Chen', initial: 'H', color: '#8B5CF6' },
  { name: 'John Davis', initial: 'J', color: '#3B82F6' },
  { name: 'Maya Patel', initial: 'M', color: '#10B981' },
  { name: 'Alex Rivera', initial: 'A', color: '#F59E0B' },
  { name: 'Emma Wilson', initial: 'E', color: '#EF4444' },
  { name: 'David Kim', initial: 'D', color: '#6366F1' },
  { name: 'Olivia Brown', initial: 'O', color: '#14B8A6' },
]

// Evergreen events for demo/fallback
const EVERGREEN_EVENTS = [
  {
    id: 'evergreen-1',
    title: 'Summer Music Festival',
    description: 'The ultimate outdoor music experience featuring top artists, food trucks, and unforgettable vibes.',
    category: 'Music',
    location: 'Central Park Amphitheater',
    event_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    max_attendees: 500,
    attendees_count: 342,
  },
  {
    id: 'evergreen-2',
    title: 'Golden Anniversary Gala',
    description: 'An elegant evening celebrating 50 years of love, laughter, and cherished memories.',
    category: 'Celebration',
    location: 'Grand Ballroom, Marriott Hotel',
    event_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    max_attendees: 200,
    attendees_count: 156,
  },
  {
    id: 'evergreen-3',
    title: 'Tech Innovators Meetup',
    description: 'Connect with fellow tech enthusiasts, hear lightning talks, and explore the latest innovations.',
    category: 'Technology',
    location: 'Innovation Hub, Downtown',
    event_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    max_attendees: 150,
    attendees_count: 98,
  },
  {
    id: 'evergreen-4',
    title: 'Sunset Yoga Retreat',
    description: 'Unwind with a peaceful yoga session as the sun sets over the ocean. All levels welcome.',
    category: 'Wellness',
    location: 'Oceanview Beach Resort',
    event_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    max_attendees: 50,
    attendees_count: 38,
  },
  {
    id: 'evergreen-5',
    title: 'Artisan Food & Wine Festival',
    description: 'Sample exquisite wines and gourmet dishes from local artisans and world-class chefs.',
    category: 'Food & Drink',
    location: 'Vineyard Estate, Napa Valley',
    event_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    max_attendees: 300,
    attendees_count: 215,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [featuredEvent, setFeaturedEvent] = useState(null)
  const [randomAttendees, setRandomAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        // Try to fetch real trending events
        const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1'
        const response = await fetch(`${apiBase}/stats/trending`)
        
        if (response.ok) {
          const events = await response.json()
          if (events && events.length > 0) {
            // Use the most popular real event
            setFeaturedEvent(events[0])
          } else {
            // Fallback to evergreen
            setFeaturedEvent(EVERGREEN_EVENTS[0])
          }
        } else {
          setFeaturedEvent(EVERGREEN_EVENTS[0])
        }
      } catch (error) {
        console.error('Failed to fetch featured event:', error)
        setFeaturedEvent(EVERGREEN_EVENTS[0])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedEvent()

    // Randomize attendees for social proof
    const shuffled = [...NPC_ATTENDEES].sort(() => Math.random() - 0.5)
    setRandomAttendees(shuffled.slice(0, 5))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Luma-style Hero */}
      <LumaHero 
        featuredEvent={featuredEvent} 
        attendees={randomAttendees}
      />
      
      {/* Live Stats */}
      <LiveStats className="py-12 bg-gray-900" />
      
      {/* Trending Events */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trending Now
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of people at these popular upcoming events
            </p>
          </div>
          <TrendingEvents />
        </div>
      </section>
      
      {/* How It Works */}
      <div className="bg-gray-900">
        <HowItWorks />
      </div>
      
      {/* Testimonials */}
      <div className="bg-gray-950">
        <TestimonialsSection />
      </div>
      
      {/* Final CTA */}
      <ClosingCTA 
        className="bg-gray-900" 
        onSignUp={() => navigate('/register')} 
      />
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { testimonialsAPI } from '../services/api'

// Direct imports for avatars
import aleenaImg from '../../assets/Aleena.jpg'
import mateoImg from '../../assets/Mateo P..jpg'
import sofiaImg from '../../assets/Sofia N.jpg'
import rajImg from '../../assets/Raj Sharma.jpg'
import sofiaImageImg from '../../assets/Sofia_image.jpg'
import maroofImg from '../../assets/Maroof K..jpg'

// Legacy static testimonials used as fallback when API returns empty
const STATIC_TESTIMONIALS = [
  { quote: "I discover relevant events in minutes, and the feed keeps getting smarter.", name: "Aleena", title: "Community Manager", avatar: aleenaImg, rating: 5 },
  { quote: "RSVP is literally one tap—no forms, no fuss.", name: "Mateo G.", title: "Data Engineer", avatar: mateoImg, rating: 5 },
  { quote: "I've met collaborators at every meetup since switching to EventiFy.", name: "Aisha K.", title: "Product Designer", avatar: sofiaImg, rating: 5 },
  { quote: "Finding niche meetups used to be hard—now it's part of my weekly routine.", name: "Raj Sharma", title: "Full-stack Developer", avatar: rajImg, rating: 4 },
  { quote: "Check-ins are smooth and fast—more time for real conversations.", name: "Sofia D.", title: "Growth Marketer", avatar: sofiaImageImg, rating: 5 },
  { quote: "The community vibes are unmatched—I actually look forward to events again.", name: "Maruf K.", title: "Startup Founder", avatar: maroofImg, rating: 5 },
]

function TestimonialCard({ testimonial }) {
  const initials = useMemo(() => (testimonial?.name || testimonial?.user_name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(), [testimonial?.name, testimonial?.user_name])
  const avatarSrc = testimonial.avatar || testimonial.avatar_url || null
  const displayName = testimonial.name || testimonial.user_name || 'User'
  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} 
          />
        ))}
      </div>
      
      {/* Quote */}
      <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base leading-relaxed mb-5">
        "{testimonial.quote}"
      </p>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
          {avatarSrc ? (
            <img 
              src={avatarSrc} 
              alt={displayName} 
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400">
              {initials}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{displayName}</p>
          {testimonial.title && <p className="text-gray-500 dark:text-gray-400 text-xs">{testimonial.title}</p>}
        </div>
      </div>
    </article>
  )
}

export default function TestimonialsSection({ className = '' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const featured = await testimonialsAPI.featured({ limit: 6 })
        if (!mounted) return
        if (Array.isArray(featured) && featured.length > 0) {
          setItems(featured)
        } else {
          setItems(STATIC_TESTIMONIALS)
        }
      } catch (e) {
        console.error('Testimonials load failed, using fallback:', e)
        setItems(STATIC_TESTIMONIALS)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="testimonials-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="testimonials-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            What people say?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Short, real, and to the point
          </p>
        </div>

        {/* Grid of testimonials - dynamic with static fallback */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {items.map((testimonial, idx) => (
              <TestimonialCard key={idx} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

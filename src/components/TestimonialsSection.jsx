import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
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
    <div className="flex-shrink-0 w-full md:w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 will-change-transform flex flex-col">
      {/* Stars with improved spacing */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-4 w-4 transition-transform duration-200 ${i < testimonial.rating ? 'text-amber-400 scale-110' : 'text-gray-300 dark:text-gray-600'}`} 
          />
        ))}
      </div>
      
      {/* Quote with better typography */}
      <blockquote className="flex-1 mb-6">
        <p className="text-gray-700 dark:text-gray-200 text-base sm:text-lg leading-relaxed font-medium">
          <span className="text-gray-400 dark:text-gray-500 mr-1">"</span>
          <span className="italic">{testimonial.quote}</span>
          <span className="text-gray-400 dark:text-gray-500 ml-1">"</span>
        </p>
      </blockquote>
      
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-5" />
      
      {/* Author section with improved layout */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20" />
          <div className="relative h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden flex items-center justify-center border border-white/20 dark:border-gray-600">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt={displayName} 
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="h-full w-full flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{displayName}</p>
          {testimonial.title && (
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{testimonial.title}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsSection({ className = '' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

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

  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [checkScroll])

  const scroll = useCallback((direction) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollAmount = 420 // card width (384px) + gap (36px)
    
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount
    
    container.scrollTo({ 
      left: targetScroll, 
      behavior: 'smooth'
    })
  }, [])

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with gradient accent */}
        <div className="mb-10 sm:mb-12 text-center">
          <h2 id="testimonials-title" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            What people say
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Real stories from our community
          </p>
          {/* Decorative underline */}
          <div className="mx-auto mt-4 h-1 w-20 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full" />
        </div>

        {/* Carousel Container */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-96 h-48 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative group">
            {/* Scroll Container with GPU acceleration */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory will-change-transform"
              style={{ 
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {items.map((testimonial, idx) => (
                <div key={idx} className="snap-center">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Hidden/Visible based on scroll state */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 md:-translate-x-12 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-xl hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 will-change-transform hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Scroll testimonials left"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 md:translate-x-12 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-xl hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200 will-change-transform hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Scroll testimonials right"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        #testimonials-scroll::-webkit-scrollbar {
          display: none;
        }
        /* GPU acceleration for smooth animations */
        .will-change-transform {
          will-change: transform;
        }
        /* Snap scroll points for better UX */
        .snap-center {
          scroll-snap-align: center;
          scroll-snap-stop: always;
        }
      `}</style>
    </section>
  )
}

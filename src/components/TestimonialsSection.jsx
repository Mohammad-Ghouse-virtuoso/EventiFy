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

function TestimonialCard({ testimonial, isActive = false }) {
  const initials = useMemo(() => (testimonial?.name || testimonial?.user_name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(), [testimonial?.name, testimonial?.user_name])
  const avatarSrc = testimonial.avatar || testimonial.avatar_url || null
  const displayName = testimonial.name || testimonial.user_name || 'User'
  
  return (
    <div className={`flex-shrink-0 w-full sm:w-[28rem] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border-2 transition-all duration-300 will-change-transform ${
      isActive 
        ? 'border-purple-300 dark:border-purple-600 shadow-2xl scale-100' 
        : 'border-gray-200 dark:border-gray-700 shadow-lg'
    } p-8 sm:p-10 flex flex-col`}>
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-t-3xl" />
      
      {/* Stars with animation */}
      <div className="flex gap-1.5 mb-6 mt-2">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-4 w-4 transition-all duration-300 ${i < testimonial.rating ? 'text-amber-400 scale-125' : 'text-gray-300 dark:text-gray-600 opacity-50'}`} 
          />
        ))}
      </div>
      
      {/* Quote - Modern minimalist */}
      <blockquote className="flex-1 mb-8">
        <p className="text-gray-800 dark:text-gray-100 text-lg sm:text-xl leading-relaxed font-medium tracking-tight">
          {testimonial.quote}
        </p>
      </blockquote>
      
      {/* Author section - Modern horizontal layout */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        {/* Avatar with badge */}
        <div className="relative flex-shrink-0">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
            <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt={displayName} 
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-purple-400 to-pink-400">
                  {initials}
                </span>
              )}
            </div>
          </div>
          {/* Rating badge */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-lg">
            {testimonial.rating}★
          </div>
        </div>
        
        {/* Name & Title */}
        <div className="min-w-0 flex-1">
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
  const [activeIndex, setActiveIndex] = useState(0)

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
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    
    // Update active index based on scroll position
    const cardWidth = 450 // card width + gap
    const index = Math.round(scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, items.length - 1))
  }, [items.length])

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
    const scrollAmount = 450 // card width (448px) + gap (24px)
    
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount
    
    container.scrollTo({ 
      left: targetScroll, 
      behavior: 'smooth'
    })
  }, [])

  return (
    <section className={`w-full py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 ${className}`} aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with modern styling */}
        <div className="mb-14 sm:mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
            <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">TESTIMONIALS</span>
            <div className="h-1 w-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full" />
          </div>
          <h2 id="testimonials-title" className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Loved by the community
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            See what our members are saying about their experience discovering and attending events
          </p>
        </div>

        {/* Carousel Container */}
        {loading ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-96 h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative group">
            {/* Scroll Container with modern styling */}
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
                <div key={idx} className="snap-center relative">
                  <TestimonialCard 
                    testimonial={testimonial} 
                    isActive={idx === activeIndex}
                  />
                </div>
              ))}
            </div>

            {/* Modern Navigation - Bottom centered */}
            <div className="flex items-center justify-center gap-4 mt-10">
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  className="p-3 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:scale-110 will-change-transform"
                  aria-label="Scroll testimonials left"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
              )}
              
              {/* Dot indicators */}
              <div className="flex gap-2">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const container = scrollContainerRef.current
                      if (container) {
                        const targetScroll = idx * 450
                        container.scrollTo({ left: targetScroll, behavior: 'smooth' })
                      }
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                        : 'bg-gray-300 dark:bg-gray-700 w-2.5 hover:bg-gray-400 dark:hover:bg-gray-600'
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
              
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  className="p-3 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:scale-110 will-change-transform"
                  aria-label="Scroll testimonials right"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
              )}
            </div>

            {/* Progress text */}
            <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
              {activeIndex + 1} / {items.length}
            </div>
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

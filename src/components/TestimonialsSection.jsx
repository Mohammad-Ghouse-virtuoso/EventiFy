import React, { useEffect, useRef, useState } from 'react'

/**
 * TestimonialsSection
 * Minimalist vertical list of testimonials. Clean and scannable.
 * - Small circular avatar (placeholder or <img>)
 * - Quote text
 * - Centered user name/title
 * - Subtle divider between entries
 * Scroll-friendly container for many items.
 */
export default function TestimonialsSection({ className = '', testimonials }) {
  let aleena, rita, sofia, sofia_image, raj, mateo, maroof
  try {
    aleena = new URL('../../assets/Aleena.jpg', import.meta.url).href
    rita = new URL('../../assets/Rita M..jpg', import.meta.url).href
    sofia = new URL('../../assets/Sofia N.jpg', import.meta.url).href
    sofia_image = new URL('../../assets/Sofia_image.jpg', import.meta.url).href
    raj = new URL('../../assets/Raj Sharma.jpg', import.meta.url).href
    mateo = new URL('../../assets/Mateo P..jpg', import.meta.url).href
    maroof = new URL('../../assets/Maroof K..jpg', import.meta.url).href
  } catch (_) {}

  const items = testimonials?.length ? testimonials : [
    // Female
    {
      quote: 'I discover relevant events in minutes, and the feed keeps getting smarter.',
      name: 'Aleena',
      title: 'Community Manager',
      avatar: aleena || null,
      gender: 'female',
    },
    // Male
    {
      quote: 'RSVP is literally one tap—no forms, no fuss.',
      name: 'Mateo G.',
      title: 'Data Engineer',
      avatar: mateo || null,
      gender: 'male',
    },
    // Female
    {
      quote: 'I’ve met collaborators at every meetup since switching to EventiFy.',
      name: 'Aisha K.',
      title: 'Product Designer',
      avatar: sofia || null,
      gender: 'female',
    },
    // Male
    {
      quote: 'Finding niche meetups used to be hard—now it’s part of my weekly routine.',
      name: 'Raj Sharma',
      title: 'Full‑stack Developer',
      avatar: raj || null,
      gender: 'male',
    },
    // Female
    {
      quote: 'Check‑ins are smooth and fast—more time for real conversations.',
      name: 'Sofia D.',
      title: 'Growth Marketer',
      avatar: sofia_image || null,
      gender: 'female',
    },
    // Male
    {
      quote: 'The community vibes are unmatched—I actually look forward to events again.',
      name: 'Maruf K.',
      title: 'Startup Founder',
      avatar: maroof || null,
      gender: 'male',
    },
  ]

  const [index, setIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const trackRef = useRef(null)
  const containerRef = useRef(null)
  const drag = useRef({ down: false, startX: 0, deltaX: 0 })
  const count = items.length
  const pausedRef = useRef(false)
  const timerRef = useRef(null)

  // Auto-advance every 8s (slower, less clumsy)
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    if (!pausedRef.current) {
      timerRef.current = setInterval(() => {
        setIndex((i) => i + 1)
      }, 8000) // Increased from 5s to 8s for less aggressive transitions
    }
  }

  useEffect(() => {
    startTimer()
    return () => clearTimer()
  }, [])

  // Handle infinite loop: reset index without animation when we hit clone positions
  useEffect(() => {
    if (index === count) {
      // We've scrolled past the last real item into the first clone
      // Wait for transition to complete, then snap back to real first item
      const timeout = setTimeout(() => {
        setIsTransitioning(false)
        setIndex(0)
        // Re-enable transition after a frame
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      }, 500)
      return () => clearTimeout(timeout)
    } else if (index === -1) {
      // We've scrolled before the first real item into the last clone
      const timeout = setTimeout(() => {
        setIsTransitioning(false)
        setIndex(count - 1)
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [index, count])

  const goTo = (i) => {
    setIsTransitioning(true)
    setIndex(i)
  }

  const next = () => {
    setIsTransitioning(true)
    setIndex((i) => i + 1)
  }

  const prev = () => {
    setIsTransitioning(true)
    setIndex((i) => i - 1)
  }

  // Swipe/drag - simplified and less janky
  const onStart = (x) => {
    drag.current.down = true
    drag.current.startX = x
    drag.current.deltaX = 0
    pausedRef.current = true
    clearTimer()
  }

  const onMove = (x) => {
    if (!drag.current.down) return
    drag.current.deltaX = x - drag.current.startX
  }

  const onEnd = () => {
    if (!drag.current.down) return
    const threshold = (containerRef.current?.clientWidth || 1) * 0.2
    if (drag.current.deltaX > threshold) {
      prev()
    } else if (drag.current.deltaX < -threshold) {
      next()
    }
    drag.current.down = false
    drag.current.deltaX = 0
    pausedRef.current = false
    setTimeout(() => startTimer(), 1000) // Longer delay before resuming
  }

  const handleMouseEnter = () => {
    pausedRef.current = true
    clearTimer()
  }

  const handleMouseLeave = () => {
    if (!drag.current.down) {
      pausedRef.current = false
      startTimer()
    }
  }

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="testimonials-title">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="testimonials-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">What people say?</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">Short, real, and to the point</p>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl"
          onMouseDown={(e) => onStart(e.clientX)}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseUp={onEnd}
          onTouchStart={(e) => onStart(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={onEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Track */}
          <div
            ref={trackRef}
            className={`flex ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((t, idx) => (
              <div key={idx} className="w-full shrink-0 px-1">
                <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 md:p-10 text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                    {t.avatar ? (
                      <img src={t.avatar} alt={`${t.name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{(t.name || '?').slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="mt-5">
                    <p className="text-lg sm:text-xl leading-relaxed text-gray-900 dark:text-white italic">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <div className="h-px w-24 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
                    <span className="text-gray-400 dark:text-gray-500"> | </span>
                    <span>{t.title}</span>
                  </p>
                </article>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i === (index < 0 ? count - 1 : index >= count ? 0 : index) 
                    ? 'bg-gray-800 dark:bg-gray-200 w-6' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

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
  const trackRef = useRef(null)
  const containerRef = useRef(null)
  const drag = useRef({ down: false, startX: 0, deltaX: 0 })
  const count = items.length

  // Auto-advance every 5s with pause on hover/drag
  const pausedRef = useRef(false)
  const timerRef = useRef(null)
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  const startTimer = () => {
    clearTimer()
    if (!pausedRef.current) {
      timerRef.current = setInterval(() => { setIndex((i) => (i + 1) % count) }, 5000)
    }
  }
  useEffect(() => {
    startTimer()
    return () => clearTimer()
  }, [count])

  const goTo = (i) => setIndex(((i % count) + count) % count)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  // Swipe/drag
  const onStart = (x) => {
    drag.current.down = true
    drag.current.startX = x
    drag.current.deltaX = 0
    // pause while dragging
    pausedRef.current = true
    clearTimer()
  }
  const onMove = (x) => {
    if (!drag.current.down) return
    drag.current.deltaX = x - drag.current.startX
    const el = trackRef.current
    if (!el) return
    const pct = (-index * 100) + (-drag.current.deltaX / (containerRef.current?.clientWidth || 1)) * 100
    el.style.transition = 'none'
    el.style.transform = `translateX(${pct}%)`
  }
  const onEnd = () => {
    if (!drag.current.down) return
    const threshold = (containerRef.current?.clientWidth || 1) * 0.15
    if (drag.current.deltaX > threshold) prev()
    else if (drag.current.deltaX < -threshold) next()
    // restore transition
    const el = trackRef.current
    if (el) {
      el.style.transition = ''
    }
    drag.current.down = false
    drag.current.deltaX = 0
    // resume after a short delay
    pausedRef.current = false
    setTimeout(() => startTimer(), 600)
  }

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="testimonials-title">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="testimonials-title" className="text-2xl sm:text-3xl font-bold text-gray-900">What people say?</h2>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">Short, real, and to the point</p>
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
          onMouseEnter={() => { pausedRef.current = true; clearTimer() }}
          onMouseLeave={() => { onEnd(); pausedRef.current = false; startTimer() }}
        >
          {/* Arrow controls */}
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2 hover:bg-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-700"><path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border border-gray-200 shadow p-2 hover:bg-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-700"><path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414l-5.293 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
          {/* Track */}
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((t, idx) => (
              <div key={idx} className="w-full shrink-0 px-1">
                <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 md:p-10 text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {t.avatar ? (
                      <img src={t.avatar} alt={`${t.name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">{(t.name || '?').slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="mt-5">
                    <p className="text-lg sm:text-xl leading-relaxed text-gray-900 italic">
                      “{t.quote}”
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <div className="h-px w-24 bg-gray-200" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{t.name}</span>
                    <span className="text-gray-400"> | </span>
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
                className={`h-2.5 w-2.5 rounded-full transition-all ${i === index ? 'bg-gray-800' : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

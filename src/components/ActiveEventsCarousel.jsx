import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { eventsAPI } from '../services/api'
import { format } from 'date-fns'
import placeholderImg from '../../assets/doodle.png'

function useImageSrc(cardImage, apiBase) {
  return useMemo(() => {
    if (!cardImage) return null
    if (/^https?:\/\//i.test(cardImage)) return cardImage
    if (cardImage.startsWith('/static/')) {
      try {
        const url = new URL(apiBase, window.location.origin)
        const origin = `${url.protocol}//${url.host}`
        return `${origin}${cardImage}`
      } catch {
        return cardImage
      }
    }
    return cardImage
  }, [cardImage, apiBase])
}

function SmallEventCard({ event }) {
  const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1'
  const [imgError, setImgError] = useState(false)
  const cardImage = (!imgError && (event?.thumbnail || event?.image)) || event?.image || event?.thumbnail || placeholderImg
  const imageSrc = useImageSrc(cardImage, apiBase)
  const dateLabel = useMemo(() => {
    try {
      const dt = new Date(event.event_start)
      return `${format(dt, 'EEE, MMM d')} · ${format(dt, 'p')}`
    } catch {
      return ''
    }
  }, [event.event_start])

  return (
    <Link 
      to="/events" 
      state={{ highlightEventId: event.id }}
      className="snap-start shrink-0 w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden block"
    >
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              setImgError(true)
              try { e.currentTarget.src = placeholderImg } catch {}
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">{event.title}</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{dateLabel}</div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{event.location}</div>
      </div>
    </Link>
  )
}

export default function ActiveEventsCarousel({ className = '' }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const scrollerRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  // Drag/Swipe state
  const dragState = useRef({ isDown: false, startX: 0, startLeft: 0, velocity: 0, lastX: 0, lastTime: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const assessScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 0)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        // Fetch next upcoming events; backend hides past by default
        const data = await eventsAPI.getAll({ limit: 10, include_past: false })
        // Sort ascending by start time for a "next up" feel
        const sorted = [...data].sort((a, b) => new Date(a.event_start) - new Date(b.event_start))
        setEvents(sorted)
      } catch (e) {
        setError('Failed to load events')
      } finally {
        setLoading(false)
        // assess after a tick so layout is ready
        setTimeout(assessScroll, 0)
      }
    }
    load()
  }, [assessScroll])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => assessScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    assessScroll()
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [assessScroll])

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const delta = Math.round(el.clientWidth * 0.85) * (dir === 'next' ? 1 : -1)
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  // Pointer/Touch handlers for swipe
  const onPointerDown = (e) => {
    const el = scrollerRef.current
    if (!el) return
    dragState.current.isDown = true
    setIsDragging(true)
    dragState.current.startX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0)
    dragState.current.startLeft = el.scrollLeft
    dragState.current.lastX = dragState.current.startX
    dragState.current.lastTime = performance.now()
    dragState.current.velocity = 0
  }

  const onPointerMove = (e) => {
    const el = scrollerRef.current
    if (!el || !dragState.current.isDown) return
    const x = e.clientX ?? (e.touches ? e.touches[0].clientX : 0)
    const dx = x - dragState.current.startX
    el.scrollLeft = dragState.current.startLeft - dx
    // velocity tracking
    const now = performance.now()
    const dt = now - dragState.current.lastTime
    if (dt > 0) {
      dragState.current.velocity = (x - dragState.current.lastX) / dt
      dragState.current.lastX = x
      dragState.current.lastTime = now
    }
    assessScroll()
  }

  const onPointerUp = () => {
    const el = scrollerRef.current
    if (!el) return
    dragState.current.isDown = false
    setIsDragging(false)
    // Snap to next/prev card if swipe was quick enough
    const v = dragState.current.velocity
    if (Math.abs(v) > 0.5) {
      scrollByAmount(v < 0 ? 'next' : 'prev')
    }
    assessScroll()
  }

  return (
    <section className={`w-full ${className}`} aria-label="Active events carousel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title with playful vibe */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white -rotate-1 inline-block">
            What's Happening <span className="text-primary-600 dark:text-primary-400 underline decoration-wavy">Noww</span>?
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Buttons */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount('prev')}
            disabled={!canPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md p-2 transition-opacity ${canPrev ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-700 dark:text-gray-300"><path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount('next')}
            disabled={!canNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md p-2 transition-opacity ${canNext ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-700 dark:text-gray-300"><path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414l-5.293 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>

          <div
            ref={scrollerRef}
            className={`overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pr-2 pl-10 sm:pl-12 lg:pl-12 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseLeave={onPointerUp}
            onMouseUp={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            <div className="flex gap-4 sm:gap-5 lg:gap-6 py-2">
              {loading && (
                <div className="text-gray-500 dark:text-gray-400 text-sm py-6">Loading events…</div>
              )}
              {error && !loading && (
                <div className="text-red-600 dark:text-red-400 text-sm py-6">{error}</div>
              )}
              {!loading && !error && events.length === 0 && (
                <div className="text-gray-600 dark:text-gray-400 text-sm py-6">No upcoming events</div>
              )}
              {!loading && !error && events.map(ev => (
                <SmallEventCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

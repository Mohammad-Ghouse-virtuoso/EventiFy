import heroImage from '../../assets/EventiFy Hero Card.jpg'
// Then use: illustrationSrc={heroImage}import React from 'react'

/**
 * EventifyHeroCard
 *
 * A clean, minimal, and slightly playful full-width hero banner.
 * - Large bold tagline
 * - Primary CTA ("Get Started")
 * - Illustration placeholder (right on desktop, stacked on mobile)
 *
 * Rollback: Safe to remove; this file is standalone and not wired anywhere yet.
 */
export default function EventifyHeroCard({
  headline = 'Find Your Next Event. Connect. RSVP. Go!',
  subtext = 'Discover experiences around you and meet great people along the way.',
  ctaText = 'Browse Events',
  secondaryCtaText = 'Create Your Own',
  onGetStarted,
  onCreateEvent,
  illustrationAlt = 'Colorful illustration placeholder representing events and community',
  illustrationSrc,
  illustrationType = 'image', // 'image', 'gif', or 'video'
  videoAutoPlay = true,
  videoLoop = true,
  videoMuted = true,
  className = '',
}) {
  // Determine if the source is a video based on file extension or explicit type
  const isVideo = illustrationType === 'video' || 
    (illustrationSrc && (
      illustrationSrc.endsWith('.mp4') || 
      illustrationSrc.endsWith('.webm') || 
      illustrationSrc.endsWith('.mov')
    ))
  
  const isGif = illustrationType === 'gif' || 
    (illustrationSrc && illustrationSrc.endsWith('.gif'))

  return (
    <section
      className={`w-full bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden ${className}`}
      aria-label="EventiFy hero banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12 sm:py-16">
          {/* Left: Headline + CTA */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-gray-800/70 ring-1 ring-primary-100 dark:ring-primary-800 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-400 mb-4">
              EventiFy
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {headline}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0">
              {subtext}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 justify-center lg:justify-start">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {ctaText}
              </button>
              {onCreateEvent && (
                <button
                  type="button"
                  onClick={onCreateEvent}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {secondaryCtaText}
                </button>
              )}
            </div>
          </div>

          {/* Right: Illustration/Media placeholder */}
          <div className="order-1 lg:order-2">
            {illustrationSrc ? (
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/10] xl:aspect-[16/9] max-h-[420px] rounded-xl overflow-hidden border border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-800 shadow-sm">
                {isVideo ? (
                  <video
                    src={illustrationSrc}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay={videoAutoPlay}
                    loop={videoLoop}
                    muted={videoMuted}
                    playsInline
                    aria-label={illustrationAlt}
                  />
                ) : (
                  <img
                    src={illustrationSrc}
                    alt={illustrationAlt}
                    className={`absolute inset-0 w-full h-full ${
                      isGif ? 'object-cover' : 'object-contain p-3 sm:p-4'
                    }`}
                    loading="eager"
                    decoding="async"
                  />
                )}
                {/* subtle accent */}
                <div className="pointer-events-none absolute -z-0 -right-6 -top-6 h-24 w-24 rounded-full bg-primary-200/40 dark:bg-primary-800/40 blur-2xl" aria-hidden="true" />
              </div>
            ) : (
              <div
                role="img"
                aria-label={illustrationAlt}
                className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/10] xl:aspect-[16/9] max-h-[420px] bg-primary-100/70 dark:bg-gray-800/70 rounded-xl border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-400"
              >
                <div className="pointer-events-none select-none text-sm sm:text-base font-medium opacity-80">
                  Illustration Placeholder
                </div>
                {/* playful accent */}
                <div className="absolute -z-0 -right-6 -top-6 h-24 w-24 rounded-full bg-primary-200/50 blur-2xl" aria-hidden="true" />
                <div className="absolute -z-0 -left-6 -bottom-6 h-20 w-20 rounded-full bg-primary-300/40 blur-2xl" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

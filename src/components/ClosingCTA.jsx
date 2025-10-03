import heroImage from '../../assets/EventiFy Hero Card.jpg'
// Then use: illustrationSrc={heroImage}import React from 'react'

/**
 * ClosingCTA
 * Full-width, high-contrast call-to-action section for the landing page.
 * - Prominent title and supporting text
 * - Large playful doodle/illustration placeholder
 * - Strong primary CTA button: "Sign Up Now"
 * - Playful gradient background, clean modern aesthetic
 */
export default function ClosingCTA({ className = '', onSignUp }) {
  let doodle
  try {
    doodle = new URL('../../assets/Playful_doodle for CTA.png', import.meta.url).href
  } catch (_) {}
  return (
    <section className={`w-full py-16 sm:py-20 ${className}`} aria-labelledby="closing-cta-title">
      <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center py-10">
            {/* Copy */}
            <div>
              <h2 id="closing-cta-title" className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Ready to Find Your Community?
              </h2>
              <p className="mt-3 text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-prose">
                The fun starts now. Discover meetups, RSVP in one tap, and connect with people who share your vibe.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onSignUp}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 transition"
                >
                  Sign Up Now
                </button>
              </div>
            </div>

            {/* Doodle / illustration placeholder */}
            <div className="relative animate-float-soft">
              <div
                className="w-full h-56 sm:h-64 md:h-72 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden"
                aria-label="Playful doodle"
              >
                {doodle ? (
                  <img src={doodle} alt="Playful doodle" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 font-medium">Playful_doodle</span>
                )}
              </div>
              {/* Confetti-like accents */}
              <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-pink-300/70 dark:bg-pink-600/50 blur-[1px]" aria-hidden="true" />
              <div className="absolute -bottom-4 -left-2 h-8 w-8 rounded-full bg-amber-300/70 dark:bg-amber-600/50 blur-[1px]" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

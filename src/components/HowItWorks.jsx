import React from 'react'

/**
 * HowItWorks
 *
 * Three concise steps with a clean, modern layout.
 * - Each step has a styled placeholder for a doodle/icon
 * - Bold step title
 * - Playful, scannable description
 *
 * Responsive: stacks on mobile, 3 columns on md+ screens.
 */
export default function HowItWorks({ className = '' }) {
  let createIcon, connectIcon, rsvpIcon
  try {
    createIcon = new URL('../../assets/create.png', import.meta.url).href
    connectIcon = new URL('../../assets/Connect.png', import.meta.url).href
    rsvpIcon = new URL('../../assets/RSVP.png', import.meta.url).href
  } catch (_) {
    // Non-Vite contexts will fallback to placeholders
  }

  const steps = [
    {
      title: 'Create Your Event',
      desc: 'Like posting a story.',
      icon: createIcon,
      alt: 'Create event doodle',
    },
    {
      title: 'Host & Connect',
      desc: 'Like Zoom, but for real meetups.',
      icon: connectIcon,
      alt: 'Host and connect doodle',
    },
    {
      title: 'RSVP & Go',
      desc: 'One tap, you’re in.',
      icon: rsvpIcon,
      alt: 'RSVP doodle',
    },
  ]

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="hiw-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="hiw-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            How it works?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">Fast to learn, even faster to use</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 hover:shadow-md transition-shadow">
              {/* Doodle/Icon */}
              <div className="mb-4 flex items-center">
                <div
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 flex items-center justify-center mr-3 overflow-hidden"
                  role="img"
                  aria-label={s.alt || `${s.title} icon`}
                >
                  {s.icon ? (
                    <img src={s.icon} alt={s.alt || `${s.title} icon`} className="max-h-8 max-w-8 object-contain" loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-6 w-6 rounded-md bg-gray-200 dark:bg-gray-600" />
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{s.title}</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

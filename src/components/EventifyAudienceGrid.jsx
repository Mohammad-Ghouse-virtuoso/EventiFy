import React from 'react'

/**
 * EventifyAudienceGrid
 *
 * Displays six vertically stacked cards in a responsive grid, each with:
 * - A themed icon placeholder (consistent color palette)
 * - Bold event type title
 * - Short playful one-liner
 *
 * Rollback: standalone component, safe to remove at any time.
 */
export default function EventifyAudienceGrid({
  title = 'Who is EventiFy for?',
  items,
  className = '',
}) {
  // Local icons from assets
  // Using Vite imports for hashed asset URLs
  // Note: these are optional; consumers can still pass their own items with custom icons
  let iconMic, iconPeople, iconFood, iconFitness, iconArt, iconTech
  try {
    iconMic = new URL('../../assets/micro_icon.png', import.meta.url).href
    iconPeople = new URL('../../assets/people_icon.png', import.meta.url).href
    iconFood = new URL('../../assets/refreshments_icon.png', import.meta.url).href
    iconFitness = new URL('../../assets/fitness_icon.png', import.meta.url).href
    iconArt = new URL('../../assets/Art_icon.png', import.meta.url).href
    iconTech = new URL('../../assets/tech_icon.png', import.meta.url).href
  } catch (_) {
    // If running in a non-Vite context, ignore; placeholders will appear
  }
  // Small, defined color palette (Tailwind default colors)
  const palette = ['emerald', 'sky', 'violet', 'amber', 'rose', 'cyan']

  const defaults = [
    { label: 'Karaoke Nights', desc: 'Sing your heart out or cheer on a star.', color: palette[0], icon: iconMic, alt: 'Microphone icon' },
    { label: 'Startup Founders', desc: 'Pitch, network, and find your next collab.', color: palette[2], icon: iconPeople, alt: 'People/networking icon' },
    { label: 'Foodies & Pop-Ups', desc: 'Tastings, trucks, and limited-time menus.', color: palette[3], icon: iconFood, alt: 'Refreshments icon' },
    { label: 'Fitness & Wellness', desc: 'Group runs, yoga mornings, mindful meetups.', color: palette[1], icon: iconFitness, alt: 'Fitness icon' },
    { label: 'Art & Makers', desc: 'Gallery crawls and hands-on workshops.', color: palette[4], icon: iconArt, alt: 'Art icon' },
    { label: 'Tech Meetups', desc: 'Talks, code labs, and coffee-fueled ideas.', color: palette[5], icon: iconTech, alt: 'Tech icon' },
  ]

  const data = items && items.length ? items : defaults

  const COLOR_MAP = {
    emerald: {
      wrapper: 'bg-emerald-50 border-emerald-100',
      dot: 'bg-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    sky: {
      wrapper: 'bg-sky-50 border-sky-100',
      dot: 'bg-sky-200',
      icon: 'bg-sky-100 text-sky-700 border-sky-200',
    },
    violet: {
      wrapper: 'bg-violet-50 border-violet-100',
      dot: 'bg-violet-200',
      icon: 'bg-violet-100 text-violet-700 border-violet-200',
    },
    amber: {
      wrapper: 'bg-amber-50 border-amber-100',
      dot: 'bg-amber-200',
      icon: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    rose: {
      wrapper: 'bg-rose-50 border-rose-100',
      dot: 'bg-rose-200',
      icon: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    cyan: {
      wrapper: 'bg-cyan-50 border-cyan-100',
      dot: 'bg-cyan-200',
      icon: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  }

  const colorClasses = (c) => COLOR_MAP[c] || COLOR_MAP['emerald']

  return (
    <section className={`w-full py-14 sm:py-16 ${className}`} aria-labelledby="audience-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 id="audience-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base">A little slice of who shows up and has fun</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {data.map((item, idx) => {
            const c = colorClasses(item.color || palette[idx % palette.length])
            return (
              <div
                key={idx}
                className={`relative rounded-xl border ${c.wrapper} dark:bg-gray-800 dark:border-gray-700 p-5 sm:p-6 hover:shadow-md transition-shadow bg-white`}
              >
                {/* playful corner dot */}
                <div className={`absolute -top-2 -right-2 h-5 w-5 rounded-full ${c.dot} opacity-60`} aria-hidden="true" />

                <div className="flex flex-col items-start text-left">
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-2xl border ${c.icon} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 flex items-center justify-center mb-4 overflow-hidden`}
                       role="img" aria-label={`${item.label} icon`}>
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.alt || `${item.label} icon`}
                        className="max-h-8 max-w-8 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-xs font-semibold opacity-70">ICON</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

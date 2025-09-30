import React from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

/**
 * TrustedPartnersSection
 * Static, responsive grid of partner/organizer logos placed after the Hero.
 * - Title with subtle separator
 * - 6–8 grayscale logos from local assets with gentle hover accent
 * - No carousel or swipe; fixed grid
 */
export default function TrustedPartnersSection({ className = '', titleVariant = 'organizers' }) {
  const title = titleVariant === 'partners'
    ? 'FEATURED EVENT PARTNERS'
    : 'ORGANIZERS THAT TRUST US'

  // Resolve asset URLs robustly (spaces and special characters supported by new URL)
  const safeUrl = (relPath) => {
    try {
      return new URL(relPath, import.meta.url).href
    } catch {
      return null
    }
  }

  // Local representative images from assets
  const items = [
    { name: 'Drink & Clap', src: safeUrl('../../assets/Drink_clap_updated.png') },
    { name: 'University', src: safeUrl('../../assets/University.png') },
    { name: 'Crawlers', src: safeUrl('../../assets/Crawlers_updated.png') },
    { name: 'Art', src: safeUrl('../../assets/Art.png') },
    { name: 'Fitness Club', src: safeUrl('../../assets/Fitness_club.png') },
    { name: 'Counsel', src: safeUrl('../../assets/Counsel.png') },
    { name: 'Photography', src: safeUrl('../../assets/Photography_updated.png') },
    { name: 'Cooking Club', src: safeUrl('../../assets/Cooking_club.png') },
  ].filter(Boolean)

  // Show 8 logos (2 rows × 4 columns)
  const itemsToShow = items.slice(0, 8)

  return (
    <section className={`w-full py-10 sm:py-12 ${className}`} aria-labelledby="trusted-partners-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center">
          <h2 id="trusted-partners-heading" className="text-sm md:text-base tracking-[0.15em] font-semibold text-gray-800 uppercase">
            {title}
          </h2>
          {/* Subtle separator (red line effect) */}
          <div className="mx-auto mt-3 h-[2px] w-24 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400 rounded-full" aria-hidden="true" />
        </div>

        {/* Static Grid */}
  <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {itemsToShow.map((item, idx) => {
            return (
            <div key={idx} className={`flex items-center justify-center rounded-xl bg-transparent p-3 sm:p-4 md:p-5`}>
              {item.src ? (
                <img
                  src={item.src}
                  alt={`${item.name} logo`}
                  className="max-h-20 sm:max-h-24 md:max-h-28 object-contain opacity-95 transition-transform duration-200 will-change-transform hover:opacity-100 hover:-translate-y-0.5 hover:scale-[1.06] hover:saturate-110"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-12 w-full rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center">
                  /static/logos/logo{idx + 1}.png
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

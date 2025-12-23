import React from 'react'

// Direct imports for partner logos
import DrinkClap from '../../assets/Drink_clap_updated.png'
import University from '../../assets/University.png'
import Crawlers from '../../assets/Crawlers_updated.png'
import Art from '../../assets/Art.png'
import FitnessClub from '../../assets/Fitness_club.png'
import Counsel from '../../assets/Counsel.png'
import Photography from '../../assets/Photography_updated.png'
import CookingClub from '../../assets/Cooking_club.png'

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

  // Local representative images from assets
  const items = [
    { name: 'Drink & Clap', src: DrinkClap },
    { name: 'University', src: University },
    { name: 'Crawlers', src: Crawlers },
    { name: 'Art', src: Art },
    { name: 'Fitness Club', src: FitnessClub },
    { name: 'Counsel', src: Counsel },
    { name: 'Photography', src: Photography },
    { name: 'Cooking Club', src: CookingClub },
  ]

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

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
 * Displays partner logos and organizations that trust EventiFy
 */
export default function TrustedPartnersSection({ className = '', titleVariant = 'organizers' }) {
  const title = titleVariant === 'partners'
    ? 'FEATURED EVENT PARTNERS'
    : 'ORGANIZERS THAT TRUST US'

  // Original logos for display
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

        {/* Partner Logos Grid */}
        {items.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <img 
                  src={item.src} 
                  alt={item.name} 
                  className="h-16 sm:h-20 opacity-70 hover:opacity-100 transition-opacity duration-300 group-hover:scale-110" 
                />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center font-medium group-hover:text-gray-900 dark:group-hover:text-gray-200">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

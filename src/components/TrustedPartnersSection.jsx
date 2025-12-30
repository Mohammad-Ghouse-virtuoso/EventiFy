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
 * Displays our branded organizer partners with themed colors and emojis
 * - Remo's Bar (🍉)
 * - Artfolk Gallery (🦋)
 * - Cookingg Collective (🍳)
 * - Giggling University (🎓)
 * - Daytona Racing Club (🏍️)
 */
export default function TrustedPartnersSection({ className = '', titleVariant = 'organizers' }) {
  const title = titleVariant === 'partners'
    ? 'FEATURED EVENT PARTNERS'
    : 'ORGANIZERS THAT TRUST US'

  // Branded organizers with colors and emojis
  const brandedPartners = [
    {
      name: "Remo's Bar",
      emoji: "🍉",
      theme: "Watermelon Nights",
      bgGradient: "from-orange-50 to-red-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-900"
    },
    {
      name: "Artfolk Gallery",
      emoji: "🦋",
      theme: "Butterfly Dreams",
      bgGradient: "from-pink-50 to-purple-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-900"
    },
    {
      name: "Cookingg Collective",
      emoji: "🍳",
      theme: "Pan & Fire",
      bgGradient: "from-yellow-50 to-orange-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-900"
    },
    {
      name: "Giggling University",
      emoji: "🎓",
      theme: "Book & Grad Hat",
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-900"
    },
    {
      name: "Daytona Racing Club",
      emoji: "🏍️",
      theme: "Motorcycle & Racing",
      bgGradient: "from-gray-50 to-slate-50",
      borderColor: "border-gray-300",
      textColor: "text-gray-900"
    },
  ]

  // Original logos as fallback for other items
  const items = [
    { name: 'Drink & Clap', src: DrinkClap },
    { name: 'Crawlers', src: Crawlers },
    { name: 'Counsel', src: Counsel },
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

        {/* Branded Partners Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {brandedPartners.map((partner, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${partner.bgGradient} ${partner.borderColor} border rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-200`}
            >
              <div className="text-4xl mb-3">{partner.emoji}</div>
              <p className={`font-semibold text-sm ${partner.textColor} mb-1`}>{partner.name}</p>
              <p className={`text-xs ${partner.textColor} opacity-75`}>{partner.theme}</p>
            </div>
          ))}
        </div>

        {/* Spacing and additional logos if needed */}
        {items.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-6">Other Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {items.map((item, idx) => (
                <img key={idx} src={item.src} alt={item.name} className="h-12 opacity-60 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

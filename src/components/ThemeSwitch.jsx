import { useState, useEffect } from 'react'

/**
 * ThemeSwitch - Dark/Light mode toggle
 * Pure React + Tailwind implementation with animated moon/sun, stars, and clouds
 * Applies actual dark mode to the entire application
 * Uses CSS ::before for proper crescent effect
 */
export default function ThemeSwitch({ defaultDark = false, onChange }) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return defaultDark
  })

  useEffect(() => {
    // Apply theme to document root
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    onChange?.(isDark)
  }, [isDark, onChange])

  const handleToggle = () => {
    setIsDark(!isDark)
  }

  return (
    <div className="relative inline-block">
      <style>{`
        /* Theme switch slider with moon/sun effect */
        .theme-slider::before {
          content: "";
          position: absolute;
          height: 1.2em;
          width: 1.2em;
          border-radius: 20px;
          left: 0.5em;
          bottom: 0.5em;
          transition: 0.4s;
          transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
          box-shadow: inset 8px -4px 0px 0px #fff;
        }
        
        .theme-switch:checked + .theme-slider::before {
          transform: translateX(1.8em);
          box-shadow: inset 15px -4px 0px 15px #ffcf48;
        }
      `}</style>

      {/* Hidden checkbox */}
      <input
        type="checkbox"
        id="theme-switch"
        checked={!isDark}
        onChange={handleToggle}
        className="theme-switch sr-only"
      />

      {/* Label wrapper - clickable area */}
      <label
        htmlFor="theme-switch"
        className={`theme-slider relative flex h-[2.2em] w-[4em] cursor-pointer items-center rounded-[30px] shadow-md overflow-hidden transition-colors duration-400 text-[17px] ${
          isDark ? 'bg-[#2a2a2a]' : 'bg-[#00a6ff]'
        }`}
      >
        {/* Stars - visible in dark mode */}
        <span
          className={`absolute left-[2.5em] top-[0.5em] h-[5px] w-[5px] rounded-full bg-white transition-opacity duration-400 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <span
          className={`absolute left-[2.2em] top-[1.2em] h-[5px] w-[5px] rounded-full bg-white transition-opacity duration-400 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <span
          className={`absolute left-[3em] top-[0.9em] h-[5px] w-[5px] rounded-full bg-white transition-opacity duration-400 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Clouds - visible in light mode */}
        <span
          className={`absolute w-[3.5em] bottom-[-1.4em] left-[-1.1em] transition-opacity duration-400 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <svg viewBox="0 0 16 16" className="cloud">
            <path
              transform="matrix(.77976 0 0 .78395-299.99-418.63)"
              fill="#fff"
              d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
            />
          </svg>
        </span>
      </label>
    </div>
  )
}

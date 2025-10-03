import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventifyHeroCard from '../EventifyHeroCard'

describe('EventifyHeroCard', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<EventifyHeroCard />)
      
      expect(screen.getByRole('region', { name: /eventify hero banner/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /find your next event/i })).toBeInTheDocument()
      expect(screen.getByText(/discover experiences around you/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })

    it('renders with custom headline and subtext', () => {
      const customHeadline = 'Custom Event Headline'
      const customSubtext = 'Custom event description here'
      
      render(
        <EventifyHeroCard 
          headline={customHeadline} 
          subtext={customSubtext} 
        />
      )
      
      expect(screen.getByRole('heading', { name: customHeadline })).toBeInTheDocument()
      expect(screen.getByText(customSubtext)).toBeInTheDocument()
    })

    it('renders with custom CTA text', () => {
      const customCTA = 'Explore Events'
      
      render(<EventifyHeroCard ctaText={customCTA} />)
      
      expect(screen.getByRole('button', { name: customCTA })).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const customClass = 'custom-hero-class'
      
      const { container } = render(<EventifyHeroCard className={customClass} />)
      
      expect(container.querySelector('section')).toHaveClass(customClass)
    })

    it('renders placeholder when no illustration source provided', () => {
      render(<EventifyHeroCard />)
      
      expect(screen.getByText(/illustration placeholder/i)).toBeInTheDocument()
    })
  })

  describe('Image Rendering', () => {
    it('renders image when illustrationSrc is provided', () => {
      const imageSrc = '/test-image.png'
      const altText = 'Test hero image'
      
      render(
        <EventifyHeroCard 
          illustrationSrc={imageSrc} 
          illustrationAlt={altText} 
        />
      )
      
      const image = screen.getByAltText(altText)
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', imageSrc)
      expect(image).toHaveClass('object-contain')
    })

    it('renders image with correct loading attributes', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/test.jpg" 
          illustrationAlt="Test" 
        />
      )
      
      const image = screen.getByAltText('Test')
      expect(image).toHaveAttribute('loading', 'eager')
      expect(image).toHaveAttribute('decoding', 'async')
    })
  })

  describe('GIF Rendering', () => {
    it('auto-detects GIF from .gif extension', () => {
      const gifSrc = '/animation.gif'
      
      render(
        <EventifyHeroCard 
          illustrationSrc={gifSrc} 
          illustrationAlt="Animated GIF" 
        />
      )
      
      const image = screen.getByAltText('Animated GIF')
      expect(image).toHaveClass('object-cover')
      expect(image).not.toHaveClass('object-contain')
    })

    it('respects explicit illustrationType="gif"', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/media.png" 
          illustrationType="gif"
          illustrationAlt="Forced GIF" 
        />
      )
      
      const image = screen.getByAltText('Forced GIF')
      expect(image).toHaveClass('object-cover')
    })
  })

  describe('Video Rendering', () => {
    it('renders video for .mp4 files', () => {
      const videoSrc = '/hero.mp4'
      
      render(
        <EventifyHeroCard 
          illustrationSrc={videoSrc} 
          illustrationAlt="Hero video" 
        />
      )
      
      const video = screen.getByLabelText('Hero video')
      expect(video.tagName).toBe('VIDEO')
      expect(video).toHaveAttribute('src', videoSrc)
    })

    it('renders video for .webm files', () => {
      const videoSrc = '/hero.webm'
      
      render(
        <EventifyHeroCard 
          illustrationSrc={videoSrc} 
          illustrationAlt="WebM video" 
        />
      )
      
      const video = screen.getByLabelText('WebM video')
      expect(video.tagName).toBe('VIDEO')
    })

    it('renders video for .mov files', () => {
      const videoSrc = '/hero.mov'
      
      render(
        <EventifyHeroCard 
          illustrationSrc={videoSrc} 
          illustrationAlt="MOV video" 
        />
      )
      
      const video = screen.getByLabelText('MOV video')
      expect(video.tagName).toBe('VIDEO')
    })

    it('respects explicit illustrationType="video"', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/media.png" 
          illustrationType="video"
          illustrationAlt="Forced video" 
        />
      )
      
      const video = screen.getByLabelText('Forced video')
      expect(video.tagName).toBe('VIDEO')
    })

    it('sets video attributes correctly with defaults', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/video.mp4" 
          illustrationAlt="Video test" 
        />
      )
      
      const video = screen.getByLabelText('Video test')
      expect(video).toHaveAttribute('autoplay')
      expect(video).toHaveAttribute('loop')
      expect(video).toHaveProperty('muted', true)
      expect(video).toHaveAttribute('playsinline')
    })

    it('respects custom video props', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/video.mp4" 
          illustrationAlt="Custom video"
          videoAutoPlay={false}
          videoLoop={false}
          videoMuted={false}
        />
      )
      
      const video = screen.getByLabelText('Custom video')
      expect(video).not.toHaveAttribute('autoplay')
      expect(video).not.toHaveAttribute('loop')
      expect(video).not.toHaveAttribute('muted')
    })

    it('applies correct video styling', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="/video.mp4" 
          illustrationAlt="Styled video" 
        />
      )
      
      const video = screen.getByLabelText('Styled video')
      expect(video).toHaveClass('object-cover')
      expect(video).toHaveClass('absolute', 'inset-0', 'w-full', 'h-full')
    })
  })

  describe('Interactions', () => {
    it('calls onGetStarted when CTA button is clicked', async () => {
      const user = userEvent.setup()
      const handleGetStarted = vi.fn()
      
      render(<EventifyHeroCard onGetStarted={handleGetStarted} />)
      
      const button = screen.getByRole('button', { name: /get started/i })
      await user.click(button)
      
      expect(handleGetStarted).toHaveBeenCalledTimes(1)
    })

    it('does not throw error if onGetStarted is not provided', async () => {
      const user = userEvent.setup()
      
      render(<EventifyHeroCard />)
      
      const button = screen.getByRole('button', { name: /get started/i })
      
      // Should not throw
      await expect(user.click(button)).resolves.not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA label on section', () => {
      render(<EventifyHeroCard />)
      
      const section = screen.getByRole('region')
      expect(section).toHaveAttribute('aria-label', 'EventiFy hero banner')
    })

    it('has proper heading hierarchy', () => {
      render(<EventifyHeroCard />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('has accessible button', () => {
      render(<EventifyHeroCard />)
      
      const button = screen.getByRole('button', { name: /get started/i })
      expect(button).toHaveAttribute('type', 'button')
    })

    it('provides alt text for images', () => {
      const altText = 'Custom alt text'
      
      render(
        <EventifyHeroCard 
          illustrationSrc="/test.jpg" 
          illustrationAlt={altText} 
        />
      )
      
      expect(screen.getByAltText(altText)).toBeInTheDocument()
    })

    it('provides aria-label for videos', () => {
      const ariaLabel = 'Video description'
      
      render(
        <EventifyHeroCard 
          illustrationSrc="/video.mp4" 
          illustrationAlt={ariaLabel} 
        />
      )
      
      expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument()
    })

    it('marks decorative elements with aria-hidden', () => {
      const { container } = render(<EventifyHeroCard />)
      
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]')
      expect(decorativeElements.length).toBeGreaterThan(0)
    })

    it('has proper role for placeholder', () => {
      render(<EventifyHeroCard />)
      
      const placeholder = screen.getByRole('img')
      expect(placeholder).toHaveAttribute('aria-label')
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive text classes', () => {
      render(<EventifyHeroCard />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-4xl', 'sm:text-5xl')
    })

    it('applies responsive padding classes', () => {
      const { container } = render(<EventifyHeroCard />)
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('py-12', 'sm:py-16')
    })

    it('applies responsive grid layout', () => {
      const { container } = render(<EventifyHeroCard />)
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes', () => {
      const { container } = render(<EventifyHeroCard />)
      
      const section = container.querySelector('section')
      expect(section.className).toContain('dark:')
    })

    it('applies dark mode text colors', () => {
      render(<EventifyHeroCard />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('dark:text-white')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty strings gracefully', () => {
      render(
        <EventifyHeroCard 
          headline="" 
          subtext="" 
          ctaText="" 
        />
      )
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles very long text content', () => {
      const longText = 'A'.repeat(500)
      
      render(<EventifyHeroCard headline={longText} />)
      
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('handles special characters in text', () => {
      const specialText = '<script>alert("XSS")</script> & "quotes" \'single\''
      
      render(<EventifyHeroCard headline={specialText} />)
      
      // Text should be escaped and rendered as text, not HTML
      expect(screen.getByText(specialText)).toBeInTheDocument()
    })

    it('handles invalid image source', () => {
      render(
        <EventifyHeroCard 
          illustrationSrc="invalid-url" 
          illustrationAlt="Invalid" 
        />
      )
      
      const image = screen.getByAltText('Invalid')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'invalid-url')
    })
  })
})

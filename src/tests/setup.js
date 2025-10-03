import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock asset imports (images, videos, etc.)
vi.mock('*.jpg', () => ({ default: 'mocked-image.jpg' }))
vi.mock('*.png', () => ({ default: 'mocked-image.png' }))
vi.mock('*.gif', () => ({ default: 'mocked-image.gif' }))
vi.mock('*.mp4', () => ({ default: 'mocked-video.mp4' }))
vi.mock('*.webm', () => ({ default: 'mocked-video.webm' }))
vi.mock('*.svg', () => ({ default: 'mocked-image.svg' }))

// Cleanup after each test
afterEach(() => {
  cleanup()
})

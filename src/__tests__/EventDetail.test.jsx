import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EventDetail from '../pages/EventDetail'

// Shared mocks
let mockUser = null
const mockEventsAPI = {
  getById: vi.fn(),
  getRSVPs: vi.fn(),
  rsvp: vi.fn()
}
const mockBookmarkAPI = {
  isBookmarked: vi.fn(),
  bookmark: vi.fn(),
  unbookmark: vi.fn()
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}))

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn()
  })
}))

vi.mock('../services/api', () => ({
  eventsAPI: mockEventsAPI,
  bookmarkAPI: mockBookmarkAPI
}))

// Simplify heavy child components
vi.mock('../components/event-detail/ActionBar', () => ({
  default: () => <div data-testid="action-bar">ActionBar</div>
}))
vi.mock('../components/event-detail/EventEssentials', () => ({
  default: () => <div data-testid="essentials" />
}))
vi.mock('../components/event-detail/OrganizerCard', () => ({
  default: () => <div data-testid="organizer-card" />
}))
vi.mock('../components/event-detail/EventDescription', () => ({
  default: () => <div data-testid="description" />
}))
vi.mock('../components/event-detail/TermsSection', () => ({
  default: () => <div data-testid="terms" />
}))
vi.mock('../components/event-detail/QASection', () => ({
  default: () => <div data-testid="qa" />
}))
vi.mock('../components/ShareButtons', () => ({
  default: () => <div data-testid="share-buttons" />
}))

const baseEvent = {
  id: '1',
  title: 'Organizer Event',
  organizer_id: 1,
  event_start: '2025-01-01T10:00:00Z',
  event_end: null
}

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={[`/events/${baseEvent.id}`]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockEventsAPI.getById.mockResolvedValue(baseEvent)
  mockEventsAPI.getRSVPs.mockResolvedValue([])
  mockEventsAPI.rsvp.mockResolvedValue({ status: 'going' })
  mockBookmarkAPI.isBookmarked.mockResolvedValue(false)
  mockBookmarkAPI.bookmark.mockResolvedValue({})
  mockBookmarkAPI.unbookmark.mockResolvedValue({})
  mockUser = null
  vi.clearAllMocks()
})

describe('EventDetail organizer/admin view', () => {
  it('shows edit banner and hides action bar for organizer', async () => {
    mockUser = { id: 1, role: 'organizer' }

    renderWithRouter()

    await waitFor(() => expect(mockEventsAPI.getById).toHaveBeenCalled())

    expect(screen.getByRole('button', { name: /edit event/i })).toBeInTheDocument()
    expect(screen.getByText(/You created this event/i)).toBeInTheDocument()
    expect(screen.queryByTestId('action-bar')).toBeNull()
  })

  it('shows action bar for non-organizer and no edit banner', async () => {
    mockUser = { id: 5, role: 'attendee' }

    renderWithRouter()

    await waitFor(() => expect(mockEventsAPI.getById).toHaveBeenCalled())

    expect(screen.getByTestId('action-bar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit event/i })).toBeNull()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Events from '../pages/Events'

let mockUser = null

const mockEventsAPI = vi.hoisted(() => ({
  getAll: vi.fn()
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}))

// Bypass debounce to return raw value
vi.mock('../hooks/useDebounce', () => ({
  default: (val) => val
}))

// Light stub for heavy components
vi.mock('../components/VirtualizedEventsGrid', () => ({
  default: ({ events }) => <div data-testid="virtual-grid">{events.length} events</div>
}))

vi.mock('../components/EventCard', () => ({
  default: ({ event }) => <div data-testid={`event-card-${event.id}`}>{event.title}</div>
}))

vi.mock('../services/api', () => ({
  eventsAPI: mockEventsAPI
}))

const makePastEvent = (id, title, daysAgo, location, category, organizer_id) => {
  const end = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const start = new Date(end.getTime() - 2 * 60 * 60 * 1000)
  return {
    id,
    title,
    organizer_id,
    event_start: start.toISOString(),
    event_end: end.toISOString(),
    location,
    category
  }
}

const pastEvents = [
  makePastEvent(101, 'Newer Past Event', 2, 'Paris', 'art', 1),
  makePastEvent(102, 'Older Past Event', 7, 'NYC', 'music', 2)
]

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/events"]}>
      <Routes>
        <Route path="/events" element={<Events />} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  mockUser = null
  mockEventsAPI.getAll.mockReset()
  mockEventsAPI.getAll.mockImplementation((params = {}) => {
    if (params.include_past) {
      return Promise.resolve(pastEvents)
    }
    return Promise.resolve([])
  })
})

describe('Events page past events section', () => {
  it('loads past events and renders newest first', async () => {
    renderPage()

    await waitFor(() => expect(mockEventsAPI.getAll).toHaveBeenCalled())

    const pastHeading = await screen.findByText(/Past Events/i)
    expect(pastHeading).toBeInTheDocument()

    const cards = await screen.findAllByRole('heading', { level: 3 })
    expect(cards[0]).toHaveTextContent('Newer Past Event')
    expect(cards[1]).toHaveTextContent('Older Past Event')
  })
})

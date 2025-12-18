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

const pastEvents = [
  {
    id: 101,
    title: 'Newer Past Event',
    organizer_id: 1,
    event_start: '2024-02-02T10:00:00Z',
    event_end: '2024-02-02T12:00:00Z',
    location: 'Paris',
    category: 'art'
  },
  {
    id: 102,
    title: 'Older Past Event',
    organizer_id: 2,
    event_start: '2023-01-01T10:00:00Z',
    event_end: '2023-01-01T12:00:00Z',
    location: 'NYC',
    category: 'music'
  }
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

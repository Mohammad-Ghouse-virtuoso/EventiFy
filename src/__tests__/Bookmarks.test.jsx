import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Bookmarks from '../pages/Bookmarks'

let mockUser = null
const mockBookmarkAPI = {
  getMyBookmarks: vi.fn(),
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
  bookmarkAPI: mockBookmarkAPI
}))

describe('Bookmarks page', () => {
  beforeEach(() => {
    mockUser = { id: 1, role: 'attendee' }
    mockBookmarkAPI.getMyBookmarks.mockReset()
    mockBookmarkAPI.unbookmark.mockReset()
  })

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={["/bookmarks"]}>
        <Routes>
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Routes>
      </MemoryRouter>
    )

  it('shows empty state when no bookmarks', async () => {
    mockBookmarkAPI.getMyBookmarks.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(mockBookmarkAPI.getMyBookmarks).toHaveBeenCalled())
    expect(screen.getByText(/No Bookmarks Yet/i)).toBeInTheDocument()
    expect(screen.getByText(/Browse Events/i)).toBeInTheDocument()
  })

  it('renders bookmarks and removes one when clicking remove', async () => {
    const bookmark = {
      id: 42,
      title: 'Music Night',
      date: '2024-01-01T10:00:00Z',
      location: 'NYC',
      category: 'music'
    }
    mockBookmarkAPI.getMyBookmarks.mockResolvedValue([bookmark])
    mockBookmarkAPI.unbookmark.mockResolvedValue({})

    renderPage()

    await waitFor(() => expect(screen.getByText('Music Night')).toBeInTheDocument())

    const removeButton = screen.getByRole('button', { name: /remove/i })
    await userEvent.click(removeButton)

    await waitFor(() => expect(mockBookmarkAPI.unbookmark).toHaveBeenCalledWith(42))
    await waitFor(() => expect(screen.queryByText('Music Night')).toBeNull())
  })
})

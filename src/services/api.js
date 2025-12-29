import axios from 'axios'

// Default to relative '/api/v1' so Vite dev proxy can forward to backend (127.0.0.1:8001)
// You can override with an absolute URL via VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const t0 = performance?.now?.() || 0
      if (import.meta.env?.DEV) console.debug('[DBG] login:start', email)
      // Use x-www-form-urlencoded (faster/smaller than multipart)
      const body = new URLSearchParams({ username: email, password })
      const { data } = await api.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const t1 = performance?.now?.() || 0
      if (import.meta.env?.DEV) console.debug('[DBG] login:done in', (t1 - t0).toFixed(1), 'ms')
      if (import.meta.env?.DEV) console.log('Login response user:', data?.user?.email || 'unknown')
      return data
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      throw error
    }
  },
  register: async (userData) => {
    try {
      console.log('Attempting registration:', userData)
      const { data } = await api.post('/auth/register', userData)
      console.log('Registration response:', data)
      return data
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message)
      throw error
    }
  },
  getProfile: async () => {
    try {
      const { data } = await api.get('/auth/me')
      console.log('Profile data:', data)
      return data
    } catch (error) {
      console.error('Profile fetch error:', error.response?.data || error.message)
      throw error
    }
  }
}

// Events API
export const eventsAPI = {
  getAll: async (filters = {}) => {
    try {
      if (import.meta.env?.DEV) console.log('Fetching events with filters:', filters)
      const { data } = await api.get('/events', { params: filters })
      if (import.meta.env?.DEV) console.log('Events response count:', Array.isArray(data) ? data.length : 'n/a')
      return data
    } catch (error) {
      console.error('Events fetch error:', error.response?.data || error.message)
      throw error
    }
  },
  getHappeningNow: async (filters = {}) => {
    try {
      if (import.meta.env?.DEV) console.log('Fetching happening-now with filters:', filters)
      const { data } = await api.get('/events/happening-now', { params: filters })
      return Array.isArray(data) ? data : data?.events || []
    } catch (error) {
      console.error('Happening-now fetch error:', error.response?.data || error.message)
      throw error
    }
  },
  getById: async (id) => {
    const { data } = await api.get(`/events/${id}`)
    return data
  },
  create: async (eventData) => {
    const token = localStorage.getItem('token')
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
    // Check if eventData is FormData (for file uploads)
    if (eventData instanceof FormData) {
      // Acquire CSRF token (sets cookie) and include header for protected form endpoints
      try {
        const t = await api.get('/auth/csrf-token')
        const csrfToken = t?.data?.csrfToken
        const { data } = await api.post('/events/upload', eventData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-csrf-token': csrfToken,
            ...authHeader,
          },
        })
        return data
      } catch (err) {
        // Fallback attempt without CSRF (dev environments disable CSRF)
        const { data } = await api.post('/events/upload', eventData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...authHeader,
          },
        })
        return data
      }
    } else {
      // Use regular endpoint for JSON data
      const { data } = await api.post('/events', eventData, {
        headers: {
          ...authHeader,
        },
      })
      return data
    }
  },
  update: async (id, eventData) => {
    const token = localStorage.getItem('token')
    const { data } = await api.put(`/events/${id}`, eventData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return data
  },
  delete: async (id) => {
    const token = localStorage.getItem('token')
    await api.delete(`/events/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
  rsvp: async (eventId, status) => {
    const token = localStorage.getItem('token')
    const payload = typeof status === 'string' ? { status } : status
    const { data } = await api.post(`/events/${eventId}/rsvp`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return data
  },
  getRSVPs: async (eventId) => {
    const token = localStorage.getItem('token')
    const { data } = await api.get(`/events/${eventId}/rsvps`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return data
  }
}

// Admin API
export const adminAPI = {
  getEventRSVPs: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/rsvps`)
    return data
  },
  getAllEventsWithRSVPs: async () => {
    // Backend enforces limit <= 100; include past + inactive for admin views
    const events = await eventsAPI.getAll({ include_past: true, include_inactive: true, limit: 100 })
    const eventsWithRSVPs = await Promise.all(
      events.map(async (event) => {
        try {
          const rsvps = await api.get(`/events/${event.id}/rsvps`)
          return {
            ...event,
            rsvps: rsvps.data
          }
        } catch (error) {
          // If user doesn't have access to this event's RSVPs, return event without RSVPs
          return {
            ...event,
            rsvps: []
          }
        }
      })
    )
    return eventsWithRSVPs
  },
  getPendingRSVPs: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/pending-rsvps`)
    return data
  },
  approveRSVP: async (eventId, rsvpId) => {
    const { data } = await api.post(`/events/${eventId}/rsvp/${rsvpId}/approve`)
    return data
  },
  rejectRSVP: async (eventId, rsvpId) => {
    const { data } = await api.post(`/events/${eventId}/rsvp/${rsvpId}/reject`)
    return data
  }
}

// QR Check-in API
export const checkinAPI = {
  // Get QR token for an RSVP (attendee gets their own, organizer can get any)
  getQRToken: async (eventId, rsvpId) => {
    const { data } = await api.get(`/events/${eventId}/qr/${rsvpId}`)
    return data
  },
  
  // Check in an attendee using their QR token
  checkinAttendee: async (eventId, qrToken) => {
    const { data } = await api.post(`/events/${eventId}/checkin`, { qr_token: qrToken })
    return data
  },
  
  // Get check-in statistics for an event
  getCheckinStats: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/checkin-stats`)
    return data
  }
}

// Bookmark API
export const bookmarkAPI = {
  // Create bookmark
  bookmark: async (eventId) => {
    const { data } = await api.post(`/events/${eventId}/bookmark`)
    return data
  },
  
  // Remove bookmark
  unbookmark: async (eventId) => {
    const { data } = await api.delete(`/events/${eventId}/bookmark`)
    return data
  },
  
  // Get user's bookmarks
  getMyBookmarks: async () => {
    const { data } = await api.get('/user/bookmarks')
    return data
  },
  
  // Check if event is bookmarked
  isBookmarked: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/bookmark/status`)
    return data.is_bookmarked
  }
}

export const questionsAPI = {
  getQuestions: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/questions`)
    return data
  },
  askQuestion: async (eventId, payload) => {
    const { data } = await api.post(`/events/${eventId}/questions`, payload)
    return data
  },
  answerQuestion: async (eventId, questionId, text) => {
    const { data } = await api.post(`/events/${eventId}/questions/${questionId}/answers`, { text })
    return data
  },
  voteHelpful: async (eventId, answerId) => {
    const { data } = await api.post(`/events/${eventId}/answers/${answerId}/vote`)
    return data
  },
  removeVote: async (eventId, answerId) => {
    const { data } = await api.delete(`/events/${eventId}/answers/${answerId}/vote`)
    return data
  }
}

export default api
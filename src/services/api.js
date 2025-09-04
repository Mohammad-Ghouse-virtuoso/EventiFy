import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      const formData = new FormData()
      formData.append('username', email)  // FastAPI OAuth2 expects 'username'
      formData.append('password', password)

      console.log('Attempting login for:', email)
      const { data } = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('Login response:', data)
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
      console.log('Fetching events with filters:', filters)
      const { data } = await api.get('/events', { params: filters })
      console.log('Events response:', data)
      return data
    } catch (error) {
      console.error('Events fetch error:', error.response?.data || error.message)
      throw error
    }
  },
  getById: async (id) => {
    const { data } = await api.get(`/events/${id}`)
    return data
  },
  create: async (eventData) => {
    const { data } = await api.post('/events', eventData)
    return data
  },
  update: async (id, eventData) => {
    const { data } = await api.put(`/events/${id}`, eventData)
    return data
  },
  delete: async (id) => {
    await api.delete(`/events/${id}`)
  },
  rsvp: async (eventId, status) => {
    const { data } = await api.post(`/events/${eventId}/rsvp`, { status })
    return data
  },
  getRSVPs: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/rsvps`)
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
    const events = await eventsAPI.getAll()
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
  }
}

export default api
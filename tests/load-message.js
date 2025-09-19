import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  scenarios: {
    message_broadcast: {
      executor: 'constant-vus',
      vus: parseInt(__ENV.VUS || '100', 10),
      duration: __ENV.DURATION || '60s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration{endpoint:comment}': ['p(95)<250'],
  },
}

const API = __ENV.API_BASE || 'http://localhost:8000/api/v1'
const ORG_START = parseInt(__ENV.ORG_START || '1', 10)
const ORG_COUNT = parseInt(__ENV.ORG_COUNT || '100', 10)

function login(email, password) {
  // organizers use predictable seed credentials
  const csrfRes = http.get(`${API}/auth/csrf-token`)
  const csrfToken = csrfRes.json('csrfToken')
  const payload = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  const res = http.post(`${API}/auth/login`, payload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRF-Token': csrfToken,
    },
  })
  return res
}

export function setup() {
  // Login a pool of organizers
  const tokens = []
  for (let i = 0; i < ORG_COUNT; i++) {
    const idx = ORG_START + i
    const email = `organizer${idx}@example.com`
    const password = 'Password123!'
    const res = login(email, password)
    if (res.status === 200) {
      tokens.push(res.json('access_token'))
    }
  }

  // load available events
  const evRes = http.get(`${API}/events`)
  const events = Array.isArray(evRes.json()) ? evRes.json() : []
  const eventIds = events.map((e) => e.id)
  return { tokens, eventIds }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function (data) {
  const { tokens, eventIds } = data
  if (!tokens.length || !eventIds.length) {
    sleep(1)
    return
  }
  const token = pick(tokens)
  const eventId = pick(eventIds)
  const body = JSON.stringify({
    event_id: eventId,
    content: 'Announcement: Please check event updates.',
    rating: null,
  })
  const res = http.post(`${API}/events/${eventId}/comments`, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { endpoint: 'comment' },
  })
  check(res, {
    'comment 2xx': (r) => r.status >= 200 && r.status < 300,
  })
}

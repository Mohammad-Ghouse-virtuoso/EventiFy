#!/usr/bin/env node
/*
Seeding script for EventiFy using API endpoints (exercises validation/auth paths).

Generates by default:
- Users: predictable emails user1@example.com … userN@example.com
  - Password: "password123" (same for all)
  - Roles: ~90% attendee, 10% organizer, 2–3 admin (capped)
- Events: 20 (each tied to a created organizer)
- RSVPs: 50–200 per event
- Comments: on ~20% of events (rating 1–5)

Usage:
- VITE_API_URL overrides API base; defaults to http://127.0.0.1:8001/api/v1
- USER_COUNT sets user count (default 100)
- node scripts/seed.js --users=100 --events=20 [--rotate]
  --rotate: if a predictable user already exists, attempt to overwrite their role and reset password to "password123"

Console output confirms each user action:
- [user] Created: <email> (<role>)
- [user] Overwritten: <email> (<role>)
- [user] Exists: <email> (<role>) (if rotate not requested or rotation not possible)
*/

import axios from 'axios'
import { faker } from '@faker-js/faker'

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'
const client = axios.create({ baseURL: API, withCredentials: true, headers: { 'Content-Type': 'application/json' } })

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const roles = ['attendee', 'organizer', 'admin']
const rsvpStatuses = ['going', 'maybe', 'not_going', 'waiting_for_approval', 'approved', 'rejected']
const categories = ['music', 'tech', 'sports', 'food', 'art', 'business', 'education', 'health', 'networking', 'entertainment']


function predictableCred(role, idx) {
  // Predictable emails: user1@example.com, user2@example.com, ...
  return {
    email: `user${idx}@example.com`,
    password: 'password123',
    full_name: faker.person.fullName(),
    role,
  }
}

async function getCsrfToken() {
  try {
    const res = await client.get('/auth/csrf-token')
    const token = res.data?.csrfToken
    if (token) {
      // Manually attach cookie header for Node axios (no cookie jar by default)
      client.defaults.headers.Cookie = `${'csrftoken'}=${token}`
    }
    return token
  } catch (e) {
    return null
  }
}

async function registerUser(user, csrfToken) {
  try {
    const { data } = await client.post('/auth/register', user, {
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
    })
  console.log(`[user] Created: ${user.email} (${user.role})`)
    return data
  } catch (e) {
    const status = e?.response?.status
    const detail = e?.response?.data?.detail
    // Treat common "already exists" responses as Exists (FastAPI returns 400 in our app)
    if (status === 409 || (status === 400 && typeof detail === 'string' && /already registered/i.test(detail))) {
  console.log(`[user] Exists: ${user.email} (${user.role})`)
      return null
    }
    console.log(`[user] Failed: ${user.email} (${user.role}) - status ${status || 'n/a'}${detail ? ` (${detail})` : ''}`)
    return null
  }
}

async function login(email, password, csrfToken) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const { data } = await client.post('/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  })
  return data
}

async function createEvent(token, organizerId) {
  const now = new Date()
  const start = faker.date.soon({ days: 60, refDate: now })
  const end = Math.random() > 0.5 ? faker.date.soon({ days: 1, refDate: start }) : null
  const payload = {
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    category: pick(categories),
    event_start: start.toISOString(),
    event_end: end ? end.toISOString() : null,
    location: faker.location.city(),
    max_attendees: faker.number.int({ min: 20, max: 500 }),
    price: faker.number.float({ min: 0, max: 200, multipleOf: 1 }),
    requires_approval: Math.random() < 0.3,
  }
  const { data } = await client.post('/events', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

async function rsvpToEvent(token, eventId, status) {
  await client.post(`/events/${eventId}/rsvp`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function commentOnEvent(token, eventId) {
  const payload = {
    event_id: eventId,
    content: faker.lorem.sentence(),
    rating: faker.number.int({ min: 1, max: 5 }),
  }
  const { data } = await client.post(`/events/${eventId}/comments`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}


function distributeRoles(n) {
  // ~10% organizers, 2–3 admins (capped), rest attendees (~90%)
  const organizers = Math.max(1, Math.round(n * 0.10))
  const admins = Math.max(2, Math.min(3, Math.round(n * 0.02)))
  const attendees = Math.max(0, n - organizers - admins)
  return { attendees, organizers, admins }
}

async function main() {

  const args = process.argv.slice(2)
  const usersCount = parseInt(process.env.USER_COUNT || (args.find(a => a.startsWith('--users=')) || '').split('=')[1] || '100', 10)
  const startIndex = parseInt((args.find(a => a.startsWith('--start=')) || '').split('=')[1] || '1', 10)
  const eventsCount = parseInt((args.find(a => a.startsWith('--events=')) || '').split('=')[1] || '20', 10)
  const rotate = args.includes('--rotate')

  console.log(`[seed] API: ${API}`)
  console.log(`[seed] Target: users=${usersCount}, start=${startIndex}, events=${eventsCount}`)

  // 1) Create users (predictable)
  const { attendees, organizers, admins } = distributeRoles(usersCount)
  console.log(`[seed] Role distribution: attendees=${attendees}, organizers=${organizers}, admins=${admins}`)

  const createdUsers = []

  let uid = startIndex
  for (let i = 0; i < attendees; i++, uid++) createdUsers.push(predictableCred('attendee', uid))
  for (let i = 0; i < organizers; i++, uid++) createdUsers.push(predictableCred('organizer', uid))
  for (let i = 0; i < admins; i++, uid++) createdUsers.push(predictableCred('admin', uid))

  // Register/rotate in manageable batches to avoid overwhelming API
  const batchSize = 100
  const passwordCandidates = ['password123', 'Password123!', 'attendee123', 'organizer123', 'admin123']
  const csrfToken = await getCsrfToken()
  for (let i = 0; i < createdUsers.length; i += batchSize) {
    const batch = createdUsers.slice(i, i + batchSize)
    await Promise.all(batch.map(async (u) => {
      try {
        const created = await registerUser(u, csrfToken)
        if (!created && rotate) {
          // If exists and rotate flag is set, try to login with candidate passwords, then update via /users/me
          let token = null
          for (const pwd of passwordCandidates) {
            try {
              const { access_token } = await login(u.email, pwd, csrfToken)
              token = access_token
              break
            } catch (_) {}
          }
          if (token) {
            try {
              await client.put('/users/me', { full_name: u.full_name, role: u.role, password: 'password123' }, {
                headers: { Authorization: `Bearer ${token}` },
              })
              console.log(`[user] Overwritten: ${u.email} (${u.role})`)
            } catch (e) {
              console.log(`[user] Exists but update failed: ${u.email} (${u.role}) - ${e.message}`)
            }
          } else {
            console.log(`[user] Exists but cannot rotate (login failed): ${u.email} (${u.role})`)
          }
        }
      } catch (e) { /* continue */ }
    }))
    process.stdout.write('.')
    await delay(100)
  }
  console.log('\n[seed] Users created/updated (or already existed)')

  // 2) Login organizers to create events
  const organizerCreds = createdUsers.filter(u => u.role === 'organizer')
  const organizerTokens = []
  for (const u of organizerCreds) {
    try {
      const { access_token, user } = await login(u.email, u.password, csrfToken)
      organizerTokens.push({ token: access_token, id: user.id })
    } catch (e) { /* skip if login fails */ }
  }
  console.log(`[seed] Organizer tokens ready: ${organizerTokens.length}`)

  // 3) Create events (round-robin organizers)
  const events = []
  for (let i = 0; i < eventsCount; i++) {
    const org = organizerTokens[i % Math.max(1, organizerTokens.length)]
    if (!org) break
    try {
      const ev = await createEvent(org.token, org.id)
      events.push(ev)
    } catch (e) { /* ignore and continue */ }
    if (i % 20 === 0) await delay(50)
  }
  console.log(`[seed] Events created: ${events.length}`)

  // 4) Prepare attendee/admin tokens for RSVPs/comments
  const otherCreds = createdUsers.filter(u => u.role !== 'organizer')
  const tokenCache = new Map()
  async function getToken(email, password) {
    if (tokenCache.has(email)) return tokenCache.get(email)
    const { access_token } = await login(email, password)
    tokenCache.set(email, access_token)
    return access_token
  }

  // 5) Seed RSVPs per event
  for (const ev of events) {
    const rsvpTarget = faker.number.int({ min: 50, max: 200 })
    for (let i = 0; i < rsvpTarget; i++) {
      const u = otherCreds[(i + ev.id) % otherCreds.length]
      try {
        const tok = await getToken(u.email, u.password)
        await rsvpToEvent(tok, ev.id, pick(rsvpStatuses))
      } catch (e) { /* continue */ }
    }
    // 20% of events get comments from a handful of users
    if (Math.random() < 0.2) {
      const commentsCount = faker.number.int({ min: 3, max: 10 })
      for (let k = 0; k < commentsCount; k++) {
        const u = otherCreds[(k + ev.id * 2) % otherCreds.length]
        try {
          const tok = await getToken(u.email, u.password)
          await commentOnEvent(tok, ev.id)
        } catch (e) { /* continue */ }
      }
    }
  }
  console.log('[seed] RSVPs and comments seeding complete')

  console.log('[seed] Done')
}

main().catch(err => { console.error(err); process.exit(1) })

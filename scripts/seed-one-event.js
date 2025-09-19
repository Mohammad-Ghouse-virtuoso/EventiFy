#!/usr/bin/env node
// Seed one organizer and one event for smoke tests (idempotent-ish).
// Usage: VITE_API_URL=http://127.0.0.1:8001/api/v1 node scripts/seed-one-event.js

import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const client = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } })

async function registerOrganizer(email, password, full_name) {
  try {
    await client.post('/auth/register', { email, password, full_name, role: 'organizer' })
    console.log(`[seed-one-event] Organizer registered: ${email}`)
  } catch (e) {
    // ignore duplicate
    console.log(`[seed-one-event] Organizer exists: ${email}`)
  }
}

async function login(email, password) {
  // Fetch CSRF token and set matching cookie + header for form login
  const csrfRes = await client.get('/auth/csrf-token')
  const token = csrfRes.data?.csrfToken
  if (!token) throw new Error('Failed to get CSRF token')
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const { data } = await client.post('/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-csrf-token': token,
      // Manually include cookie since axios in Node doesn't store Set-Cookie
      'Cookie': `csrftoken=${token}`,
    },
  })
  return data
}

async function createEvent(token) {
  const now = new Date()
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const payload = {
    title: 'Smoke Test Event',
    description: 'Auto-created event for smoke tests',
    category: 'tech',
    event_start: start.toISOString(),
    event_end: end.toISOString(),
    location: 'Test City',
    max_attendees: 200,
    price: 0,
    requires_approval: false,
  }
  const { data } = await client.post('/events', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

async function main() {
  console.log(`[seed-one-event] API: ${API}`)
  const email = 'organizer1@example.com'
  const password = 'Password123!'
  await registerOrganizer(email, password, 'Organizer One')
  const { access_token } = await login(email, password)
  try {
    const ev = await createEvent(access_token)
    console.log(`[seed-one-event] Created event id=${ev.id}`)
  } catch (e) {
    // If event creation fails (e.g., duplicate by title uniqueness), just continue
    console.log('[seed-one-event] Event creation failed or already exists; continuing')
  }
  console.log('[seed-one-event] Done')
}

main().catch((err) => { console.error(err.response?.data || err.message); process.exit(1) })

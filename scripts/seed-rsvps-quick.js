#!/usr/bin/env node
/**
 * Quick RSVP seeder: logs in predictable attendee users and creates ~25 RSVPs per event.
 * - Targets only future events (server default include_past=false)
 * - Uses confirmed + non-confirmed mix to avoid zero counts
 *
 * Usage:
 *   node scripts/seed-rsvps-quick.js [--events=<N>] [--perEvent=<M>] [--startUser=<K>] [--users=<U>]
 *   Env: VITE_API_URL overrides API base (default http://127.0.0.1:8001/api/v1)
 */
import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'
const client = axios.create({ baseURL: API, withCredentials: true, headers: { 'Content-Type': 'application/json' } })

const args = process.argv.slice(2)
const perEvent = parseInt((args.find(a => a.startsWith('--perEvent=')) || '').split('=')[1] || '25', 10)
const startUser = parseInt((args.find(a => a.startsWith('--startUser=')) || '').split('=')[1] || '1', 10)
const usersMax = parseInt((args.find(a => a.startsWith('--users=')) || '').split('=')[1] || '200', 10)

function statusFor(i) {
  // Bias towards confirmed counts: roughly 60% going/approved, rest maybe/not_going
  const mod = i % 10
  if (mod < 4) return 'going'
  if (mod < 6) return 'approved' // note: server only allows admin approval; 'approved' here becomes waiting if event requires approval
  if (mod < 8) return 'maybe'
  return 'not_going'
}

async function login(email, password) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const { data } = await client.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  return data.access_token
}

async function getEvents() {
  const { data } = await client.get('/events', { params: { limit: 100 } })
  return data
}

async function rsvp(token, eventId, status) {
  await client.post(`/events/${eventId}/rsvp`, { status }, { headers: { Authorization: `Bearer ${token}` } })
}

async function main() {
  console.log(`[seed-rsvps-quick] API: ${API}`)
  const events = await getEvents()
  console.log(`[seed-rsvps-quick] Events(future): ${events.length}`)

  // Prepare tokens for predictable users userK@example.com
  const tokenCache = new Map()
  async function getToken(k) {
    const email = `user${k}@example.com`
    if (tokenCache.has(email)) return tokenCache.get(email)
    try {
      const tok = await login(email, 'password123')
      tokenCache.set(email, tok)
      return tok
    } catch (e) {
      return null
    }
  }

  let usedUsers = 0
  for (const ev of events) {
    let seeded = 0
    let userIdx = startUser
    while (seeded < perEvent && usedUsers < usersMax) {
      const tok = await getToken(userIdx)
      userIdx++
      usedUsers++
      if (!tok) continue
      try {
        await rsvp(tok, ev.id, statusFor(seeded))
        seeded++
      } catch (_) { /* continue */ }
    }
    console.log(`[seed-rsvps-quick] Event ${ev.id}: +${seeded} RSVPs`)
  }
  console.log('[seed-rsvps-quick] Done')
}

main().catch(err => { console.error(err); process.exit(1) })

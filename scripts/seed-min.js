#!/usr/bin/env node
// Minimal seeding: register attendee1..N users via JSON only.
// Usage: USERS=50 VITE_API_URL=http://127.0.0.1:8010/api/v1 node scripts/seed-min.js

import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const USERS = parseInt(process.env.USERS || '50', 10)

const client = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } })

async function register(email, full_name) {
  const payload = { email, full_name, password: 'Password123!' }
  try {
    await client.post('/auth/register', payload)
    process.stdout.write('.')
  } catch (e) {
    // ignore duplicate errors to make script idempotent
    process.stdout.write('x')
  }
}

async function main() {
  console.log(`[seed-min] API: ${API}`)
  console.log(`[seed-min] Creating ${USERS} attendees (attendee1..${USERS})`)
  for (let i = 1; i <= USERS; i++) {
    const email = `attendee${i}@example.com`
    const name = `Attendee ${i}`
    await register(email, name)
  }
  console.log('\n[seed-min] Done')
}

main().catch((err) => { console.error(err); process.exit(1) })

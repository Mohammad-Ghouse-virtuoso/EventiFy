#!/usr/bin/env node
// Create predictable users user1..N@example.com with password 'password123' for k6 tests.
// Usage:
//   USERS=100 VITE_API_URL=http://127.0.0.1:8001/api/v1 node scripts/seed-k6-users.js

import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'
const USERS = parseInt(process.env.USERS || '50', 10)

const client = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } })

async function register(email, full_name) {
  const payload = { email, full_name, password: 'password123' }
  try {
    await client.post('/auth/register', payload)
    process.stdout.write('.')
  } catch (e) {
    // ignore duplicates to keep idempotent
    process.stdout.write('x')
  }
}

async function main() {
  console.log(`[seed-k6-users] API: ${API}`)
  console.log(`[seed-k6-users] Creating ${USERS} users (user1..${USERS}) with password 'password123'`)
  for (let i = 1; i <= USERS; i++) {
    const email = `user${i}@example.com`
    const name = `User ${i}`
    await register(email, name)
  }
  console.log('\n[seed-k6-users] Done')
}

main().catch((err) => { console.error(err.response?.data || err.message); process.exit(1) })

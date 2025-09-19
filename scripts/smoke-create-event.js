#!/usr/bin/env node
import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'

async function login(email, password) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const { data } = await axios.post(`${API}/auth/login`, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return data.access_token
}

async function getCsrfToken() {
  try {
    const { data, headers } = await axios.get(`${API}/auth/csrf-token`)
    const token = data?.csrfToken
    const setCookie = headers['set-cookie']?.[0]
    const cookie = setCookie ? setCookie.split(';')[0] : null
    return { token, cookie }
  } catch {
    return { token: null, cookie: null }
  }
}

async function register(email, password, role = 'organizer') {
  const { token, cookie } = await getCsrfToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-CSRF-Token': token } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  }
  const body = { email, password, full_name: 'CLI Tester', role }
  await axios.post(`${API}/auth/register`, body, { headers })
}

async function main() {
  let token
  try {
    token = await login('user1@example.com', 'password123')
  } catch {
    try {
      await register('cli_tester@example.com', 'password123', 'organizer')
      token = await login('cli_tester@example.com', 'password123')
    } catch (e) {
      console.error('Failed to prepare account:', e.response?.data || e.message)
      process.exit(1)
    }
  }
  const now = Date.now()
  const payload = {
    title: `Smoke Test Event ${now}`,
    description: 'Created by smoke-create-event.js',
    category: 'tech',
    event_start: new Date(now + 60 * 60 * 1000).toISOString(),
    event_end: null,
    location: 'CLI City',
    max_attendees: 25,
    price: 0,
    requires_approval: false
  }
  const { data } = await axios.post(`${API}/events`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.log('CREATED_EVENT_ID', data.id)
}

main().catch(err => { console.error(err.response?.data || err.message); process.exit(1) })

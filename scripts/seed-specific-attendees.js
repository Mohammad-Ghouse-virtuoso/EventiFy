#!/usr/bin/env node
/**
 * Seed RSVPs from specific user accounts to random events
 * Creates attendees if they don't exist, then randomly assigns them to 1-2 events each
 * 
 * Usage:
 *   node scripts/seed-specific-attendees.js
 *   Env: VITE_API_URL overrides API base (default http://127.0.0.1:8001/api/v1)
 */
import axios from 'axios'

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'
const client = axios.create({ 
  baseURL: API, 
  withCredentials: true, 
  headers: { 'Content-Type': 'application/json' } 
})

// Specific users to create/use
const USERS = [
  { email: 'Paul@eventify.com', password: 'Paul123', full_name: 'Paul Graham' },
  { email: 'jamie@eventify.com', password: 'Jamie123', full_name: 'Jamie Rhude' },
  { email: 'Charlie@eventify.com', password: 'Charlie123', full_name: 'Charlie Jr' },
  { email: 'Russel@eventify.com', password: 'Russel123', full_name: 'Russel Jen' },
  { email: 'Dimtri@eventify.com', password: 'Dimtri123', full_name: 'Dimtri Malkov' },
  { email: 'latha@example.com', password: 'latha123', full_name: 'latha Karu' },
  { email: 'raju@example.com', password: 'raju123', full_name: 'raju boya' },
  { email: 'harika@example.com', password: 'harika123', full_name: 'harika ravi' },
  { email: 'pallavi@example.com', password: 'pallavi123', full_name: 'pallavi kanu' },
  { email: 'xinghu@eventify.com', password: 'xinghu123', full_name: 'xinghu Xen' },
  { email: 'kunyaw@eventify.com', password: 'kun123', full_name: 'kunyaw ven' },
  { email: 'areeb@example.com', password: 'areeb123', full_name: 'areeb khan' },
  { email: 'jamal@example.com', password: 'jamal123', full_name: 'jamal ali' },
  { email: 'ajmal@eventify.com', password: 'ajmal123', full_name: 'ajmal raheem' },
  { email: 'shrek@example.com', password: 'shrek123', full_name: 'shrek ogre' },
]

// RSVP statuses to randomly assign
const STATUSES = ['going', 'maybe', 'going', 'going'] // Bias towards 'going'

function randomStatus() {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)]
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function registerUser(userData) {
  try {
    const { data } = await client.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
      role: 'attendee'
    })
    console.log(`✅ Created user: ${userData.full_name} (${userData.email})`)
    return data
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.detail?.includes('already registered')) {
      console.log(`ℹ️  User exists: ${userData.full_name} (${userData.email})`)
      return null
    }
    console.error(`❌ Failed to create ${userData.email}:`, err.response?.data?.detail || err.message)
    return null
  }
}

async function login(email, password) {
  try {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await client.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return data.access_token
  } catch (err) {
    console.error(`❌ Login failed for ${email}:`, err.response?.data?.detail || err.message)
    return null
  }
}

async function getEvents() {
  try {
    const { data } = await client.get('/events', { params: { limit: 100 } })
    return data
  } catch (err) {
    console.error('❌ Failed to fetch events:', err.response?.data?.detail || err.message)
    return []
  }
}

async function createRsvp(token, eventId, status) {
  try {
    await client.post(`/events/${eventId}/rsvp`, 
      { status }, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return true
  } catch (err) {
    // Ignore if already RSVP'd
    if (err.response?.status === 400 && err.response?.data?.detail?.includes('already')) {
      return false
    }
    console.error(`   ⚠️  RSVP failed for event ${eventId}:`, err.response?.data?.detail || err.message)
    return false
  }
}

async function main() {
  console.log(`\n🎭 EventiFy - Specific Attendee Seeder`)
  console.log(`📍 API: ${API}\n`)
  
  // Step 1: Create/verify all users exist
  console.log('📝 Step 1: Creating users...\n')
  for (const user of USERS) {
    await registerUser(user)
  }
  
  // Step 2: Get all events
  console.log('\n📅 Step 2: Fetching events...\n')
  const events = await getEvents()
  if (events.length === 0) {
    console.log('❌ No events found! Please seed events first with: npm run seed')
    process.exit(1)
  }
  console.log(`✅ Found ${events.length} events\n`)
  
  // Step 3: Randomly assign users to 1-2 events each
  console.log('🎟️  Step 3: Creating RSVPs...\n')
  
  let totalRsvps = 0
  const shuffledUsers = shuffle(USERS)
  
  for (const user of shuffledUsers) {
    // Login as user
    const token = await login(user.email, user.password)
    if (!token) continue
    
    // Randomly pick 1-2 events
    const numEvents = Math.random() < 0.5 ? 1 : 2
    const selectedEvents = shuffle(events).slice(0, numEvents)
    
    let userRsvps = 0
    for (const event of selectedEvents) {
      const status = randomStatus()
      const success = await createRsvp(token, event.id, status)
      if (success) {
        console.log(`   ✅ ${user.full_name} → "${event.title}" (${status})`)
        userRsvps++
        totalRsvps++
      }
    }
    
    if (userRsvps === 0) {
      console.log(`   ℹ️  ${user.full_name} - Already RSVP'd to selected events`)
    }
  }
  
  console.log(`\n✨ Done! Created ${totalRsvps} RSVPs from ${USERS.length} users`)
  console.log('\n💡 Tip: Login as any of these users to verify RSVPs:')
  USERS.slice(0, 3).forEach(u => console.log(`   - ${u.email} / ${u.password}`))
  console.log('\n')
}

main().catch(err => { 
  console.error('\n❌ Error:', err.message)
  process.exit(1) 
})

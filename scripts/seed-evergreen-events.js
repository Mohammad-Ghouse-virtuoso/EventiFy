#!/usr/bin/env node
/**
 * Evergreen Events Seeder
 * 
 * Creates 5 template events that auto-populate the platform.
 * - Events have future dates (3-14 days ahead)
 * - NPC attendees join automatically
 * - Uses Unsplash images for event banners
 * - Global locations (Europe, Asia, USA)
 * 
 * Usage:
 *   node scripts/seed-evergreen-events.js
 *   VITE_API_URL=http://localhost:8000/api/v1 node scripts/seed-evergreen-events.js
 * 
 * Can be run:
 *   - Manually when needed
 *   - Via cron job (daily check)
 *   - On app startup
 */

import axios from 'axios';
import { faker } from '@faker-js/faker';

const API = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const client = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// ============================================================================
// EVERGREEN EVENT TEMPLATES
// ============================================================================
const EVERGREEN_TEMPLATES = [
  {
    title: "Weekly Tech Meetup",
    description: "Join fellow tech enthusiasts for an evening of talks, demos, and networking. This week's topic: Building Modern Web Apps. Pizza and drinks provided!",
    category: "Technology",
    location: "Berlin, Germany",
    max_attendees: 50,
    price: 0,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80",
    daysAhead: { min: 3, max: 7 },
    npcCount: { min: 8, max: 15 }
  },
  {
    title: "Photography Walk",
    description: "Explore the city through your lens! Meet at the main square for a guided photo walk through iconic spots. All skill levels welcome. Bring your camera or smartphone.",
    category: "Art",
    location: "New York, USA",
    max_attendees: 30,
    price: 10,
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80",
    daysAhead: { min: 5, max: 10 },
    npcCount: { min: 5, max: 12 }
  },
  {
    title: "Fitness Bootcamp",
    description: "High-intensity outdoor workout session! Join our certified trainer for a full-body workout in the park. All fitness levels welcome. Bring water and a towel.",
    category: "Sports",
    location: "London, UK",
    max_attendees: 25,
    price: 15,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
    daysAhead: { min: 2, max: 5 },
    npcCount: { min: 10, max: 20 }
  },
  {
    title: "Cooking Workshop: Asian Cuisine",
    description: "Learn to make authentic dishes from across Asia! This hands-on workshop covers sushi, pad thai, and dumplings. All ingredients provided. Take home your creations!",
    category: "Food",
    location: "Tokyo, Japan",
    max_attendees: 20,
    price: 45,
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80",
    daysAhead: { min: 7, max: 14 },
    npcCount: { min: 6, max: 10 }
  },
  {
    title: "Live Music Jam Session",
    description: "Open mic night for musicians! Bring your instrument or just come to listen. All genres welcome. Great vibes, good people, amazing music. Drinks available at the bar.",
    category: "Music",
    location: "Amsterdam, Netherlands",
    max_attendees: 60,
    price: 5,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    daysAhead: { min: 4, max: 8 },
    npcCount: { min: 8, max: 18 }
  }
];

// ============================================================================
// NPC ATTENDEE POOL (Diverse names from around the world)
// ============================================================================
const NPC_POOL = [
  // Europe
  { full_name: "Emma Schmidt", region: "Europe" },
  { full_name: "Lucas Weber", region: "Europe" },
  { full_name: "Sophie Martin", region: "Europe" },
  { full_name: "Maximilian Müller", region: "Europe" },
  { full_name: "Isabella Rossi", region: "Europe" },
  { full_name: "Oliver Jensen", region: "Europe" },
  { full_name: "Amelie Dubois", region: "Europe" },
  { full_name: "Noah van der Berg", region: "Europe" },
  // Asia
  { full_name: "Yuki Tanaka", region: "Asia" },
  { full_name: "Raj Patel", region: "Asia" },
  { full_name: "Min-ji Kim", region: "Asia" },
  { full_name: "Hiroshi Yamamoto", region: "Asia" },
  { full_name: "Priya Sharma", region: "Asia" },
  { full_name: "Wei Chen", region: "Asia" },
  { full_name: "Aisha Rahman", region: "Asia" },
  { full_name: "Kenji Sato", region: "Asia" },
  // Americas
  { full_name: "Michael Johnson", region: "Americas" },
  { full_name: "Sarah Williams", region: "Americas" },
  { full_name: "Carlos Rodriguez", region: "Americas" },
  { full_name: "Emily Davis", region: "Americas" },
  { full_name: "James Wilson", region: "Americas" },
  { full_name: "Maria Garcia", region: "Americas" },
  { full_name: "David Brown", region: "Americas" },
  { full_name: "Jennifer Martinez", region: "Americas" },
  // Middle East & Africa
  { full_name: "Fatima Al-Hassan", region: "MENA" },
  { full_name: "Omar Khalil", region: "MENA" },
  { full_name: "Zainab Okonkwo", region: "MENA" },
  { full_name: "Ahmed Ibrahim", region: "MENA" }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function futureDate(daysMin, daysMax) {
  const days = randomInt(daysMin, daysMax);
  const date = new Date();
  date.setDate(date.getDate() + days);
  // Set a reasonable time (10:00 - 20:00)
  date.setHours(randomInt(10, 20), 0, 0, 0);
  return date.toISOString();
}

function generateNPCEmail(name) {
  const slug = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
  const num = randomInt(100, 999);
  return `${slug}${num}@eventify-npc.com`;
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

let adminToken = null;
let organizerToken = null;
let organizerId = null;

async function loginAsOrganizer() {
  // Try default organizer credentials
  const credentials = [
    { email: 'organizer@eventify.com', password: 'organizer123' },
    { email: 'organizer2@eventify.com', password: 'organizer123' },
    { email: 'admin@eventify.com', password: 'admin123' }
  ];

  for (const cred of credentials) {
    try {
      const form = new URLSearchParams();
      form.append('username', cred.email);
      form.append('password', cred.password);
      
      const { data } = await client.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      organizerToken = data.access_token;
      organizerId = data.user?.id;
      console.log(`✅ Logged in as: ${cred.email} (ID: ${organizerId})`);
      return true;
    } catch (e) {
      continue;
    }
  }
  
  console.error('❌ Could not login with any organizer credentials');
  return false;
}

async function registerNPC(npc) {
  const email = generateNPCEmail(npc.full_name);
  try {
    const { data } = await client.post('/auth/register', {
      email,
      password: 'npc123456',
      full_name: npc.full_name,
      role: 'attendee'
    });
    return { id: data.user?.id, email, token: data.access_token };
  } catch (e) {
    // User might already exist, try to login
    try {
      const form = new URLSearchParams();
      form.append('username', email);
      form.append('password', 'npc123456');
      const { data } = await client.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return { id: data.user?.id, email, token: data.access_token };
    } catch {
      return null;
    }
  }
}

// ============================================================================
// MAIN SEEDING LOGIC
// ============================================================================

async function createEvergreenEvent(template) {
  const eventData = {
    title: template.title,
    description: template.description,
    category: template.category,
    location: template.location,
    max_attendees: template.max_attendees,
    price: template.price,
    image: template.image,
    thumbnail: template.thumbnail,
    event_start: futureDate(template.daysAhead.min, template.daysAhead.max),
    requires_approval: false
  };

  try {
    const { data } = await client.post('/events', eventData, {
      headers: { Authorization: `Bearer ${organizerToken}` }
    });
    console.log(`📅 Created event: "${template.title}" (ID: ${data.id})`);
    return data;
  } catch (e) {
    console.error(`❌ Failed to create "${template.title}":`, e.response?.data?.detail || e.message);
    return null;
  }
}

async function addNPCsToEvent(event, npcCount) {
  const selectedNPCs = shuffle(NPC_POOL).slice(0, npcCount);
  let rsvpCount = 0;

  for (const npc of selectedNPCs) {
    const npcUser = await registerNPC(npc);
    if (!npcUser) continue;

    try {
      await client.post(`/events/${event.id}/rsvp`, 
        { status: 'going', notes: `Excited to attend ${event.title}!` },
        { headers: { Authorization: `Bearer ${npcUser.token}` } }
      );
      rsvpCount++;
    } catch (e) {
      // RSVP might already exist
    }
    
    await delay(50); // Small delay to avoid rate limiting
  }

  console.log(`   👥 Added ${rsvpCount} NPC attendees`);
  return rsvpCount;
}

async function checkExistingEvents() {
  try {
    const { data } = await client.get('/events', {
      params: { limit: 100 }
    });
    
    // Check if evergreen events already exist (by title match)
    const existingTitles = new Set(data.map(e => e.title));
    const evergreenTitles = EVERGREEN_TEMPLATES.map(t => t.title);
    
    const existing = evergreenTitles.filter(t => existingTitles.has(t));
    const missing = evergreenTitles.filter(t => !existingTitles.has(t));
    
    return { existing, missing, allEvents: data };
  } catch (e) {
    return { existing: [], missing: EVERGREEN_TEMPLATES.map(t => t.title), allEvents: [] };
  }
}

async function main() {
  console.log('\n🌱 EventiFy Evergreen Events Seeder\n');
  console.log(`API: ${API}\n`);

  // Step 1: Login as organizer
  const loggedIn = await loginAsOrganizer();
  if (!loggedIn) {
    console.log('\n⚠️  Please ensure the backend is running with seeded users.');
    process.exit(1);
  }

  // Step 2: Check what already exists
  const { existing, missing, allEvents } = await checkExistingEvents();
  
  if (existing.length > 0) {
    console.log(`\n📋 Already exist (${existing.length}):`);
    existing.forEach(t => console.log(`   - ${t}`));
  }

  if (missing.length === 0) {
    console.log('\n✅ All evergreen events already exist!');
    console.log('   Run with --force to recreate them.\n');
    
    if (!process.argv.includes('--force')) {
      return;
    }
  }

  // Step 3: Create missing events
  const templatesToCreate = process.argv.includes('--force') 
    ? EVERGREEN_TEMPLATES 
    : EVERGREEN_TEMPLATES.filter(t => missing.includes(t.title));

  console.log(`\n🚀 Creating ${templatesToCreate.length} evergreen events...\n`);

  let createdCount = 0;
  let totalNPCs = 0;

  for (const template of templatesToCreate) {
    const event = await createEvergreenEvent(template);
    if (event) {
      createdCount++;
      const npcCount = randomInt(template.npcCount.min, template.npcCount.max);
      totalNPCs += await addNPCsToEvent(event, npcCount);
    }
    await delay(100);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Events created: ${createdCount}`);
  console.log(`   NPC attendees: ${totalNPCs}`);
  console.log(`   Total events now: ${allEvents.length + createdCount}`);
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);

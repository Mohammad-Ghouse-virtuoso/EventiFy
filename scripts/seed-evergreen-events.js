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
// EVERGREEN EVENT TEMPLATES (Realistic, Diverse Events)
// ============================================================================
const EVERGREEN_TEMPLATES = [
  {
    title: "Berlin Tech Summit 2025",
    description: "Join 200+ developers, designers, and founders for keynotes on AI, Web3, and sustainable tech. Network over coffee and pastries. Early bird tickets 20% off!",
    category: "Technology",
    location: "Berlin, Germany",
    max_attendees: 200,
    price: 29.99,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80",
    daysAhead: { min: 3, max: 7 },
    npcCount: { min: 8, max: 15 }
  },
  {
    title: "Manhattan Photography Collective - Urban Exploration",
    description: "Discover hidden gems in Manhattan through the lens! Led by award-winning photographer James Chen. Showcase your best shots for group critique and feedback.",
    category: "Art",
    location: "New York, USA",
    max_attendees: 25,
    price: 35,
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80",
    daysAhead: { min: 5, max: 10 },
    npcCount: { min: 5, max: 12 }
  },
  {
    title: "Hyde Park Bootcamp - Outdoor Fitness Series",
    description: "Led by certified CrossFit coach Sarah Miller. HIIT training in the heart of London. All levels welcome. Bring your own mat, we provide water and energy bars!",
    category: "Sports",
    location: "London, UK",
    max_attendees: 40,
    price: 15,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
    daysAhead: { min: 2, max: 5 },
    npcCount: { min: 10, max: 20 }
  },
  {
    title: "Shinjuku Culinary Arts - Japanese Ramen Masterclass",
    description: "Master the art of tonkotsu ramen with Michelin-trained chef Yuki Tanaka. Learn broth techniques, noodle selection, and authentic toppings. Hands-on, cook what you learn!",
    category: "Food",
    location: "Tokyo, Japan",
    max_attendees: 18,
    price: 65,
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80",
    daysAhead: { min: 7, max: 14 },
    npcCount: { min: 6, max: 10 }
  },
  {
    title: "Melkweg Open Stage - Live Music & Comedy",
    description: "Amsterdam's iconic venue hosts emerging artists and comedians. Expect eclectic performances from funk to indie rock. Bar open all night. Come support local talent!",
    category: "Music",
    location: "Amsterdam, Netherlands",
    max_attendees: 150,
    price: 12.50,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    daysAhead: { min: 4, max: 8 },
    npcCount: { min: 8, max: 18 }
  },
  {
    title: "Barcelona Art Gallery - Modern & Contemporary Showcase",
    description: "New exhibition featuring 40+ artists from across Europe. Opening night reception with wine & catering. Meet the artists, discuss inspiration, and network with collectors.",
    category: "Art",
    location: "Barcelona, Spain",
    max_attendees: 100,
    price: 18,
    image: "https://images.unsplash.com/photo-1578321272176-aaa1b1e19a1c?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1578321272176-aaa1b1e19a1c?w=400&q=80",
    daysAhead: { min: 3, max: 9 },
    npcCount: { min: 6, max: 14 }
  },
  {
    title: "Startup Pitch Night - Singapore Tech Hub",
    description: "See 10 innovative startups pitch to VCs and angel investors. Q&A session follows. Network with founders, investors, and tech enthusiasts. Free for early-stage founders!",
    category: "Technology",
    location: "Singapore",
    max_attendees: 80,
    price: 0,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80",
    daysAhead: { min: 6, max: 12 },
    npcCount: { min: 7, max: 16 }
  },
  {
    title: "Sydney Harbour Yoga & Wellness Retreat",
    description: "Sunset yoga with ocean views led by certified instructors. Meditation, breathing exercises, and wellness talk. Vegetarian snacks and herbal tea included. Relaxation guaranteed!",
    category: "Sports",
    location: "Sydney, Australia",
    max_attendees: 35,
    price: 22,
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
    daysAhead: { min: 2, max: 6 },
    npcCount: { min: 7, max: 13 }
  },
  {
    title: "Paris Cooking Academy - French Pastry Masterclass",
    description: "Learn croissant, éclair, and macaron techniques from classically trained pastry chef Marie Dubois. Work with premium European ingredients. Take home your pastries!",
    category: "Food",
    location: "Paris, France",
    max_attendees: 20,
    price: 95,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80",
    daysAhead: { min: 5, max: 11 },
    npcCount: { min: 5, max: 9 }
  },
  {
    title: "Toronto Film Festival - Indie Cinema Night",
    description: "Screening of 3 award-winning short films followed by director Q&A. Popcorn and drinks available. Support independent filmmakers. Perfect for cinema lovers!",
    category: "Entertainment",
    location: "Toronto, Canada",
    max_attendees: 120,
    price: 16,
    image: "https://images.unsplash.com/photo-1489599849228-58cccc1b1c13?w=800&q=80",
    thumbnail: "https://images.unsplash.com/photo-1489599849228-58cccc1b1c13?w=400&q=80",
    daysAhead: { min: 4, max: 10 },
    npcCount: { min: 8, max: 17 }
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
  let rsvpCount = { going: 0, maybe: 0, not_going: 0 };
  
  // Distribution: 65% going, 20% maybe, 15% not_going (realistic RSVP pattern)
  const goingTarget = Math.ceil(selectedNPCs.length * 0.65);
  const maybeTarget = Math.ceil(selectedNPCs.length * 0.20);

  for (let i = 0; i < selectedNPCs.length; i++) {
    const npc = selectedNPCs[i];
    const npcUser = await registerNPC(npc);
    if (!npcUser) continue;

    // Determine RSVP status based on distribution
    let status = 'not_going';
    if (i < goingTarget) {
      status = 'going';
    } else if (i < goingTarget + maybeTarget) {
      status = 'maybe';
    }

    const notes = {
      going: `Can't wait to attend ${event.title}!`,
      maybe: `Interested but might have conflicts.`,
      not_going: `Thanks for the invite, but I'll have to skip this one.`
    }[status];

    try {
      await client.post(`/events/${event.id}/rsvp`, 
        { status, notes },
        { headers: { Authorization: `Bearer ${npcUser.token}` } }
      );
      rsvpCount[status]++;
    } catch (e) {
      // RSVP might already exist; update it
      try {
        await client.put(`/events/${event.id}/rsvp`, 
          { status, notes },
          { headers: { Authorization: `Bearer ${npcUser.token}` } }
        );
        rsvpCount[status]++;
      } catch (err) {
        // Silently skip if both fail
      }
    }
    
    await delay(30); // Small delay to avoid rate limiting
  }

  const total = rsvpCount.going + rsvpCount.maybe + rsvpCount.not_going;
  console.log(`   👥 ${total} NPCs added: ${rsvpCount.going}✅ ${rsvpCount.maybe}❓ ${rsvpCount.not_going}❌`);
  return total;
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

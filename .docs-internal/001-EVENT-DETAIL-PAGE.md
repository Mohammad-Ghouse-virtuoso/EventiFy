# F-001: Event Detail Page (Enhanced)

**Status:** DESIGNING  
**Priority:** HIGH (foundational for all other features)  
**Effort:** 2-3 days

---

## Overview

Transform event discovery from card-based to comprehensive detail view. All features (Bookmark, Q&A, Social Share, Network) depend on this foundation.

---

## Current State

- **EventCard.jsx**: List view only (image, title, date, location, RSVP buttons)
- **App.jsx**: Uses `<Link to={...}>` for event navigation (likely not implemented)
- **Missing**: Full event detail page/modal

---

## Target Design

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  < Back    [Bookmark ♡]  [Share ↗️]                   │  ← Header
├─────────────────────────────────────────────────────┤
│                                                       │
│  [Event Image - Full Width or Hero]                 │
│                                                       │
├─────────────────────────────────────────────────────┤
│  SECTION 1: Event Essentials                         │
│  ├─ Title                                             │
│  ├─ Date & Time (with 48h timer if applicable)      │
│  ├─ Location                                          │
│  ├─ Price                                             │
│  └─ [Attending: 45] [Maybe: 12] [Not Going: 8]     │
├─────────────────────────────────────────────────────┤
│  SECTION 2: Organizer Info                           │
│  ├─ Organizer Avatar + Name                         │
│  ├─ Contact: [☎️ Phone] [✉️ Email]                  │
│  ├─ About Organizer (optional bio)                   │
│  └─ [Follow/Connect Button]                         │
├─────────────────────────────────────────────────────┤
│  SECTION 3: Event Description                        │
│  ├─ Full description text                            │
│  ├─ Category badge                                   │
│  └─ Capacity indicator (45/120 attendees)           │
├─────────────────────────────────────────────────────┤
│  SECTION 4: Terms & Conditions                       │
│  └─ Collapsible: "Refund Policy", "Code of Conduct" │
├─────────────────────────────────────────────────────┤
│  SECTION 5: Questions & Answers (Q&A)               │
│  ├─ [Ask a Question]                                │
│  ├─ Q: "When does parking open?"                    │
│  │  A: "Free parking available from 6pm..."         │
│  ├─ Q: "Is there vegetarian food?"                  │
│  │  A: "Yes, see menu..."                           │
│  └─ [Load More Questions]                           │
├─────────────────────────────────────────────────────┤
│  SECTION 6: Attendee Network (When Available)        │
│  ├─ "Attendees Going (45)"                          │
│  └─ [Avatar] [Avatar] [Avatar] ... [+12 More]      │
│     (Click to view profiles/connect)                 │
├─────────────────────────────────────────────────────┤
│  ACTION BAR (Sticky at Bottom)                       │
│  ├─ [RSVP: Going] [Maybe] [Not Going]               │
│  ├─ [Share to Socials]                              │
│  └─ [Bookmark/Remove]                               │
└─────────────────────────────────────────────────────┘
```

---

## Section Details

### SECTION 1: Event Essentials
```jsx
- Title (h1)
- Date: "Friday, Dec 20, 2025 at 7:00 PM - 10:00 PM"
  + Show 48h countdown timer if < 48 hours away
- Location: "Berlin, Germany" (with map icon)
- Price: "$25" or "Free"
- RSVP Count: "Going: 45 | Maybe: 12 | Not Going: 8"
```

### SECTION 2: Organizer Info (Unique Per Event)
```jsx
Card Layout:
├─ Avatar (circular, 64px)
├─ Name: "Sarah Chen"
├─ Title: "Tech Events Curator"
├─ Contact:
│  ├─ ☎️ +49 30 123 456 (random, masked partially)
│  ├─ ✉️ sarah@eventify.com
├─ Bio: "Love connecting people through tech events..."
└─ [Follow/Add to Network] button
```

### SECTION 3: Event Description
```jsx
- Full description (from event.description)
- Category badge (#tech #networking)
- Capacity: "45 out of 120 spots filled"
- Max attendees: 120
```

### SECTION 4: Terms & Conditions (Unique Per Event)
```jsx
Collapsible sections:
├─ Refund Policy
│  └─ "Full refund until 48 hours before event"
├─ Code of Conduct
│  └─ "Be respectful, no harassment..."
├─ Health & Safety
│  └─ "Masks optional, hand sanitizer provided"
└─ Cancellation Policy
   └─ "Event will be rescheduled if <20 attendees"
```

### SECTION 5: Q&A Section
```jsx
├─ Input: "Ask the organizer a question..."
├─ Questions List:
│  ├─ Q: "When does parking open?" (by Sarah)
│  │  ├─ A: "Parking opens at 6pm" (Organizer)
│  │  └─ [Like] [Reply]
│  └─ Q: "Is vegetarian food available?" (by John)
│     └─ [Awaiting Organizer Response]
└─ Sorting: Recent / Most Useful
```

### SECTION 6: Attendee Network (Future)
```jsx
- Show first 5 attendee avatars
- Click avatar → View profile
- [+12 More Attendees] button
- When Feature F-006 ready
```

---

## Data Requirements

### New Fields Needed
```
Event Model:
- organizer_phone: string (random generated per event)
- terms_conditions: JSON {
    refund_policy: string,
    code_of_conduct: string,
    health_safety: string,
    cancellation_policy: string
  }
- has_questions_enabled: boolean (default: true)
```

### Backend Endpoints (Existing)
```
GET /api/v1/events/{id}          → Event details
GET /api/v1/events/{id}/rsvps    → RSVP counts
GET /api/v1/events/{id}/questions → Q&A (to implement)
```

---

## Implementation Steps

### Step 1: Create EventDetail.jsx Component
- [ ] Fetch event data by ID
- [ ] Layout structure (sections 1-5)
- [ ] Responsive design (mobile-first)
- [ ] Error states (event not found, loading)

### Step 2: Update App.jsx Routes
- [ ] Add route: `/events/:id`
- [ ] Link EventCard to detail page
- [ ] Navigation (back button)

### Step 3: Add Backend Fields
- [ ] Add organizer_phone to Event model
- [ ] Add terms_conditions JSON field
- [ ] Seed with realistic data (per event)

### Step 4: UI Components
- [ ] EventEssentials.jsx
- [ ] OrganizerCard.jsx
- [ ] TermsSection.jsx
- [ ] QASection.jsx (stub for now)
- [ ] ActionBar.jsx (sticky buttons)

---

## Test Cases

### Page Load
- [ ] Page loads event details correctly
- [ ] Image loads and displays responsively
- [ ] Organizer info shows correct random phone/email
- [ ] RSVP counts match backend data
- [ ] 48h timer shows for upcoming events
- [ ] No timer for past events

### User Interactions
- [ ] Click bookmark → Heart fills
- [ ] Click share → Modal/menu opens
- [ ] Click organizer → Goes to profile (future)
- [ ] RSVP buttons change status
- [ ] Back button returns to events list

### Edge Cases
- [ ] Event with no image shows placeholder
- [ ] Very long description doesn't break layout
- [ ] Mobile view stacks properly
- [ ] 404 for non-existent event

---

## Component Hierarchy

```
EventDetail.jsx (Page)
├─ EventImage.jsx
├─ EventEssentials.jsx
│  └─ CountdownTimer.jsx (if < 48h)
├─ OrganizerCard.jsx
├─ EventDescription.jsx
├─ TermsSection.jsx
├─ QASection.jsx (stub)
├─ AttendeeNetworkSection.jsx (stub - future)
└─ ActionBar.jsx (sticky)
   ├─ BookmarkButton.jsx
   ├─ ShareButton.jsx
   └─ RSVPButtons.jsx
```

---

## Notes

- Design should match existing EventiFy dark mode styling
- Use Tailwind classes consistently
- Keep components reusable (OrganizerCard used elsewhere later)
- Ensure accessibility (ARIA labels, keyboard nav)


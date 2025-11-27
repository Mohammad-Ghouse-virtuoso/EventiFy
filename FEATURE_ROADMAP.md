# EventiFy Feature Roadmap

> Future enhancements and implementation ideas for EventiFy event management platform.

---

## 🎫 1. QR Code Check-in System

**Status:** Ready to implement (foundation exists)

### What We Already Have
- ✅ `qrcode` npm package installed
- ✅ RSVP model has `checked_in: bool` and `checked_in_at: datetime` fields
- ✅ User-to-event RSVP relationship established

### Implementation Plan

#### Backend (FastAPI)
```
POST /api/v1/events/{event_id}/checkin
- Body: { "qr_token": "..." } or { "rsvp_id": int }
- Auth: Organizer/Admin only
- Updates: checked_in=True, checked_in_at=now()
- Returns: Attendee info + success message

GET /api/v1/events/{event_id}/qr/{rsvp_id}
- Generates unique QR token for attendee's RSVP
- Returns: QR data (base64 or token string)
```

#### Frontend
| Component | Purpose |
|-----------|---------|
| `QRCodeGenerator.jsx` | Show QR code on attendee's "My Tickets" page |
| `QRScanner.jsx` | Camera-based scanner for organizers (use `html5-qrcode` or `@yudiel/react-qr-scanner`) |
| `CheckinDashboard.jsx` | Real-time check-in stats for organizers |

#### QR Payload Options
1. **Simple:** `eventify://checkin/{rsvp_id}/{secret_hash}`
2. **JWT-based:** Short-lived signed token with rsvp_id + event_id
3. **UUID:** One-time use token stored in DB

#### User Flow
```
Attendee RSVPs → Gets QR Code → Shows at event → Organizer scans → Checked in ✅
```

#### ✅ ANSWERED: How QR Validation Works

**Complete Architecture:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (RSVP Table)                        │
│  id=42 | user_id=5 | event_id=10 | status=approved                 │
│  checked_in=false | qr_token="signed_jwt_token"                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ATTENDEE VIEW        ORGANIZER VIEW         ADMIN VIEW
   "My Tickets"         "Check-in Scanner"     "All RSVPs"
   Shows QR code        Camera scans QR        See who's in
```

**Security Measures:**
1. **JWT Signed Token** - QR contains `{rsvp_id, event_id, user_id, exp}` signed with server secret
2. **One-Time Use** - Already checked in = rejected on rescan
3. **Event-Specific** - Token only works for the correct event
4. **Expiry** - Token expires 24hrs after event ends

**What Organizer Sees After Scan:**
```json
{ "success": true, "attendee": { "name": "John Doe", "status": "approved" }, "message": "Welcome! ✅" }
```

---

## 📧 2. Email Notifications

**Priority:** High

### Trigger Points
| Event | Email To | Content |
|-------|----------|---------|
| RSVP Confirmed | Attendee | Event details + QR code |
| RSVP Approved | Attendee | Approval confirmation + QR |
| Event Reminder | All RSVPs | 24h / 1h before event |
| Event Updated | All RSVPs | Changed details |
| Event Cancelled | All RSVPs | Cancellation notice |

### Tech Stack Options
- **SendGrid** / **Mailgun** / **AWS SES** for production
- **FastAPI-Mail** for implementation
- Email templates with Jinja2

#### ✅ Testing Strategy
Use **Mailtrap** or **Mailhog** for local testing (catches all emails without sending real ones).
Test accounts: `admin@eventify-test.com`, `organizer@eventify-test.com`, `attendee1@eventify-test.com`

---

## 🔔 3. In-App Notification System

**Priority:** High

### Features
- Notification bell icon in navbar with unread count
- Notification dropdown/panel
- Mark as read functionality
- Notification preferences (settings page)

### Notification Types
- RSVP status changes
- Event updates/cancellations
- New comments on your events
- Approval requests (for organizers)

### Backend Model
```python
class Notification:
    id, user_id, type, title, message, 
    link, is_read, created_at
```

---

## 📅 4. Calendar Integration

**Priority:** Medium

### Features
- "Add to Calendar" button on event pages
- Export formats: `.ics` (iCal), Google Calendar link
- Sync with external calendars (OAuth)

### Implementation
```
GET /api/v1/events/{event_id}/calendar.ics
- Returns: ICS file download
```

**Status:** 🔜 Deferred to later phase 
---

## 🔁 5. Recurring Events

**Priority:** Medium

### Use Cases
- Weekly meetups
- Monthly workshops
- Annual conferences

### Model Extension
```python
class Event:
    # Add fields:
    recurrence_rule: str  # RRULE format
    recurrence_end: datetime
    parent_event_id: int  # For instances
```

**Status:** ✅ Approved for future implementation 
---

## ⏳ 6. Waitlist System

**Priority:** Medium

### How It Works
- When `attendees_count >= max_attendees`:
  - New RSVPs go to waitlist (`status: waitlisted`)
  - If someone cancels → auto-promote from waitlist
  - Notify promoted attendee

### Model Addition
```python
class RSVPStatus(Enum):
    ...
    WAITLISTED = "waitlisted"
```

**Status:** 🔜 Deferred - Will expand design later
---

## 🔍 7. Advanced Search & Discovery

**Priority:** Medium

### Features
- **Full-text search** (PostgreSQL `tsvector` or Elasticsearch)
- **Geolocation** - Find events near me
- **Tags/Topics** - Multi-select filtering
- **Saved searches** - Get notified for matching events

**Status:** ✅ Approved

## 💬 8. Real-time Features

**Priority:** Low (nice-to-have)

### Options
- **WebSocket** for live updates
- Event chat/discussion
- Live attendee count
- Real-time check-in dashboard

### Tech
- FastAPI WebSocket support
- Socket.io for frontend (or native WebSocket)

#### ✅ Railway Capacity Answer
- **Free/Hobby Tier:** ~100-200 concurrent WebSocket connections
- **Recommendation:** Start with **polling every 5s**, upgrade to WebSocket at 50+ active users
- **Load Testing:** Use k6 or locust to simulate concurrent users 
---

## 👥 9. Social Features

**Priority:** Low

### Features
- Follow organizers
- Share events to social media
- "Friends attending" indicator
- Event recommendations based on history

**Status:** ✅ Approved for implementation
---

## 📊 10. Enhanced Analytics

**Priority:** Low

### For Organizers
- Attendance trends over time
- Peak registration times
- Demographic insights (if collected)
- Revenue reports (for paid events)

### For Admins
- Platform-wide metrics
- Active users graph
- Popular categories
- Event success rates

**Status:** 🌱 Future phase - when user base grows
---

## 🔐 11. Security Enhancements

**Priority:** Ongoing

### Considerations
- [ ] Rate limiting on all endpoints
- [ ] Two-factor authentication (2FA)
- [ ] OAuth providers (Google, GitHub login)
- [ ] Audit logging for admin actions
- [ ] GDPR compliance (data export/delete)

**Status:** 🔄 Ongoing priority
---

## 📱 12. Mobile App (Future)

### Options
1. **React Native** - Share logic with web
2. **PWA** - Progressive Web App first
3. **Flutter** - Cross-platform

### PWA Features (Quick Win)
- Add to home screen
- Offline event viewing
- Push notifications
- QR code in wallet-style

**Status:** 📱 Future phase
---

## 🎨 13. UI/UX Improvements

### Quick Wins
- [ ] Dark mode toggle (already in progress?)
- [ ] Skeleton loading states
- [ ] Infinite scroll for events
- [ ] Image lazy loading
- [ ] Form validation improvements

**Status:** 🎨 Ongoing improvements
---

## 🚀 Quick Implementation Priority

| # | Feature | Effort | Impact | Dependencies |
|---|---------|--------|--------|--------------|
| 1 | QR Check-in | Low | High | Ready now |
| 2 | Email Notifications | Medium | High | SMTP setup |
| 3 | Calendar Export | Low | Medium | None | 🔜 LATER
| 4 | Waitlist | Low | Medium | None |
| 5 | In-App Notifications | Medium | High | Backend model |
| 6 | Social Sharing | Low | Medium | None |

---

## Next Steps

1. **Decide priority** - Which features align with your goals?
2. **Create issues** - Break down into GitHub issues
3. **Implement incrementally** - One feature at a time with tests
4. **Gather feedback** - User testing after each feature

---

*Last updated: November 2025*
*Repository: Mohammad-Ghouse-virtuoso/EventiFy*

---

## 🌱 14. Evergreen Events System (Auto-Populating)

**Status:** ✅ Approved - HIGH PRIORITY

### Concept
4-5 template events that auto-regenerate when expired, keeping the platform alive with activity.

### Evergreen Event Templates

| Event | Category | Location | Recurrence | NPC Attendees |
|-------|----------|----------|------------|---------------|
| Weekly Tech Meetup | Technology | Berlin, Germany | Weekly | 8-15 |
| Photography Walk | Art | New York, USA | Bi-weekly | 5-12 |
| Fitness Bootcamp | Sports | London, UK | Weekly | 10-20 |
| Cooking Workshop | Food | Tokyo, Japan | Monthly | 6-10 |
| Music Jam Session | Music | Amsterdam, Netherlands | Weekly | 8-18 |

### Implementation Options

| Approach | How | Recommendation |
|----------|-----|----------------|
| **Cron Job** | Daily script checks expired events, creates new | ✅ Best for Railway |
| **On-Demand** | Check & regenerate when user loads events | Good fallback |
| **Seed Script** | `npm run seed:evergreen` | Manual control |

### Features
- Uses Unsplash/Pexels URLs for images
- Faker.js generates NPC attendee names
- Random future dates (3-14 days ahead)
- Auto-cleanup of expired events (soft delete)

### NPC Attendee Pool
```javascript
const npcPool = [
  { name: "Emma Schmidt", location: "Berlin" },
  { name: "Raj Patel", location: "London" },
  { name: "Yuki Tanaka", location: "Tokyo" },
  { name: "Carlos Rodriguez", location: "Madrid" },
  { name: "Fatima Al-Hassan", location: "Dubai" },
  { name: "Lucas Weber", location: "Amsterdam" },
  // ... more from Faker.js
];
```

### Script Location
`scripts/seed-evergreen-events.js` - Run daily via Railway cron or manually

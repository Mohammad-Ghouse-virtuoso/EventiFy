# Issue: Improve "What's Happening Now?" (Real-Time) & Make Testimonials Dynamic

**Reporter**: PraveenBabuAvva  
**Status**: Planning & Implementation  
**Date Created**: December 29, 2025  

---

## 🎯 Problem Statement

### Issue 1: "What's Happening Now?" - Real-Time Updates
**Current State**: Events in the "What's Happening Now" section are static and don't update in real-time.
- Events starting soon are not highlighted
- No live countdown timers
- Users see stale data requiring manual refresh
- No indication of urgency for imminent events

**Desired State**: Dynamic real-time section that:
- Auto-refreshes every 30-60 seconds
- Shows live countdown timers for events happening within 48 hours
- Highlights events <1 hour away with visual urgency (red/pulsing)
- Displays events happening NOW with special badge
- Updates attendee counts in real-time from database
> Great, implement this.

### Issue 2: Testimonials - Static to Dynamic
**Current State**: Hardcoded testimonials in `TestimonialsSection.jsx`
- All data is imported as static arrays
- No database integration
- No dynamic rating system
- No real user feedback mechanism

**Desired State**: Dynamic testimonials that:
- Pull from database (new Testimonial model)
- Show real user ratings & quotes
- Auto-refresh periodically (every 5 minutes)
- Admin panel to manage/moderate testimonials
- Highlight top-rated testimonials
> Pulling from db requires to add a pfp (avatar) & it can be cumbersome, try to work on with a new design which navigates smoothly.. 

---

## 📋 Implementation Roadmap

### Phase 1: Real-Time Updates for "What's Happening Now"

#### Step 1.1: Backend Enhancements
**Files**: `backend/app/models/event.py`, `backend/app/api/api_v1/endpoints/events.py`

- [ ] Add computed field to Event: `time_until_start` (calculated in real-time)
- [ ] Add endpoint: `GET /events/happening-now` 
  - Returns events happening within 48 hours
  - Sorted by urgency (closest first)
  - Includes live countdown data
  - Includes real-time attendee counts
- [ ] Add WebSocket endpoint for streaming updates (optional but nice):
  - `WS /events/happening-now/stream`
  - Pushes updates every 30 seconds

**Expected Response**:
```json
{
  "events": [
    {
      "id": 1,
      "title": "Tech Talk Tonight",
      "starts_in": {
        "hours": 0,
        "minutes": 45,
        "seconds": 30
      },
      "urgency_level": "happening_now",
      "attendees_count": 42,
      "max_attendees": 50
    }
  ],
  "timestamp": "2025-12-29T18:45:30Z"
}
```

#### Step 1.2: Frontend Component Update
**File**: `src/components/WhatsHappeningNow.jsx`

- [ ] Add auto-refresh every 30 seconds:
  ```jsx
  useEffect(() => {
    const interval = setInterval(fetchHappeningNow, 30000)
    return () => clearInterval(interval)
  }, [])
  ```
- [ ] Add countdown timer component:
  - Updates every second for events <1 hour away
  - Shows `HH:MM:SS` format
  - Stops when event passes
- [ ] Add urgency styling:
  - **Happening NOW** (event started): Red badge + pulsing animation
  - **<1 hour away**: Red/orange border + countdown timer
  - **1-24 hours**: Blue border + time display
  - **24-48 hours**: Gray border + date display
- [ ] Add attendee count badge with live updates
- [ ] Optimize re-renders with memoization

#### Step 1.3: Testing
- [ ] Test countdown accuracy
- [ ] Verify auto-refresh every 30 seconds
- [ ] Check performance with many events
- [ ] Test mobile responsiveness

---

### Phase 2: Dynamic Testimonials System

#### Step 2.1: Database Schema
**Files**: New file `backend/app/models/testimonial.py`

```python
class Testimonial(SQLModel, table=True):
    __tablename__ = "testimonials"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="testimonials")
    
    quote: str = Field(min_length=10, max_length=500)
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    event_id: Optional[int] = Field(default=None, foreign_key="event.id")
    
    is_approved: bool = Field(default=False)  # Moderation
    is_featured: bool = Field(default=False)  # For homepage hero
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Migration**:
- [ ] Create Alembic migration: `add_testimonials_table`

#### Step 2.2: Backend Endpoints
**File**: `backend/app/api/api_v1/endpoints/testimonials.py` (New)

- [ ] `GET /testimonials` - List approved testimonials
  - Query params: `limit=6`, `sort=rating|recent`
  - Caching: Cache for 5 minutes
- [ ] `GET /testimonials/featured` - Get featured testimonials for homepage
- [ ] `POST /testimonials` - Create testimonial (authenticated users only)
  - Requires event RSVP history
  - Auto-moderate: flag spam/profanity
- [ ] `GET /admin/testimonials` - List all testimonials (admin only)
- [ ] `PUT /admin/testimonials/{id}` - Approve/feature testimonials (admin only)
- [ ] `DELETE /admin/testimonials/{id}` - Delete testimonial (admin only)

#### Step 2.3: Frontend Components

**File**: `src/components/TestimonialsSection.jsx` (Update)
- [ ] Replace hardcoded testimonials with API fetch
- [ ] Add loading state with skeleton
- [ ] Display real user data with proper fallback avatar logic
- [ ] Keep existing grid layout for performance

**File**: `src/pages/AdminPanel.jsx` (Add section)
- [ ] Add "Testimonials Moderation" tab
- [ ] List all pending testimonials
- [ ] Approve/reject buttons with notifications
- [ ] Feature testimonials for homepage

**File**: `src/components/TestimonialForm.jsx` (New)
- [ ] Form to submit testimonials (on event detail page)
- [ ] Star rating picker
- [ ] Character count (10-500)
- [ ] Validation before submit
- [ ] Success message with moderation note

#### Step 2.4: Integration Points
- [ ] Add testimonial form to EventDetail page after RSVP
- [ ] Show recent testimonials on event detail (related testimonials)
- [ ] Update homepage hero: "Testimonials" section fetches from API

---

## 🛠️ Implementation Priority

| Phase | Component | Priority | Effort | Timeline |
|-------|-----------|----------|--------|----------|
| 1 | Real-time countdown timers | HIGH | Medium | 3-4 hours |
| 1 | Auto-refresh logic | HIGH | Low | 1-2 hours |
| 2 | Testimonial DB schema | HIGH | Low | 1 hour |
| 2 | Testimonial API endpoints | HIGH | Medium | 2-3 hours |
| 2 | Dynamic testimonials on frontend | MEDIUM | Medium | 2-3 hours |
| 2 | Admin moderation panel | MEDIUM | Medium | 2-3 hours |
| 2 | Testimonial submission form | MEDIUM | Low | 1-2 hours |

**Total Estimated Time**: 15-22 hours

---

## 📝 File Checklist

### Backend Changes
- [ ] `backend/app/models/event.py` - Add `time_until_start` computed field
- [ ] `backend/app/models/testimonial.py` - NEW: Testimonial model
- [ ] `backend/app/api/api_v1/endpoints/events.py` - Add `/happening-now` endpoint
- [ ] `backend/app/api/api_v1/endpoints/testimonials.py` - NEW: Testimonial endpoints
- [ ] `backend/migrations/versions/add_testimonials_*.py` - NEW: Migration
- [ ] `backend/app/schemas/*.py` - Response schemas for testimonials

### Frontend Changes
- [ ] `src/components/WhatsHappeningNow.jsx` - Real-time updates
- [ ] `src/components/CountdownTimer.jsx` - NEW: Timer component
- [ ] `src/components/TestimonialsSection.jsx` - Dynamic data loading
- [ ] `src/components/TestimonialForm.jsx` - NEW: Submission form
- [ ] `src/pages/AdminPanel.jsx` - Testimonials moderation tab
- [ ] `src/pages/EventDetail.jsx` - Add testimonial form + related testimonials
- [ ] `src/services/api.js` - Add testimonials API methods

---

## 🧪 Testing Strategy

### Backend Testing
```python
# backend/tests/test_real_time_events.py
def test_happening_now_endpoint()
def test_countdown_accuracy()
def test_attendee_count_real_time()

# backend/tests/test_testimonials.py
def test_create_testimonial()
def test_approve_testimonial()
def test_list_featured_testimonials()
def test_moderation_workflow()
```

### Frontend Testing
```jsx
// src/__tests__/WhatsHappeningNow.test.jsx
describe('Real-time updates', () => {
  test('countdown updates every second')
  test('auto-refresh every 30 seconds')
  test('urgency styling changes correctly')
})

// src/__tests__/TestimonialsSection.test.jsx
describe('Dynamic testimonials', () => {
  test('fetches from API')
  test('displays featured testimonials')
  test('shows loading state')
})
```

---

## 🚀 Deployment Notes

### Pre-Deployment
- [ ] Run all tests (backend + frontend)
- [ ] Performance test: Load test with many events/testimonials
- [ ] UX review: Verify urgency indicators are clear
- [ ] Accessibility: Test screen readers for countdown timers

### Post-Deployment
- [ ] Monitor "What's Happening Now" real-time accuracy
- [ ] Gather testimonial submissions
- [ ] Review admin moderation load
- [ ] Collect user feedback on UX improvements

### Rollback Plan
```bash
# If real-time updates cause issues:
git revert <commit_hash>

# If testimonials have problems:
git revert <commit_hash>
```

---

## 💡 Nice-to-Have Enhancements (Post-MVP)

1. **WebSocket streaming** for real-time updates (vs polling)
2. **Analytics dashboard** for testimonial metrics
3. **Email notifications** for upcoming events
4. **Calendar sync** for events happening soon
5. **AI moderation** for testimonials using sentiment analysis
6. **Testimonial carousel** on homepage with auto-play

---

## 📞 Questions & Clarifications

- Should testimonials require event attendance verification?
- How often should "What's Happening Now" update? (30s? 60s? On-demand?)
- Should we highlight events the user already RSVP'd to?
- Do we need testimonial images/attachments?

---

**Document Created**: December 29, 2025  
**Last Updated**: December 29, 2025  
**Status**: Ready for Implementation

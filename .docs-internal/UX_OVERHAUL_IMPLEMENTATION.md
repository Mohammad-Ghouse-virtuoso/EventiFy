# EventiFy UX Overhaul - Implementation Plan

## 🎯 Goal
Transform EventiFy from a friction-heavy dual-account model to a seamless, unified experience that impresses first-time visitors and converts them to users.

---

## Phase 1: Unified Account Model ✅ COMPLETE

### Backend Changes

#### 1.1 Remove role restrictions for event creation ✅
- **File:** `backend/app/api/api_v1/endpoints/events.py`
- **Change:** Replace `require_organizer_or_admin` with `get_current_active_user` for POST `/events` and `/events/upload`
- **Logic:** Any authenticated user can create events

#### 1.2 Update auth endpoint to default role ✅
- **File:** `backend/app/api/api_v1/endpoints/auth.py`
- **Change:** Always set `role=UserRole.ATTENDEE` on registration (ignore frontend role param)
- **Rationale:** Role becomes contextual - you're organizer of YOUR events

#### 1.3 Keep UserRole enum (for admin functionality) ✅
- Admin role still needed for admin panel
- Role check only for `/admin` routes

### Frontend Changes

#### 1.4 Remove role selection from Register page ✅
- **File:** `src/pages/Register.jsx`
- **Change:** Remove the role dropdown, everyone registers as user

#### 1.5 Update App.jsx route guards ✅
- **File:** `src/App.jsx`
- **Change:** 
  - `/create-event` → Allow any authenticated user
  - `/event-analytics` → Allow any authenticated user (filter shows only their events)
  - Keep `/admin` as admin-only

#### 1.6 Update Navbar for unified experience ✅
- **File:** `src/components/Navbar.jsx`
- **Change:** Show "Create Event" to all logged-in users (not just organizers)

---

## Phase 2: Guest Browsing (No Login Required) ✅ COMPLETE

### Backend Changes

#### 2.1 Ensure events list is public (already is) ✅
- **File:** `backend/app/api/api_v1/endpoints/events.py`
- **Verify:** GET `/events` has no auth requirement ✓

#### 2.2 Ensure event detail is public (already is) ✅
- **Verify:** GET `/events/{id}` has no auth requirement ✓

### Frontend Changes

#### 2.3 Remove RequireRole from Events and EventDetail ✅
- **File:** `src/App.jsx`
- **Verify:** Already public routes ✓

#### 2.4 Handle unauthenticated RSVP gracefully ✅
- **File:** `src/pages/EventDetail.jsx`
- **Change:** Show "Login to RSVP" button, redirect to login with return URL

#### 2.5 Handle unauthenticated bookmark gracefully ✅
- **File:** `src/pages/EventDetail.jsx`
- **Change:** Show bookmark icon, redirect to login with return URL on click

#### 2.6 Login page redirect support ✅
- **File:** `src/pages/Login.jsx`
- **Change:** Added `?redirect=` query param support, redirects after successful login

---

## Phase 3: Social Proof on Homepage ✅ COMPLETE

### Backend Changes

#### 3.1 Create stats endpoint ✅
- **File:** `backend/app/api/api_v1/endpoints/stats.py` (NEW)
- **Endpoints:**
  - `GET /stats/summary` → { total_events, events_this_month, total_users, total_rsvps }
  - `GET /stats/recent-activity` → List of recent RSVPs (anonymized: "Sarah R. just RSVP'd to Tech Meetup")
  - `GET /stats/trending` → Top 5 events by attendee count

#### 3.2 Register stats router ✅
- **File:** `backend/app/api/api_v1/api.py`
- **Change:** Add stats router

### Frontend Changes

#### 3.3 Create LiveStats component ✅
- **File:** `src/components/LiveStats.jsx` (NEW)
- **Display:** Animated counters for live event count, users, etc.

#### 3.4 Create RecentActivity component ✅
- **File:** `src/components/RecentActivity.jsx` (NEW)
- **Display:** Cycling feed of recent RSVPs with avatars

#### 3.5 Create TrendingEvents component ✅
- **File:** `src/components/TrendingEvents.jsx` (NEW)
- **Display:** Cards showing top events with attendee counts and ranking badges

#### 3.6 Update Home.jsx ✅
- **File:** `src/pages/Home.jsx`
- **Change:** Added LiveStats, RecentActivity, TrendingEvents sections

---

## Phase 4: Improved Landing Page ✅ COMPLETE

### 4.1 Update EventifyHeroCard ✅
- **File:** `src/components/EventifyHeroCard.jsx`
- **Changes:**
  - Dual CTAs: "Browse Events" (primary) + "Create Your Own" (secondary)
  - Added icon decorations to buttons
  - Secondary button with outline style

### 4.2 Add social proof strip below hero ✅
- **File:** `src/pages/Home.jsx`
- **Change:** Added LiveStats component below hero with gradient background

### 4.3 Improve landing page layout ✅
- Added trending events grid (2/3 width) 
- Added recent activity feed (1/3 width)
- Social proof section before ActiveEventsCarousel
- Show "X attending" on each card

---

## Implementation Order

1. ✅ Backend: Stats endpoint
2. ✅ Backend: Remove organizer role requirement for event creation
3. ✅ Backend: Default registration to attendee (ignore role param)
4. ✅ Frontend: Remove role dropdown from Register
5. ✅ Frontend: Update route guards in App.jsx
6. ✅ Frontend: Update Navbar to show Create Event for all users
7. ✅ Frontend: Add login redirect for RSVP/bookmark when unauthenticated
8. ✅ Frontend: Create LiveStats, RecentActivity, TrendingEvents components
9. ✅ Frontend: Update Home.jsx with new sections
10. ✅ Frontend: Update EventifyHeroCard with stats

---

## Files to Modify

### Backend
- `backend/app/api/api_v1/endpoints/events.py` - Remove role restrictions
- `backend/app/api/api_v1/endpoints/auth.py` - Force attendee role
- `backend/app/api/api_v1/endpoints/stats.py` - NEW
- `backend/app/api/api_v1/api.py` - Register stats router

### Frontend
- `src/pages/Register.jsx` - Remove role dropdown
- `src/App.jsx` - Update route guards
- `src/components/Navbar.jsx` - Show Create Event to all
- `src/pages/EventDetail.jsx` - Login redirect for RSVP
- `src/components/EventCard.jsx` - Login redirect for bookmark
- `src/components/LiveStats.jsx` - NEW
- `src/components/RecentActivity.jsx` - NEW
- `src/components/TrendingEvents.jsx` - NEW
- `src/pages/Home.jsx` - Add new sections
- `src/components/EventifyHeroCard.jsx` - Add stats

---

## Testing Checklist

- [ ] Guest can browse `/events` without login
- [ ] Guest can view `/events/:id` without login
- [ ] Guest clicking RSVP → redirected to login → returned after login
- [ ] Guest clicking bookmark → redirected to login
- [ ] New user registers → role is "attendee"
- [ ] Any logged-in user can access `/create-event`
- [ ] Any logged-in user can access `/event-analytics` (sees only their events)
- [ ] Homepage shows live stats
- [ ] Homepage shows recent activity
- [ ] Homepage shows trending events
- [ ] Admin panel still restricted to admin role

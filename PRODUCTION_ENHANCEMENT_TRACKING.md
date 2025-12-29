# Production Enhancement - Work Tracking

## 🎯 Current Session Goals

### 1. Evergreen Events System ✅ IN PROGRESS
**Goal:** Auto-populate 10-15 curated events with 340/400 (85%) NPC attendance

**Status:** Configuration & scripts created, pending database migration

**Files Created:**
- ✅ `EVERGREEN_EVENTS_IMPLEMENTATION.md` - Full implementation guide
- ✅ `backend/app/core/evergreen_config.py` - Organizer profiles & config
- ✅ `backend/scripts/populate_evergreen_events.py` - Population script

**Next Steps:**
1. Add `is_evergreen` boolean field to Event model  
2. Create database migration (`alembic revision --autogenerate -m "add_is_evergreen_field"`)
3. Run migration (`alembic upgrade head`)
4. Test script: `python backend/scripts/populate_evergreen_events.py`
5. Verify 15 events created with 340 NPCs each

---

### 2. Hide AI/NPC Labels 🔄 PENDING
**Goal:** Never show "AI created" or "NPC" labels on evergreen events

**Files to Update:**
- `src/components/EventCard.jsx` - Remove AI badge
- `src/components/EventDetails.jsx` - Hide NPC indicators  
- `src/components/WhatsHappeningNow.jsx` - Filter out AI labels

**Implementation:**
```jsx
// In EventCard.jsx - hide AI badge for evergreen events
{!event.is_evergreen && event.isAIGenerated && (
  <Badge>AI Generated</Badge>
)}

// In attendee lists - never show is_npc flag
{attendees.map(attendee => (
  <div>{attendee.full_name}</div>  // No "NPC" label
))}
```

---

### 3. Full Event Notification 🔄 PENDING
**Goal:** Show friendly message when event reaches 100% capacity

**Message:**  
"Ouch! You missed the spot, it's full. Check out other amazing events!"

**Files to Update:**
- `src/components/EventDetails.jsx` - Add capacity check
- `src/pages/EventDetailsPage.jsx` - Disable RSVP button when full

**Implementation:**
```jsx
const isFull = event.attendees_count >= event.max_attendees

{isFull ? (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-800 font-medium">
      Ouch! You missed the spot, it's full.
    </p>
    <p className="text-red-600 text-sm mt-1">
      Check out other amazing events!
    </p>
  </div>
) : (
  <RSVPButton event={event} />
)}
```

---

### 4. Testimonials Performance 🔄 PENDING
**Goal:** Fix laggy scroll & half-render issues

**Current File:** `src/components/TestimonialsSection.jsx`

**Issues:**
- Testimonials feel "stuck" when scrolling
- Appears half-way on screen
- Possible layout shift or animation lag

**Solutions to Try:**
1. **Add will-change for GPU acceleration:**
   ```css
   .testimonial-card {
     will-change: transform;
     transform: translateZ(0);
   }
   ```

2. **Use IntersectionObserver for smooth entry:**
   ```jsx
   const [isVisible, setIsVisible] = useState(false)
   const ref = useRef()
   
   useEffect(() => {
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting) {
           setIsVisible(true)
         }
       },
       { threshold: 0.1, rootMargin: '50px' }
     )
     
     if (ref.current) observer.observe(ref.current)
     return () => observer.disconnect()
   }, [])
   ```

3. **Reduce hover transitions:**
   ```css
   transition: all 0.15s ease-out; /* Faster than 200ms */
   ```

4. **Lazy load images with Intersection Observer**

---

## 📂 File Structure Overview

```
EventiFy/
├── EVERGREEN_EVENTS_IMPLEMENTATION.md  ✅ Created
├── PRODUCTION_ENHANCEMENT_TRACKING.md  ✅ This file
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── event.py                ⏳ Need to add is_evergreen field
│   │   ├── core/
│   │   │   ├── evergreen_config.py     ✅ Created
│   │   │   └── npc_generator_bulk.py   ✅ Already exists
│   │   └── api/api_v1/endpoints/
│   │       └── events.py               ⏳ Hide labels, capacity check
│   │
│   ├── scripts/
│   │   └── populate_evergreen_events.py ✅ Created
│   │
│   └── alembic/
│       └── versions/
│           └── XXXX_add_is_evergreen.py ⏳ Migration needed
│
└── src/
    ├── components/
    │   ├── EventCard.jsx               ⏳ Hide AI label
    │   ├── EventDetails.jsx            ⏳ Full event message
    │   └── TestimonialsSection.jsx     ⏳ Performance fixes
    └── pages/
        └── EventDetailsPage.jsx        ⏳ Disable RSVP when full
```

---

## 🔄 Work Sequence (For Offline Work)

### Session 1: Backend Setup ✅ DONE
- [x] Create evergreen configuration
- [x] Create population script  
- [x] Write implementation docs

### Session 2: Database Migration ⏳ NEXT
```bash
# 1. Update Event model (add is_evergreen field)
vim backend/app/models/event.py

# 2. Generate migration
cd backend
alembic revision --autogenerate -m "add is_evergreen to events"

# 3. Review migration file
cat alembic/versions/XXXX_add_is_evergreen.py

# 4. Apply migration
alembic upgrade head

# 5. Verify
sqlite3 eventify.db "PRAGMA table_info(event);"
```

### Session 3: Populate Events ⏳ PENDING
```bash
# Run population script
python backend/scripts/populate_evergreen_events.py

# Verify creation
sqlite3 eventify.db "SELECT id, title, max_attendees, is_evergreen FROM event WHERE is_evergreen = 1 LIMIT 5;"

# Count NPCs
sqlite3 eventify.db "SELECT event_id, COUNT(*) as npc_count FROM rsvp WHERE user_id < 0 GROUP BY event_id;"
```

### Session 4: Frontend Updates ⏳ PENDING
- [ ] Update EventCard - hide AI badges
- [ ] Update EventDetails - show full message
- [ ] Fix TestimonialsSection - performance
- [ ] Test UI locally

### Session 5: Testing & Deployment ⏳ PENDING
- [ ] Run backend tests: `pytest backend/tests`
- [ ] Build frontend: `npm run build`
- [ ] Test full flow end-to-end
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Deploy to Railway

---

## 📋 Quick Commands Reference

```bash
# Backend
cd backend
source .venv/bin/activate  # Activate virtualenv
alembic upgrade head       # Run migrations
python scripts/populate_evergreen_events.py  # Populate events
pytest tests/             # Run tests

# Frontend  
npm run dev               # Start dev server
npm run build             # Production build
npm run preview           # Preview build

# Database
sqlite3 eventify.db      # Open DB
.schema event            # View event schema
.tables                  # List tables
.quit                    # Exit

# Git
git add .
git commit -m "feat: evergreen events system"
git push origin main
```

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution:** Check alembic version table, rollback if needed
```bash
alembic downgrade -1
alembic upgrade head
```

### Issue: Events not appearing
**Check:**
1. `is_evergreen = True` in database
2. `start_time` is in the future
3. `is_active = True`

### Issue: NPCs not showing
**Check:**
1. RSVP records with negative user_ids exist
2. `inject_npcs_into_event()` was called
3. Frontend fetches RSVPs correctly

### Issue: Frontend shows "AI created"
**Fix:** Add conditional in EventCard:
```jsx
{!event.is_evergreen && event.isAIGenerated && <Badge>AI</Badge>}
```

---

## 🚀 Deployment Checklist

- [ ] All migrations applied (`alembic upgrade head`)
- [ ] Evergreen events populated (15 active)
- [ ] NPCs injected (340 per event)
- [ ] Frontend labels hidden (no "AI" or "NPC")
- [ ] Full event messaging working
- [ ] Testimonials scroll smoothly
- [ ] All tests passing (101/101)
- [ ] Commit message clear
- [ ] Pushed to GitHub
- [ ] Railway redeployed
- [ ] Production verified

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Evergreen events active | 15 | ⏳ 0 |
| NPCs per event | 340 | ⏳ 0 |
| Real user capacity | 60 (15%) | ⏳ N/A |
| AI labels hidden | 100% | ⏳ 0% |
| Testimonials scroll FPS | 60 | ⏳ Unknown |
| Full event message shown | Yes | ⏳ No |

---

**Last Updated:** December 29, 2025  
**Session Status:** IN PROGRESS (45% complete)  
**Next Step:** Add `is_evergreen` field to Event model & run migration

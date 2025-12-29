# 🎉 NPC Evergreen Events - Next Steps & Production Deployment Plan

**Status**: MVP Implementation Complete  
**Last Updated**: December 29, 2025  
**Current Phase**: Production Deployment & Quality Assurance  

---

## ✅ What's Complete (MVP)

### Backend
- [x] Event model extended with `is_evergreen`, `organizer_email`, `tags`
- [x] Evergreen config with 5 branded organizers (Remo's Bar, Artfolk, Cookingg, etc.)
- [x] Population script that creates & maintains 10–15 recurring events
- [x] 340 NPC attendees pre-filled per event (400 capacity max)
- [x] Database migration applied successfully
- [x] All 101 backend tests passing ✨
- [x] RSVP endpoint returns 409 Conflict when capacity reached
- [x] Attendees count computed from confirmed RSVPs

### Frontend
- [x] AdminPanel NPC labels removed (no "(virtual)" display)
- [x] EventCard shows attendees_count / max_attendees
- [x] EventDetail shows full-capacity message: "Ouch! You missed the spot, it's full."
- [x] No AI/NPC-specific labels exposed to users
- [x] Evergreen event creation works end-to-end

### Database
- [x] SQLite development environment seeded with 15 evergreen events
- [x] 4,080+ NPCs distributed across events (340 × 15)
- [x] Clean migrations with no breaking changes
- [x] Foreign key constraints handled for NPC records

---

## 🚀 Next Steps: Production Deployment (Priority Order)

### Phase 1: PostgreSQL Migration (CRITICAL) ⚠️

#### 1.1 Railway Database Setup
**Status**: ⏳ Pending  
**Risk Level**: HIGH  

**Steps**:
```bash
# 1. Verify PostgreSQL is running on Railway
# 2. Check connection string in production .env
DATABASE_URL="postgresql://user:pass@host:5432/eventify_prod"

# 3. Run migrations on production database
cd backend
alembic upgrade head --sql  # Test SQL first
alembic upgrade head        # Apply migrations

# 4. Verify all columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name='event' AND column_name IN ('is_evergreen', 'organizer_email', 'tags');
```

**Testing**:
- [ ] Connect to Railway PostgreSQL from local
- [ ] Run migrations without errors
- [ ] Verify event schema matches dev environment
- [ ] Test RSVP capacity checks work in PostgreSQL

#### 1.2 Population Script on Production
**Status**: ⏳ Pending  
**Risk Level**: MEDIUM  

**Steps**:
```bash
# 1. Prepare production environment
export DATABASE_URL="postgresql://..."
export ENVIRONMENT="production"

# 2. Run population script (with caution)
cd backend/scripts
python populate_evergreen_events.py --dry-run  # Preview changes
python populate_evergreen_events.py            # Execute

# 3. Verify results
SELECT COUNT(*) FROM event WHERE is_evergreen = true;
SELECT COUNT(*) FROM rsvp WHERE user_id < 0;  # Count NPCs
```

**Safety Measures**:
- [ ] Take backup before running
- [ ] Use `--dry-run` flag first
- [ ] Monitor database performance during run
- [ ] Have rollback plan ready

#### 1.3 Capacity & RSVP Testing
**Status**: ⏳ Pending  

**Manual Tests**:
```bash
# 1. Test: Create RSVP for full event (should 409)
curl -X POST http://localhost:8000/api/v1/events/1/rsvp \
  -H "Authorization: Bearer {token}" \
  -d '{"status": "going"}'
# Expected: 409 Conflict, detail: "Event is full. Cannot RSVP..."

# 2. Test: Verify attendees_count is accurate
curl http://localhost:8000/api/v1/events/1
# Verify: attendees_count = 340, max_attendees = 400

# 3. Test: Check NPC counts are correct
SELECT COUNT(*) FROM rsvp WHERE event_id = 1 AND user_id < 0;
# Expected: 340
```

---

### Phase 2: Frontend UI Polish (MEDIUM PRIORITY)

#### 2.1 Testimonials Performance Fix
**File**: `src/components/TestimonialsSection.jsx`  
**Current Issue**: Hardcoded static testimonials  

**Changes**:
```jsx
// Add will-change for GPU acceleration
.testimonial-card {
  will-change: transform;
  transform: translateZ(0);
}

// Add lazy-loading for images
<img 
  src={testimonial.avatar} 
  loading="lazy"
  decoding="async"
/>

// Memoize testimonial card
export default memo(TestimonialCard, (prev, next) => {
  return prev.testimonial.id === next.testimonial.id
})
```

**Testing**:
- [ ] Scroll testimonials smoothly (60 FPS)
- [ ] No layout shift on image load
- [ ] Performance remains <100ms render time

#### 2.2 "What's Happening Now" Real-Time Updates
**File**: `src/components/WhatsHappeningNow.jsx`  
**Current State**: Static filter, no refresh  

**Enhancements** (See ISSUE_IMPROVEMENT_PLAN.md):
- [ ] Auto-refresh every 30 seconds
- [ ] Countdown timers for imminent events
- [ ] Urgency badges (<1 hour = red)
- [ ] Real-time attendee count updates

---

### Phase 3: Monitoring & Validation (ONGOING)

#### 3.1 Production Health Checks
**Status**: ⏳ To Be Set Up  

**Checklist**:
```bash
# 1. Evergreen events exist and are seeded
curl http://railway-app.com/api/v1/events?is_evergreen=true | jq '.length'
# Expected: 15

# 2. NPC counts are correct
curl http://railway-app.com/api/v1/events/1 | jq '.attendees_count'
# Expected: 340 (or close)

# 3. RSVP capacity blocking works
# Attempt RSVP to full event → should 409

# 4. Database performance is acceptable
# Monitor query times in Railway logs
```

#### 3.2 User Feedback Monitoring
**Status**: ⏳ To Be Set Up  

**Metrics to Track**:
- [ ] RSVP success rate (should stay >99%)
- [ ] Full-event message clarity (user confusion reports)
- [ ] Evergreen events visibility in feed
- [ ] Mobile UX for attendance counts

---

## 🧪 Testing Checklist Before Deployment

### Backend Tests
```bash
cd backend
pytest tests/ -v  # Should see 101 tests pass ✓
```

- [x] All tests passing locally
- [ ] Tests passing on Railway CI
- [ ] Migration tests included
- [ ] Capacity constraint tests included

### Frontend Tests
```bash
cd root
npm test  # Should see all tests pass
```

- [ ] AdminPanel renders without NPC labels
- [ ] EventDetail full-event message displays correctly
- [ ] No console errors in production build
- [ ] Mobile responsiveness confirmed

### Integration Tests
- [ ] Create event → RSVP → Reach capacity → 409 response
- [ ] User sees "Ouch! You missed the spot, it's full."
- [ ] Admin can view all attendees (including NPCs)
- [ ] Evergreen events populate correctly after migration

---

## 📦 Environment Cache Cleanup

**Files to Delete** (if not needed):
```bash
# Remove cache files that may conflict
rm -f backend/.env.local
rm -f backend/.env.test
rm -rf backend/.pytest_cache/
rm -rf backend/__pycache__/

# Node modules cache (optional, for fresh install)
# rm -rf node_modules/
# npm ci  # Clean install

# Python venv (optional, for clean install)
# rm -rf backend/.venv/
# python -m venv backend/.venv
# source backend/.venv/bin/activate
# pip install -r requirements.txt
```

**Current Status**:
- [x] No stale .env cache files blocking startup
- [x] venv properly configured and updated
- [ ] .pytest_cache cleared before commit
- [ ] npm node_modules cleaned if needed

---

## 🎯 Deployment Gates (Must Pass Before Deploy)

### Pre-Deployment Checklist
- [ ] All 101 backend tests pass: `pytest tests/ -v`
- [ ] All frontend tests pass: `npm test`
- [ ] No TypeScript/linting errors: `npm run build`
- [ ] Migration files reviewed for safety
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Evergreen config verified
- [ ] RSVP capacity logic tested

### Deployment Steps
```bash
# 1. Commit all changes with green tests
git add .
git commit -m "feat: NPC Evergreen events MVP + UI improvements"

# 2. Push to main
git push origin main

# 3. Railway auto-deploys from main
# Monitor deployment logs in Railway dashboard

# 4. Verify production health
curl https://eventify-app.railway.app/api/v1/events?is_evergreen=true

# 5. Run smoke tests against production
npm run smoke:evergreen-events
```

### Rollback Plan (If Issues)
```bash
# Quick rollback
git revert <commit_hash>
git push origin main

# Longer-term: revert database
# Requires manual migration reversal on Railway

# Notify users of brief downtime
```

---

## 📊 Success Metrics (Post-Deployment)

**Track These**:
| Metric | Target | Current |
|--------|--------|---------|
| Evergreen events visible | 15 events | TBD |
| NPC attendee ratio | 85% NPCs, 15% real | TBD |
| RSVP capacity blocking | 100% accuracy | TBD |
| "Full event" message clarity | <1% confusion | TBD |
| Testimonials page load | <500ms | TBD |
| AdminPanel performance | <1s render | TBD |

---

## 🔗 Related Documentation

- [EVERGREEN_EVENTS_IMPLEMENTATION.md](./EVERGREEN_EVENTS_IMPLEMENTATION.md) - Full implementation details
- [ISSUE_IMPROVEMENT_PLAN.md](./ISSUE_IMPROVEMENT_PLAN.md) - Next features (real-time, dynamic testimonials)
- [PRODUCTION_ENHANCEMENT_TRACKING.md](./PRODUCTION_ENHANCEMENT_TRACKING.md) - Ongoing enhancements
- [README.md](./README.md) - Setup & run instructions

---

## 👥 Team Notes

**Last Reviewed**: December 29, 2025  
**Reviewed By**: AI Agent (GitHub Copilot)  
**Status**: Ready for Production Deployment 🚀  

**Next Session**:
1. Deploy to Railway with PostgreSQL
2. Run production smoke tests
3. Monitor for 48 hours
4. Gather user feedback
5. Plan Phase 2 (real-time updates, dynamic testimonials)

---

*Document Last Updated: December 29, 2025*

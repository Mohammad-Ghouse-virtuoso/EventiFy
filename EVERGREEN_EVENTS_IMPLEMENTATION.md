# Evergreen Events System - Implementation Guide

## 📋 Overview
Implement a production-ready evergreen events system that auto-populates high-quality recurring events with realistic NPC attendance for social proof.

---

## 🎯 Requirements

### 1. Evergreen Event Pool (10-15 Active Events)
- **Always Available:** 10-15 curated events at any time
- **Auto-Replenish:** When an event expires, generate a new one to maintain pool size
- **Branded Organizers:** Use trusted organizer profiles with recognizable branding

### 2. NPC Attendance Configuration
- **Capacity:** Set `max_attendees = 400` for all evergreen events
- **Pre-filled:** Inject **340 NPCs** (85% full)
- **Available Spots:** Leave **60 spots** (15%) for real users to join
- **Display Format:** Show as "340 attending" (never show "NPC" label)

### 3. Branded Organizer Profiles
Each organizer has a unique identity with banner images from "Organizers that trust us" section:

| Organizer | Theme | Banner Image | Event Types |
|-----------|-------|--------------|-------------|
| **Remo's Bar** | New Year events, Friday nights | 🍉 Watermelon | Nightlife, Parties, Social |
| **Artfolk** | Art shows & exhibitions | 🦋 Butterfly | Art, Gallery, Culture |
| **Cookingg** | Food stalls, music & more | 🍳 Pan & Fire | Food, Music, Community |
| **Giggling University** | University-related events | 🎓 Book & Grad Hat | Education, Workshops, Talks |
| **Daytona** | Racing events & audience | 🏍️ Bike | Sports, Racing, Spectator |

### 4. Full Event Handling
When event reaches 100% capacity (400/400):
- **UI Message:** "Ouch! You missed the spot, it's full. Check out other amazing events!"
- **Disable Join:** RSVP button becomes "Event Full"
- **Alternative Options:** Show similar events below

### 5. Privacy & Realism
- ❌ **Never** show "AI created" label on evergreen events
- ❌ **Never** show "NPC" label on attendee profiles
- ✅ Display NPCs as regular attendees (names only)
- ✅ Make events look organic and community-driven

---

## 🛠️ Implementation Checklist

### Phase 1: Database Schema & Models ✅
- [x] Event model supports `is_evergreen` flag
- [x] Event model has `organizer_email` for branded organizers
- [x] NPC injection system in place

### Phase 2: Evergreen Event Script 🔄
- [ ] Create `backend/scripts/populate_evergreen_events.py`
- [ ] Define 5 organizer profiles with branding
- [ ] Generate 10-15 event templates per organizer
- [ ] Schedule recurring patterns (e.g., "Every Friday", "Monthly")
- [ ] Set `max_attendees = 400` for all events
- [ ] Mark events with `is_evergreen = True`

### Phase 3: NPC Auto-Population 🔄
- [ ] Extend `inject_bulk_npcs_into_attendees()` for evergreen events
- [ ] Auto-inject **340 NPCs** when event is created
- [ ] Ensure NPCs are consistent per event (use event_id as seed)
- [ ] Leave 60 spots (15%) for real users

### Phase 4: Frontend Display 🔄
- [ ] Hide "AI created" badges for evergreen events
- [ ] Hide "NPC" labels in attendee lists
- [ ] Show attendance as "340 attending" (looks real)
- [ ] Display organizer banner images
- [ ] Add "Event Full" messaging

### Phase 5: Capacity Handling 🔄
- [ ] Check `attendees_count >= max_attendees` before RSVP
- [ ] Show custom full message: "Ouch! You missed the spot, it's full."
- [ ] Disable join button when full
- [ ] Suggest similar events

### Phase 6: Automation & Cron 🔄
- [ ] Setup cron job to run population script daily
- [ ] Monitor pool size (maintain 10-15 active events)
- [ ] Archive expired events
- [ ] Generate new events to replace expired ones

---

## 📂 File Structure

```
backend/
├── scripts/
│   ├── populate_evergreen_events.py   # Main evergreen script
│   └── cron_check_evergreen.py        # Daily maintenance job
├── app/
│   ├── models/
│   │   └── event.py                   # is_evergreen flag
│   ├── core/
│   │   ├── npc_generator_bulk.py      # Bulk NPC injection
│   │   └── evergreen_config.py        # Organizer profiles
│   └── api/api_v1/endpoints/
│       └── events.py                  # Hide labels, capacity check

frontend/
└── src/
    ├── components/
    │   ├── EventCard.jsx              # Hide AI/NPC labels
    │   ├── EventDetails.jsx           # Full event messaging
    │   └── OrganizerBanner.jsx        # Display organizer branding
    └── pages/
        └── EventsPage.jsx             # Filter evergreen events
```

---

## 🎨 Organizer Branding Assets

Store organizer banner images in:
```
backend/static/organizer_banners/
├── remos_bar_watermelon.png
├── artfolk_butterfly.png
├── cookingg_pan_fire.png
├── giggling_university_book_hat.png
└── daytona_bike.png
```

---

## 🔧 Configuration Example

```python
# backend/app/core/evergreen_config.py

EVERGREEN_ORGANIZERS = {
    "remos_bar": {
        "name": "Remo's Bar",
        "email": "events@remosbar.com",
        "banner": "remos_bar_watermelon.png",
        "theme": "🍉 New Year Parties & Friday Nights",
        "categories": ["nightlife", "music", "entertainment"],
        "event_templates": [
            {
                "title": "Friday Night Fever at Remo's",
                "description": "Join us every Friday for live DJ sets, signature cocktails, and an electrifying atmosphere!",
                "recurrence": "weekly_friday",
                "start_time": "21:00",
                "duration_hours": 4,
                "max_attendees": 400,
            },
            # More templates...
        ]
    },
    # More organizers...
}

EVERGREEN_CONFIG = {
    "pool_size": 15,           # Maintain 10-15 active events
    "npc_per_event": 340,      # 85% filled
    "max_capacity": 400,       # Total spots
    "available_spots": 60,     # 15% for real users
}
```

---

## 🚀 Deployment Steps

1. **Run Population Script:**
   ```bash
   cd backend
   python scripts/populate_evergreen_events.py
   ```

2. **Verify Events Created:**
   ```bash
   sqlite3 eventify.db "SELECT id, title, max_attendees, is_evergreen FROM event WHERE is_evergreen = 1;"
   ```

3. **Check NPC Injection:**
   ```bash
   python -c "from app.db.database import *; from app.models.rsvp import RSVP; from sqlmodel import Session, select, func; \
   with Session(engine) as s: print(s.exec(select(func.count(RSVP.id))).one())"
   ```

4. **Setup Cron (Railway/Production):**
   ```bash
   # Add to Railway cron or use scheduler
   0 2 * * * cd /app/backend && python scripts/cron_check_evergreen.py
   ```

5. **Frontend Deployment:**
   - Update EventCard to hide AI labels
   - Update EventDetails for full messaging
   - Deploy to production

---

## 📊 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Active evergreen events | 10-15 | TBD |
| Avg. NPC attendance per event | 340 | TBD |
| Real user joins (avg/event) | 10-50 | TBD |
| Events marked as full | < 20% | TBD |
| User satisfaction (no "AI" complaints) | 95%+ | TBD |

---

## 🐛 Troubleshooting

**Issue:** Events not appearing  
**Fix:** Check `is_evergreen = True` filter in events endpoint

**Issue:** NPCs showing as "NPC"  
**Fix:** Verify `is_npc` flag is hidden in frontend EventCard component

**Issue:** Events always full  
**Fix:** Reduce `npc_per_event` to 300-320 (75-80% capacity)

---

## 📝 Next Steps

1. Implement evergreen event population script ✅ (This doc)
2. Configure organizer profiles with branding
3. Setup NPC auto-injection for evergreen events
4. Update frontend to hide labels
5. Deploy and monitor

---

**Status:** 🟡 In Progress  
**Owner:** Development Team  
**Last Updated:** December 29, 2025

# NPC UI Fixes Summary

## Issues Fixed

### 1. ✅ Attendee Count Synchronization
**Problem**: Event cards showed `1/120` attendees instead of `61/120` even though backend had 60 NPCs configured.

**Root Cause**: The `attendees_count` field in `EventOut` only counted real RSVPs from the database, not including virtual NPCs.

**Solution**: Modified backend to include NPC counts in `attendees_count`:
- Updated `GET /api/v1/events` (list all events)
- Updated `GET /api/v1/events/{event_id}` (single event)
- Both endpoints now add `SPECIAL_NPC_COUNTS.get(event_id, 0)` to the real attendee count

**Files Modified**:
- `backend/app/api/api_v1/endpoints/events.py` (lines ~158-168 and ~207-211)

**Verification**:
```bash
curl http://127.0.0.1:8001/api/v1/events/17
# Output: "attendees_count": 61  (1 real + 60 NPCs)
```

---

### 2. ✅ Collapsible Attendee Lists
**Problem**: Admin Panel's "Who's going (upcoming)" section showed all 60+ attendees vertically, causing excessive scrolling ("scroll like a black hole").

**Solution**: Implemented collapsible attendee list with:
- Shows first 10 attendees by default
- "Show all X attendees" button to expand full list
- "Show less" button to collapse back
- Virtual NPCs are marked with "(virtual)" badge
- Handles email reveal toggle independently

**Features**:
- Clean UI with smooth transitions
- Clear visual indication of NPC vs real attendees
- Preserves existing "Show emails" functionality
- Only shows expand button if >10 attendees

**Files Modified**:
- `src/pages/AdminPanel.jsx` (lines ~393-417)

**UI Changes**:
```jsx
// Before: All attendees always visible
<ul>
  {confirmed.map(a => <li>{a.name}</li>)}
</ul>

// After: Collapsible with first 10 shown
<ul>
  {confirmed.slice(0, expanded ? all : 10).map(a => 
    <li>
      {a.name}
      {a.is_npc && <span>(virtual)</span>}
    </li>
  )}
</ul>
{confirmed.length > 10 && (
  <button onClick={toggle}>
    {expanded ? 'Show less' : `Show all ${confirmed.length} attendees`}
  </button>
)}
```

---

## Testing Results

### Event 17 (Heema's Choir Show)
- **Before**: Displayed `1/120` in event cards
- **After**: Displays `61/120` (1 real + 60 NPCs)
- **NPC Configuration**: `SPECIAL_NPC_COUNTS = {17: 60}`

### Admin Panel - Who's Going Section
- **Before**: Listed all 60+ attendees causing scroll issues
- **After**: Shows first 10, expandable to full list on demand
- **NPC Indication**: Virtual attendees marked with "(virtual)" badge

---

## Architecture Notes

### NPC Count Flow
```
SPECIAL_NPC_COUNTS (events.py line 17)
         ↓
Event endpoints calculate: real_count + npc_count
         ↓
EventOut.attendees_count = total_attendees
         ↓
Frontend displays: {event.attendees_count} / {event.max_attendees}
```

### NPC Display in RSVP Lists
```
GET /events/{id}/rsvps → inject_npcs_into_attendees()
         ↓
Returns: [...real_rsvps, ...npc_rsvps (with is_npc: true)]
         ↓
AdminPanel filters: status === 'going' || 'approved'
         ↓
UI shows: slice(0, 10) with expand button if > 10
```

---

## Configuration

To add NPCs to other events, update `SPECIAL_NPC_COUNTS`:
```python
# backend/app/api/api_v1/endpoints/events.py line ~17
SPECIAL_NPC_COUNTS = {
    17: 60,   # Heema's Choir Show
    25: 40,   # Example: Add 40 NPCs to Event 25
    30: 100,  # Example: Add 100 NPCs to Event 30
}
```

NPCs are:
- **Virtual**: No database records created
- **Deterministic**: Same names generated for each event based on event_id seed
- **Realistic**: 52 first names × 52 last names = 2,704 unique combinations
- **Identifiable**: Marked with `is_npc: true` flag and negative IDs

---

## Related Files

### Backend
- `/backend/app/api/api_v1/endpoints/events.py` - Event CRUD + NPC count integration
- `/backend/app/core/npc_generator.py` - Virtual attendee generation logic

### Frontend
- `/src/pages/AdminPanel.jsx` - Admin dashboard with collapsible attendee lists
- `/src/components/EventCard.jsx` - Event card display (uses attendees_count)
- `/src/pages/Events.jsx` - Events listing page (uses attendees_count)

---

## Future Enhancements

1. **Dynamic NPC Configuration**: Admin UI to set NPC counts per event
2. **NPC Toggle in UI**: Show/hide NPCs with filter button
3. **NPC Analytics**: Track how NPCs affect event popularity perception
4. **Custom NPC Names**: Allow organizers to configure custom name pools
5. **NPC Behavior**: Simulate realistic RSVP status distribution (going/maybe/not_going)

---

## Deployment Checklist

- [x] Backend changes tested locally
- [x] Frontend UI verified with 60+ attendees
- [x] Count synchronization confirmed (1/120 → 61/120)
- [x] Collapsible list tested with expand/collapse
- [x] NPC visual indicators working
- [ ] Update production SPECIAL_NPC_COUNTS if needed
- [ ] Monitor frontend performance with large attendee lists
- [ ] Consider lazy-loading attendee lists for events with 100+ attendees

---

*Last Updated: January 3, 2025*  
*Changes by: AI Agent via GitHub Copilot*

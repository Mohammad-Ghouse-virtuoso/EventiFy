# NPC Auto-Fill Bug Fix

## Issue Reported
Event 18 (Dexter & Rita's Wedding) was automatically filled with 69 NPCs (70 total including Jamie), even though it wasn't configured in `SPECIAL_NPC_COUNTS`. The system was auto-filling ALL events to max capacity.

## Root Cause
The `inject_npcs_into_attendees()` function was being called with `event_max=event.max_attendees` for **every event**, causing all events to be filled to capacity with NPCs regardless of whether they were configured in `SPECIAL_NPC_COUNTS`.

**Problematic Code** (events.py line ~641):
```python
rsvps_with_npcs = inject_npcs_into_attendees(
    event_id=event.id,
    real_attendees=rsvps_with_users,
    event_max=event.max_attendees,  # ❌ This filled EVERY event to max!
    force_npc_count=force_npc_count
)
```

## Solution Implemented

### 1. **Only Inject NPCs for Configured Events**
Modified the logic to check if `force_npc_count` exists before injecting NPCs:

**Fixed Code** (events.py lines ~636-650):
```python
# 🎭 Inject NPC attendees ONLY for events with specific NPC configuration
force_npc_count = SPECIAL_NPC_COUNTS.get(event.id)

if force_npc_count is not None:
    # Only inject NPCs if event is configured in SPECIAL_NPC_COUNTS
    rsvps_with_npcs = inject_npcs_into_attendees(
        event_id=event.id,
        real_attendees=rsvps_with_users,
        event_max=None,  # ✅ Don't auto-fill to max
        force_npc_count=force_npc_count
    )
else:
    # No NPCs for events not in SPECIAL_NPC_COUNTS
    rsvps_with_npcs = rsvps_with_users
```

### 2. **Adjusted Event 17 NPC Count**
Changed from 60 to 43 NPCs to achieve 45 total attendees (including 2 real RSVPs):

**Updated Configuration** (events.py line ~17):
```python
SPECIAL_NPC_COUNTS = {
    17: 43,  # Heema's Choir Show - 43 NPCs + 2 real (latha + Jamie) = 45 total
}
```

## Verification Results

### Event 17 (Heema's Choir Show)
```
✅ Browse View: 45/120 attendees
✅ RSVP List: 45 total (2 real + 43 NPCs)
✅ Real Attendees: latha Karu, Jamie Rhude
✅ NPCs: 43 virtual attendees
```

### Event 18 (Dexter & Rita's Wedding)
```
✅ Browse View: 1/70 attendees
✅ RSVP List: 1 total (1 real + 0 NPCs)
✅ Real Attendees: Jamie Rhude
✅ NPCs: 0 (not configured)
```

### Other Events
```
✅ All other events show only real RSVPs
✅ No unwanted auto-filling with NPCs
```

## Key Changes Summary

| File | Lines | Change |
|------|-------|--------|
| `backend/app/api/api_v1/endpoints/events.py` | 17 | Changed `17: 60` → `17: 43` |
| `backend/app/api/api_v1/endpoints/events.py` | 636-650 | Added conditional NPC injection (only if configured) |
| `backend/app/api/api_v1/endpoints/events.py` | 643 | Changed `event_max=event.max_attendees` → `event_max=None` |

## Behavior Changes

### Before Fix
- ❌ **Event 17**: Showed 61/120 (1 real + 60 NPCs)
- ❌ **Event 18**: Showed 70/120 (1 real + 69 NPCs) - **BUG!**
- ❌ **All events**: Auto-filled to max capacity

### After Fix
- ✅ **Event 17**: Shows 45/120 (2 real + 43 NPCs) - **As requested**
- ✅ **Event 18**: Shows 1/70 (1 real + 0 NPCs) - **Fixed!**
- ✅ **Other events**: Only show real RSVPs - **No auto-fill**

## Testing Commands

### Test Event Counts (Browse View)
```bash
curl -s http://127.0.0.1:8001/api/v1/events/17 | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"Event 17: {data['attendees_count']}/{data['max_attendees']}\")"
# Output: Event 17: 45/120

curl -s http://127.0.0.1:8001/api/v1/events/18 | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"Event 18: {data['attendees_count']}/{data['max_attendees']}\")"
# Output: Event 18: 1/70
```

### Test RSVP Lists (Admin Panel)
```bash
# Event 17
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/v1/auth/login -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=admin@eventify.com&password=admin123' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8001/api/v1/events/17/rsvps' | python3 -c "import sys, json; data = json.load(sys.stdin); npcs = sum(1 for r in data if r.get('is_npc')); print(f'Total: {len(data)}, Real: {len(data)-npcs}, NPCs: {npcs}')"
# Output: Total: 45, Real: 2, NPCs: 43

# Event 18
curl -s -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8001/api/v1/events/18/rsvps' | python3 -c "import sys, json; data = json.load(sys.stdin); npcs = sum(1 for r in data if r.get('is_npc')); print(f'Total: {len(data)}, Real: {len(data)-npcs}, NPCs: {npcs}')"
# Output: Total: 1, Real: 1, NPCs: 0
```

## Configuration Guide

### Adding NPCs to New Events
1. Find the event ID
2. Add to `SPECIAL_NPC_COUNTS` dictionary
3. Set NPC count = (desired total) - (real RSVPs)

**Example**:
```python
# backend/app/api/api_v1/endpoints/events.py line ~17
SPECIAL_NPC_COUNTS = {
    17: 43,   # Heema's Choir Show - 43 NPCs + 2 real = 45 total
    18: 44,   # Dexter & Rita's Wedding - 44 NPCs + 1 real = 45 total (if wanted)
    25: 30,   # Some Event - 30 NPCs
}
```

### Removing NPCs from Event
Simply remove the event ID from `SPECIAL_NPC_COUNTS` dictionary and restart backend.

## Impact

### User-Facing
- ✅ Event cards now show accurate attendee counts
- ✅ Admin panel shows correct RSVP breakdowns
- ✅ No phantom attendees in unconfigured events
- ✅ Clear "(virtual)" badges on NPCs

### Developer-Facing
- ✅ Explicit opt-in for NPC injection (no surprises)
- ✅ Easy to add/remove NPCs per event
- ✅ Predictable behavior (no auto-fill logic)
- ✅ Clear separation: configured events vs regular events

## Prevention

To avoid this issue in future:
1. ✅ **Conditional injection**: Only inject NPCs when explicitly configured
2. ✅ **No auto-fill**: Don't pass `event_max` unless needed
3. ✅ **Explicit counts**: Use `force_npc_count` for precise control
4. ✅ **Documentation**: Clear comments on NPC injection logic

## Related Files
- `/backend/app/api/api_v1/endpoints/events.py` - Event endpoints + NPC config
- `/backend/app/core/npc_generator.py` - NPC generation logic
- `/src/pages/AdminPanel.jsx` - Admin RSVP display (already has collapsible UI)
- `/NPC_UI_FIXES_SUMMARY.md` - Previous NPC UI fix documentation
- `/NPC_FIXES_VERIFICATION.md` - Previous verification report

---

**Status**: ✅ **FIXED AND VERIFIED**  
**Date**: January 3, 2025  
**Fixed By**: AI Agent (GitHub Copilot)

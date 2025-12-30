# Event Repopulation Automation - Implementation Summary

## ✅ Completed Implementation

Automated daily repopulation of expired evergreen events with fresh banners and NPC attendees.

### What Was Built

1. **Event Model Updates** ([app/models/event.py](backend/app/models/event.py))
   - Added `timezone: Optional[str] = "UTC"` field (IANA timezone like "America/Chicago")
   - Added `last_refreshed_at: Optional[datetime]` field (tracks last refresh)

2. **Banner Pool Service** ([app/services/banner_pool.py](backend/app/services/banner_pool.py))
   - Extracted shared `CATEGORY_IMAGE_POOLS` dictionary
   - Function `get_image_for_category(category: str) -> str`
   - Used by both manual script and scheduler

3. **Event Scheduler** ([app/services/event_scheduler.py](backend/app/services/event_scheduler.py))
   - APScheduler-based daily job (default: 00:15 UTC)
   - Logic: Find expired evergreen events, clear NPC RSVPs, add fresh NPCs, update banner, roll dates forward 7 days
   - NPC fill rule: 75% for ≤250 capacity, 80% for >250
   - Respects `max_attendees` and existing real attendees

4. **Configuration** ([app/core/config.py](backend/app/core/config.py))
   - `REFRESH_JOB_ENABLED` (default: true)
   - `REFRESH_CRON_HOUR` (default: 0)
   - `REFRESH_CRON_MINUTE` (default: 15)
   - `REFRESH_MAX_EVENTS` (default: 100)

5. **FastAPI Integration** ([app/main.py](backend/app/main.py))
   - Scheduler starts on app startup
   - Graceful shutdown on app exit

6. **Database Migration** ([scripts/migrate_event_scheduler_fields.py](backend/scripts/migrate_event_scheduler_fields.py))
   - Adds `timezone` and `last_refreshed_at` columns
   - SQLite-compatible (ALTER TABLE)

7. **Dependencies** ([requirements.txt](backend/requirements.txt))
   - `apscheduler>=3.10.4`
   - `pytz>=2024.1`

### How It Works

1. **Daily Trigger**: Job runs at 00:15 UTC (configurable)
2. **Selection**: Finds events where:
   - `is_evergreen = True`
   - `event_end < now` (expired)
   - `last_refreshed_at < today` (not refreshed today)
3. **Refresh Process** (per event):
   - Assign new banner from category pool
   - Delete all existing NPC RSVPs
   - Calculate target NPC count (75% or 80% of capacity, minus real attendees)
   - Add random NPCs from npc_seed pool
   - Roll event dates forward 7 days
   - Set `is_active = True` and `last_refreshed_at = now`
4. **Safety**: Max 100 events per run, idempotent (won't re-process same day)

### Deployment Checklist

- [ ] Run migration: `python backend/scripts/migrate_event_scheduler_fields.py`
- [ ] Install deps: `pip install -r backend/requirements.txt`
- [ ] Verify config: `REFRESH_JOB_ENABLED=true` (default)
- [ ] Deploy backend
- [ ] Check logs: `✅ Event repopulation scheduler started (runs daily at 00:15 UTC)`

### Configuration Options

```bash
# Enable/disable scheduler
REFRESH_JOB_ENABLED=true

# Schedule (UTC)
REFRESH_CRON_HOUR=0
REFRESH_CRON_MINUTE=15

# Safety limit
REFRESH_MAX_EVENTS=100
```

### Monitoring

Look for these log entries:
```
🔄 Starting event repopulation job...
📋 Found X expired events to refresh
👥 Found Y NPC users available
  ✓ Event Z (...): +N NPCs
✅ Repopulation complete: X events refreshed, Y NPCs added
```

### Files Modified/Created

**New Files:**
- `backend/app/services/banner_pool.py`
- `backend/app/services/event_scheduler.py`
- `backend/scripts/migrate_event_scheduler_fields.py`
- `backend/docs/repopulation_scheduler.md`

**Modified Files:**
- `backend/app/models/event.py` (added timezone, last_refreshed_at)
- `backend/app/core/config.py` (added scheduler settings)
- `backend/app/main.py` (integrated scheduler startup/shutdown)
- `backend/requirements.txt` (added apscheduler, pytz)
- `backend/scripts/refresh_unsplash_banners.py` (uses shared helper)

### Next Steps (Optional Enhancements)

- [ ] Admin endpoint for manual trigger (`/admin/refresh-expired`)
- [ ] Use event timezone for local expiry calculation (currently UTC)
- [ ] Add metrics/observability dashboard
- [ ] Distributed lock for multi-replica deployments
- [ ] Email notifications on refresh completion

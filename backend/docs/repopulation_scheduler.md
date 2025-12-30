# Automated Event Repopulation (Banners + NPCs)

This guide describes how to automate daily repopulation of banners and NPC attendees for expired events. It reuses the existing category-based Unsplash pools and npc_seed users.

## Goals
- Daily job picks expired events and refreshes their banner images (category-appropriate).
- NPC attendees are re-assigned automatically to keep attendance healthy.
- No manual script runs needed (no shell steps each day).
- Safe by default: limited scope, idempotent per day, logged.

## Data & Building Blocks
- **Banner pools**: `app/services/banner_pool.py` holds `CATEGORY_IMAGE_POOLS` and `get_image_for_category`. Shared by manual script and scheduler.
- **Events**: `event.image` stores the banner URL. Categories map to pools. New fields: `timezone` (IANA string), `last_refreshed_at` (datetime).
- **NPC users**: npc_seed accounts (email pattern `npcXXXXX@eventify.local`) exist in the DB and can be re-used as attendees.

## Architecture (Implemented)
1) **Scheduler**: APScheduler inside FastAPI (runs on startup). A daily job (default 00:15 UTC) triggers refresh.
2) **Selection**: Find events where `is_evergreen=True`, `event_end < now`, and not refreshed today (`last_refreshed_at < today`).
3) **Banner refresh**: For each selected event, pick a random URL from its category pool; write to `event.image`.
4) **NPC auto-fill**:
   - Rule: 75% fill for events ≤250 capacity; 80% for larger events.
   - Clear existing NPC RSVPs.
   - Add fresh NPCs (random sample from npc_seed users) respecting `max_attendees` and existing real attendees.
5) **Event date rollover**: Move event dates forward 7 days from expiry; preserve duration.
6) **Audit**: Record `last_refreshed_at = now`; set `is_active = True` to show event again.
7) **Config**: Env flags control enable/disable, run time, max events per run.

## NPC Fill Policy (Confirmed)
- **75% of max_attendees** for events with capacity ≤250.
- **80% of max_attendees** for events with capacity >250.
- Never exceed `max_attendees`; subtract existing real (non-NPC) attendees before adding NPCs.
- All existing NPC RSVPs are cleared before re-assignment to ensure fresh attendance.

## Implementation Files
- `app/services/banner_pool.py`: Shared category image pool helper.
- `app/services/event_scheduler.py`: APScheduler job definition and lifecycle.
- `app/core/config.py`: Settings for scheduler (enabled, cron time, max events).
- `app/main.py`: Integrates scheduler startup/shutdown hooks.
- `app/models/event.py`: Event model with `timezone` and `last_refreshed_at` fields.
- `scripts/migrate_event_scheduler_fields.py`: DB migration to add new columns.
- `scripts/refresh_unsplash_banners.py`: Updated to use shared helper.

## Configuration (Environment Variables)
- `REFRESH_JOB_ENABLED`: Enable/disable scheduler (default: `true`).
- `REFRESH_CRON_HOUR`: Hour to run job (0-23, default: `0`).
- `REFRESH_CRON_MINUTE`: Minute to run job (0-59, default: `15`).
- `REFRESH_MAX_EVENTS`: Safety limit per run (default: `100`).

## Deployment Steps
1. **Run migration**: `python backend/scripts/migrate_event_scheduler_fields.py`
2. **Install dependencies**: `pip install -r backend/requirements.txt` (adds apscheduler, pytz)
3. **Configure env**: Set `REFRESH_JOB_ENABLED=true` (enabled by default)
4. **Deploy**: Restart API server; scheduler starts automatically on startup
5. **Verify**: Check logs for `✅ Event repopulation scheduler started (runs daily at HH:MM UTC)`

## Safety & Observability
- Guarded by `REFRESH_JOB_ENABLED` env (can disable anytime).
- Daily idempotency: skip events already refreshed today (`last_refreshed_at >= today`).
- Structured logs (INFO level) with counts: events refreshed, NPCs added.
- Safety limit: max 100 events per run (configurable via `REFRESH_MAX_EVENTS`).
- Runs in UTC timezone to avoid DST surprises.

## Manual Trigger (Future)
- Optional admin endpoint `/admin/refresh-expired` could run the same job on-demand (protected by role or token).

## Answers to Open Questions
1. ✅ NPC fill rule: 75% for ≤250 capacity, 80% for >250.
2. ✅ Eligibility: Refresh only `is_evergreen=True` and expired events. Non-evergreen events are excluded.
3. ✅ Capacity cap: If real attendees exceed target, add zero NPCs.
4. ✅ Logging: Console logging (INFO level) with structured messages. No separate audit table (can be added later if needed).
5. ✅ Timezone: Job runs in UTC (configurable via cron settings). Event-local timezones stored in `event.timezone` field but not yet used for expiry calculation (future enhancement).

## Quick Runbook (Production)
- **Enable**: Set `REFRESH_JOB_ENABLED=true` (default) and deploy.
- **Default schedule**: Daily at 00:15 UTC.
- **Check logs**: Look for `🔄 Starting event repopulation job...` and `✅ Repopulation complete: X events refreshed, Y NPCs added`.
- **Disable**: Set `REFRESH_JOB_ENABLED=false` and redeploy.
- **Adjust time**: Set `REFRESH_CRON_HOUR` and `REFRESH_CRON_MINUTE` env vars.

## Example Log Output
```
2025-12-30 00:15:00 INFO 🔄 Starting event repopulation job...
2025-12-30 00:15:01 INFO 📋 Found 5 expired events to refresh
2025-12-30 00:15:01 INFO 👥 Found 50 NPC users available
2025-12-30 00:15:02 INFO   ✓ Event 17 (Art Gallery Opening): +38 NPCs
2025-12-30 00:15:02 INFO   ✓ Event 23 (Food Festival): +60 NPCs
2025-12-30 00:15:03 INFO ✅ Repopulation complete: 5 events refreshed, 203 NPCs added
```

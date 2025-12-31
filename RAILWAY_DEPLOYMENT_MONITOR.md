# Railway Deployment Monitoring Guide

## What Was Fixed
✅ PostgreSQL-incompatible migration script (was using SQLite-only commands)
✅ Missing automatic migration on startup
✅ Unsafe scheduler that could crash if columns don't exist
✅ No fallback handling for missing database columns

## Deployment Status
🚀 **Pushed to main**: Commit `62040954`
⏳ **Railway**: Auto-deployment in progress (2-5 minutes)

## Monitor These Railway Logs

### ✅ SUCCESS Indicators

**1. Migration Success**
```
🔄 Running database migrations...
Existing columns in 'event' table: [...]
Adding timezone column...
✅ Added timezone column
Adding last_refreshed_at column...
✅ Added last_refreshed_at column
✅ Database migrations completed
```

**2. Scheduler Started**
```
✅ Event repopulation scheduler started (runs daily at 00:15 UTC)
```

**3. App Healthy**
```
Application startup complete
Uvicorn running on http://0.0.0.0:8000
```

### ⚠️ WARNING Indicators (Non-Critical)

**If columns already exist:**
```
⏭️ timezone column already exists
⏭️ last_refreshed_at column already exists
✅ Migration complete!
```
This is OK! Means migration ran successfully before.

**If scheduler has fallback:**
```
⚠️ Column issue detected, using fallback query: ...
```
This is OK! Scheduler will work without the new columns.

### ❌ ERROR Indicators

**Database connection failure:**
```
Could not connect to database
Connection refused
```
→ Check PostgreSQL service status in Railway dashboard

**Migration completely failed:**
```
❌ Migration failed: ...
```
→ Check error details, may need manual intervention

**App won't start:**
```
ModuleNotFoundError
ImportError
```
→ Dependencies issue, check requirements.txt installation

## Verification Steps

### Step 1: Check Railway Logs (5 minutes after push)
1. Open Railway dashboard
2. Go to your backend service
3. Click "Deployments" → Latest deployment
4. Check logs for success indicators above

### Step 2: Test the Production Site
```bash
# Test events endpoint
curl https://your-railway-app.up.railway.app/api/v1/events?limit=10

# Should return JSON with events list
```

### Step 3: Verify Database Columns
From Railway PostgreSQL shell:
```sql
\d event
```
Should show:
- `timezone` column (VARCHAR(255))
- `last_refreshed_at` column (TIMESTAMP)

### Step 4: Check Event Count
```sql
SELECT COUNT(*) FROM event;
SELECT COUNT(*) FROM "user";
```

**Expected**: Should show your production data counts (not 0 or 5)

## If Still Seeing "Only Summer Music Festival"

### Possibility 1: Frontend Cache
Try hard refresh:
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` or `Cmd + Shift + R`

### Possibility 2: API Filtering Issue
Check network tab:
- Open DevTools (F12)
- Go to Network tab
- Load events page
- Check the API call to `/api/v1/events`
- Verify response has multiple events

### Possibility 3: Database Was Reset
If Railway created a new database, you'll need to:
1. Restore from backup (if available)
2. Or re-seed production data

**Check this SQL query:**
```sql
SELECT created_at, COUNT(*) FROM event GROUP BY created_at;
```

If all events have today's timestamp, database was reset.

## Emergency Rollback

If the deployment causes issues:

### Option 1: Disable Scheduler
In Railway environment variables:
```
REFRESH_JOB_ENABLED=false
```
Redeploy.

### Option 2: Revert to Previous Commit
```bash
git revert HEAD
git push origin main
```

### Option 3: Roll back on Railway Dashboard
1. Go to Deployments
2. Find previous working deployment (commit `747d1be6`)
3. Click "Redeploy"

## Next Steps

1. ⏰ **Now**: Monitor Railway deployment logs
2. ⏰ **5 min**: Verify app is running
3. ⏰ **10 min**: Test production site
4. ⏰ **15 min**: Verify events and users are visible
5. 📊 **Tomorrow 00:15 UTC**: Check if scheduler runs successfully

## Support Information

**If you see errors**, provide:
1. Railway deployment logs (full output)
2. Railway PostgreSQL connection test result
3. Event count from database
4. API response from `/api/v1/events?limit=1`

**Key Files Changed**:
- `backend/scripts/migrate_event_scheduler_fields.py` (PostgreSQL fix)
- `backend/app/main.py` (auto-migration)
- `backend/app/services/event_scheduler.py` (defensive code)

---
**Deployment Time**: 2025-12-30 21:05 UTC
**Commit**: 62040954
**Risk**: LOW
**Monitoring Required**: 15 minutes

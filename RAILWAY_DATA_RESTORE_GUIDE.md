# Railway Data Restore Guide

## Current Situation
✅ Railway deployment successful  
✅ Migration columns added (timezone, last_refreshed_at)  
✅ App is running and responding  
❌ **Only 5 sample events visible** (need to restore 20 events + 5111 NPCs)

## What We Have
- **Local Database**: 20 events, 5112 users, 5124 RSVPs
- **Railway Database**: ~5 events, ~5 users (sample data only)
- **Export File**: `production_data_export.sql` (2.3MB, 10,275 lines)

## Option 1: Import via Railway PostgreSQL Shell (RECOMMENDED)

### Step 1: Access Railway PostgreSQL
1. Go to Railway Dashboard
2. Click on your PostgreSQL service
3. Go to "Connect" tab
4. Copy the "Postgres Connection URL"

### Step 2: Upload SQL File
You have 3 options to upload:

**Option A: Via Railway CLI** (Easiest)
```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to PostgreSQL and import
railway run psql $DATABASE_URL < backend/production_data_export.sql
```

**Option B: Via psql directly**
```bash
# Use the connection URL from Railway dashboard
psql "postgresql://user:pass@host:port/database" < backend/production_data_export.sql
```

**Option C: Via Railway Dashboard SQL Editor**
1. In Railway PostgreSQL service → Data tab
2. Click "Query"
3. Copy-paste contents of `production_data_export.sql`
4. Execute (may timeout if too large - use Option A or B instead)

### Step 3: Verify Import
```sql
SELECT COUNT(*) as events FROM event;
SELECT COUNT(*) as users FROM "user";
SELECT title FROM event WHERE is_active = true LIMIT 10;
```

Expected results:
- Events: 20+
- Users: 5100+

## Option 2: Recreate from Scripts (Alternative)

If import doesn't work, we can run the population scripts directly on Railway:

### Step 1: Add Environment Variable to Railway
```
RUN_DATA_SEED=true
```

### Step 2: Create seed_railway_production.py script
(I can create this if you choose this option)

### Step 3: Run via Railway exec
```bash
railway run python backend/scripts/seed_railway_production.py
```

## Option 3: Quick Test with Fewer Events (Fast Test)

If you want to test quickly without full import:

```sql
-- Run this in Railway PostgreSQL shell
-- This will make some of the sample events evergreen so scheduler picks them up

UPDATE event SET is_evergreen = true WHERE id <= 5;
UPDATE event SET event_end = NOW() - INTERVAL '1 day' WHERE id <= 3;
```

This will make events "expired" so the scheduler refreshes them tomorrow.

## Troubleshooting

### Issue: "duplicate key value violates unique constraint"
**Solution**: The SQL uses `ON CONFLICT (id) DO NOTHING` which is safe. This means some records already exist.

### Issue: "relation does not exist"  
**Solution**: Make sure the migration ran successfully. Check Railway logs for "✅ Added timezone column".

### Issue: psql command not found
**Solution**: 
- **Option 1**: Use Railway CLI (`railway run psql`)
- **Option 2**: Install PostgreSQL client: `sudo apt install postgresql-client`
- **Option 3**: Use Railway dashboard SQL editor

### Issue: Import times out
**Solution**: Split the file into smaller chunks or use Railway CLI which has no timeout.

## After Import - Verification Checklist

1. **Check event count**:
   ```sql
   SELECT COUNT(*) FROM event;
   ```
   Should show 20+ events

2. **Check user count**:
   ```sql
   SELECT COUNT(*) FROM "user";
   ```
   Should show 5100+ users

3. **Check active events**:
   ```sql
   SELECT title, is_active, is_evergreen FROM event WHERE is_active = true;
   ```

4. **Test production site**:
   - Open your EventiFy URL
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Should see multiple events now

5. **Check API directly**:
   ```bash
   curl https://your-railway-app.up.railway.app/api/v1/events?limit=20
   ```

## Expected Timeline

- **Option 1 (Import SQL)**: 2-5 minutes
- **Option 2 (Scripts)**: 10-15 minutes  
- **Option 3 (Quick test)**: 30 seconds

## Next Steps

1. **Tell me which option you want to use**
2. **Run the import/seed**
3. **Report back the counts from PostgreSQL**
4. **Test the production site**

## Emergency: If Nothing Works

If all else fails, we can:
1. Disable the scheduler temporarily
2. Manually recreate the top 10-15 most important events via Railway dashboard
3. Let the scheduler handle the rest over time

---

**File Location**: `/home/mohx-nova/EventiFy/backend/production_data_export.sql`  
**Size**: 2.3MB  
**Contents**: 20 events, 5111 NPCs, 5124 RSVPs  
**Risk**: LOW (uses ON CONFLICT DO NOTHING - won't break existing data)

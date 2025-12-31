#!/bin/bash
# Railway Data Import Script
# This script imports the production data export to Railway PostgreSQL

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                               ║"
echo "║                     🚀 RAILWAY DATA IMPORT SCRIPT 🚀                          ║"
echo "║                                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI version: $(railway --version)"
echo ""

# Step 1: Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Authenticating with Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ~/.railway/config.json ]; then
    echo "✅ Railway credentials already configured"
else
    echo "🔐 Opening browser for Railway login..."
    echo ""
    echo "Please authenticate in the browser that opens."
    echo "If browser doesn't open, visit: https://railway.app/login"
    echo ""
    railway login || true
fi

echo ""

# Step 2: Link to project
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Linking to EventiFy project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd /home/mohx-nova/EventiFy

# Check if already linked
if [ -f .railway/config.json ]; then
    echo "✅ Project already linked"
else
    echo "🔗 Linking project..."
    railway link
fi

echo ""

# Step 3: Import data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Importing production data to Railway PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Importing:"
echo "  • 5,111 NPCs (users with npc*@eventify.local emails)"
echo "  • 20 Production events"
echo "  • 5,124 RSVPs"
echo ""
echo "⏱️  This will take 30-60 seconds..."
echo ""

railway run psql $DATABASE_URL < backend/production_data_export.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IMPORT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Verify import
echo "STEP 4: Verifying import..."
echo ""

echo "Checking event count..."
railway run psql $DATABASE_URL -c "SELECT COUNT(*) as events FROM event;" || echo "⚠️  Could not verify (no worries, let's check manually)"

echo ""

# Step 5: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Verify import in Railway PostgreSQL shell:"
echo ""
echo "   railway run psql \$DATABASE_URL"
echo ""
echo "   Then run these queries:"
echo "   SELECT COUNT(*) as events FROM event;"
echo "   SELECT COUNT(*) as users FROM \"user\";"
echo "   SELECT title FROM event WHERE is_active = true LIMIT 5;"
echo ""
echo "2. Test production site:"
echo "   • Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "   • You should now see all your events!"
echo ""
echo "3. Monitor scheduler:"
echo "   • Tomorrow at 00:15 UTC, scheduler will refresh expired evergreen events"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

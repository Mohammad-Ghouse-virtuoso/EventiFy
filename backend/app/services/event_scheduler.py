"""
Event Repopulation Scheduler

Automatically refreshes expired evergreen events with:
- New banner images from category-specific pools
- Fresh NPC attendees (75-85% of max_attendees)
- New event dates (7 days from expiry)

Runs daily at 00:15 server time (configurable).
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
import random
import pytz
from sqlmodel import Session, select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.database import get_session
from app.models.event import Event
from app.models.user import User
from app.models.rsvp import RSVP, RSVPStatus
from app.services.banner_pool import get_image_for_category
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configurable via environment variables
REFRESH_ENABLED = getattr(settings, "REFRESH_JOB_ENABLED", True)
REFRESH_CRON_HOUR = getattr(settings, "REFRESH_CRON_HOUR", 0)  # 00:00
REFRESH_CRON_MINUTE = getattr(settings, "REFRESH_CRON_MINUTE", 15)  # 00:15
REFRESH_MAX_EVENTS = getattr(settings, "REFRESH_MAX_EVENTS", 100)  # Safety limit
NPC_FILL_PERCENT_MIN = 75  # Minimum NPC fill percentage
NPC_FILL_PERCENT_MAX = 85  # Maximum NPC fill percentage
NPC_FILL_THRESHOLD = 250  # If max_attendees > 250, use 80% instead of random 75-85%


def get_local_now(timezone_str: str) -> datetime:
    """
    Get current time in the event's local timezone.
    
    Args:
        timezone_str: IANA timezone (e.g., "America/Chicago")
        
    Returns:
        datetime: Current time in the specified timezone
    """
    try:
        tz = pytz.timezone(timezone_str)
        return datetime.now(tz)
    except Exception:
        # Fallback to UTC
        return datetime.utcnow()


async def refresh_expired_events():
    """
    Main job: refresh expired evergreen events with new banners, NPCs, and dates.
    
    Process:
    1. Find expired evergreen events (event_end < now, is_evergreen=True)
    2. Skip already refreshed today (last_refreshed_at >= today)
    3. Assign new banner from category pool
    4. Clear existing NPC RSVPs
    5. Add fresh NPCs (75-85% fill, never exceed max_attendees)
    6. Update event dates (7 days from expiry)
    7. Mark as active and log
    """
    logger.info("🔄 Starting event repopulation job...")
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        now_utc = datetime.utcnow()
        today_utc = now_utc.date()
        
        # Find expired evergreen events not yet refreshed today
        # Use try-except for the query in case last_refreshed_at column doesn't exist yet
        try:
            expired_query = select(Event).where(
                Event.is_evergreen == True,
                Event.event_end < now_utc,
                (Event.last_refreshed_at == None) | (Event.last_refreshed_at < datetime(today_utc.year, today_utc.month, today_utc.day))
            ).limit(REFRESH_MAX_EVENTS)
            
            expired_events = session.exec(expired_query).all()
        except Exception as query_error:
            # If last_refreshed_at column doesn't exist, fall back to simpler query
            logger.warning(f"⚠️ Column issue detected, using fallback query: {str(query_error)}")
            expired_query = select(Event).where(
                Event.is_evergreen == True,
                Event.event_end < now_utc
            ).limit(REFRESH_MAX_EVENTS)
            expired_events = session.exec(expired_query).all()
        
        if not expired_events:
            logger.info("✅ No expired events to refresh")
            return
        
        logger.info(f"📋 Found {len(expired_events)} expired events to refresh")
        
        # Fetch all NPC users once (email pattern: npcXXXXX@eventify.local)
        npc_users = session.exec(
            select(User).where(User.email.like("npc%@eventify.local"))
        ).all()
        
        if not npc_users:
            logger.warning("⚠️  No NPC users found in database")
            return
        
        logger.info(f"👥 Found {len(npc_users)} NPC users available")
        
        refreshed_count = 0
        npc_added_total = 0
        
        for event in expired_events:
            try:
                # 1. Refresh banner
                new_banner = get_image_for_category(event.category or "general")
                event.image = new_banner
                
                # 2. Clear existing NPC RSVPs
                existing_npc_rsvps = session.exec(
                    select(RSVP).where(
                        RSVP.event_id == event.id,
                        RSVP.user_id.in_([u.id for u in npc_users])
                    )
                ).all()
                
                for rsvp in existing_npc_rsvps:
                    session.delete(rsvp)
                
                # 3. Count real (non-NPC) attendees
                real_attendees_count = session.exec(
                    select(RSVP).where(
                        RSVP.event_id == event.id,
                        RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
                        ~RSVP.user_id.in_([u.id for u in npc_users])
                    )
                ).all()
                
                real_count = len(real_attendees_count)
                
                # 4. Calculate NPC target
                # Rule: 75% base, or 80% if max_attendees > 250
                if event.max_attendees > NPC_FILL_THRESHOLD:
                    fill_percent = 80
                else:
                    fill_percent = NPC_FILL_PERCENT_MIN  # Use 75% as default
                
                target_total = int(event.max_attendees * (fill_percent / 100.0))
                npcs_needed = max(0, target_total - real_count)
                
                # Never exceed capacity
                npcs_needed = min(npcs_needed, event.max_attendees - real_count)
                
                if npcs_needed > 0:
                    # Shuffle and pick NPCs
                    available_npcs = random.sample(npc_users, min(npcs_needed, len(npc_users)))
                    
                    for npc_user in available_npcs:
                        new_rsvp = RSVP(
                            user_id=npc_user.id,
                            event_id=event.id,
                            status=RSVPStatus.GOING,
                            notes="Auto-generated attendance",
                            created_at=now_utc,
                            updated_at=now_utc,
                        )
                        session.add(new_rsvp)
                    
                    npc_added_total += len(available_npcs)
                    logger.info(f"  ✓ Event {event.id} ({event.title[:40]}): +{len(available_npcs)} NPCs")
                
                # 5. Update event dates (7 days forward from expiry)
                expiry_date = event.event_end or event.event_start
                new_start = expiry_date + timedelta(days=7)
                event_duration = (event.event_end - event.event_start) if event.event_end and event.event_start else timedelta(hours=2)
                new_end = new_start + event_duration
                
                event.event_start = new_start
                event.event_end = new_end
                
                # 6. Reactivate event
                event.is_active = True
                
                # Set last_refreshed_at if column exists
                try:
                    event.last_refreshed_at = now_utc
                except AttributeError:
                    # Column doesn't exist yet, skip it
                    pass
                
                session.add(event)
                refreshed_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error refreshing event {event.id}: {str(e)}")
                continue
        
        # Commit all changes
        session.commit()
        
        logger.info(f"✅ Repopulation complete: {refreshed_count} events refreshed, {npc_added_total} NPCs added")
        
    except Exception as e:
        logger.error(f"❌ Repopulation job failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


def start_scheduler():
    """Initialize and start the APScheduler instance."""
    global scheduler
    
    if not REFRESH_ENABLED:
        logger.info("🚫 Event repopulation scheduler is DISABLED (REFRESH_JOB_ENABLED=false)")
        return
    
    scheduler = AsyncIOScheduler()
    
    # Daily job at configured time (default: 00:15)
    trigger = CronTrigger(
        hour=REFRESH_CRON_HOUR,
        minute=REFRESH_CRON_MINUTE,
        timezone=pytz.UTC  # Use UTC to avoid DST issues
    )
    
    scheduler.add_job(
        refresh_expired_events,
        trigger=trigger,
        id="refresh_expired_events",
        name="Refresh expired evergreen events",
        replace_existing=True,
    )
    
    scheduler.start()
    logger.info(f"✅ Event repopulation scheduler started (runs daily at {REFRESH_CRON_HOUR:02d}:{REFRESH_CRON_MINUTE:02d} UTC)")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 Event repopulation scheduler stopped")

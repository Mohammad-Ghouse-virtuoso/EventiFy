"""
Evergreen Events Population Script
Maintains a pool of 10-15 high-quality recurring events with NPC attendance.

Run this script to:
1. Create initial pool of evergreen events
2. Ensure each organizer has active events
3. Pre-fill events with 340 NPCs (85% capacity)
4. Schedule events across next 2-4 weeks

Usage:
    python backend/scripts/populate_evergreen_events.py
    
Cron (daily check):
    python backend/scripts/populate_evergreen_events.py --maintenance
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

import random
from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from app.db.database import engine
from app.models.event import Event
from app.models.user import User
from app.models.rsvp import RSVP, RSVPStatus
from app.core.evergreen_config import (
    EVERGREEN_ORGANIZERS,
    EVERGREEN_CONFIG,
    get_all_event_templates,
)
from app.core.npc_generator_bulk import generate_bulk_npc_attendees
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_or_get_organizer(session: Session, organizer_key: str) -> User:
    """Create or retrieve organizer user account."""
    org_config = EVERGREEN_ORGANIZERS[organizer_key]
    
    # Check if organizer exists
    existing = session.exec(
        select(User).where(User.email == org_config["email"])
    ).first()
    
    if existing:
        logger.info(f"✓ Organizer exists: {org_config['name']}")
        return existing
    
    # Create new organizer
    organizer = User(
        email=org_config["email"],
        full_name=org_config["full_name"],
        hashed_password="$2b$12$dummy_hash_for_organizer_account",  # Dummy hash
        role="organizer",  # Set as organizer role
        is_active=True,
    )
    session.add(organizer)
    session.commit()
    session.refresh(organizer)
    
    logger.info(f"✓ Created organizer: {org_config['name']} ({org_config['email']})")
    return organizer


def generate_event_times(recurrence: str) -> tuple:
    """Generate start and end times for an event based on recurrence pattern."""
    now = datetime.utcnow()
    
    # Map recurrence to next occurrence
    if recurrence.startswith("weekly_"):
        day_name = recurrence.split("_")[1]
        day_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        target_day = day_map.get(day_name, 5)
        
        # Find next occurrence of that day
        days_ahead = target_day - now.weekday()
        if days_ahead <= 0:  # If today or past, schedule for next week
            days_ahead += 7
        
        start_date = now + timedelta(days=days_ahead)
    
    elif recurrence.startswith("biweekly_"):
        day_name = recurrence.split("_")[1]
        day_map = {"saturday": 5, "sunday": 6}
        target_day = day_map.get(day_name, 5)
        
        days_ahead = target_day - now.weekday()
        if days_ahead <= 0:
            days_ahead += 14
        else:
            days_ahead += 7  # Skip to next biweekly occurrence
        
        start_date = now + timedelta(days=days_ahead)
    
    elif recurrence.startswith("monthly_"):
        # Schedule 2 weeks from now for monthly events
        start_date = now + timedelta(days=14)
    
    elif recurrence == "yearly_newyear":
        # New Year's Eve - if past, schedule for next year
        current_year = now.year
        nye = datetime(current_year, 12, 31, 22, 0)
        if now > nye:
            nye = datetime(current_year + 1, 12, 31, 22, 0)
        start_date = nye
    
    else:
        # Default: 3-7 days from now
        start_date = now + timedelta(days=random.randint(3, 7))
    
    return start_date


def create_evergreen_event(
    session: Session,
    template: dict,
    organizer_id: int,
    city: str
) -> Event:
    """Create a single evergreen event from template."""
    
    # Generate event times
    event_start = generate_event_times(template["recurrence"])
    
    # Set specific time from template
    if template["start_time"]:
        event_start = event_start.replace(
            hour=template["start_time"].hour,
            minute=template["start_time"].minute,
            second=0,
            microsecond=0
        )
    
    event_end = event_start + timedelta(hours=template["duration_hours"])
    
    # Create event
    event = Event(
        title=f"{template['title']} - {city}",
        description=template["description"],
        category=template["category"],
        event_start=event_start,
        event_end=event_end,
        location=f"{template['organizer_name']}, {city}",
        organizer_id=organizer_id,
        organizer_email=template["organizer_email"],
        max_attendees=template["max_attendees"],
        is_active=True,
        is_evergreen=True,  # Mark as evergreen
        tags=",".join([
            template["category"],
            "evergreen",
            template["organizer_name"].lower().replace(" ", "_"),
            city.lower().replace(" ", "_")
        ]),
    )
    
    session.add(event)
    session.commit()
    session.refresh(event)
    
    logger.info(f"✓ Created event: {event.title} (ID: {event.id}, {event_start.strftime('%Y-%m-%d %H:%M')})")
    return event


def inject_npcs_into_event(session: Session, event: Event, npc_count: int = 340):
    """Inject NPCs as fake RSVPs for an evergreen event."""
    
    # Check if NPCs already exist for this event
    existing_npcs = session.exec(
        select(func.count(RSVP.id))
        .where(RSVP.event_id == event.id)
        .where(RSVP.user_id < 0)  # Negative IDs = NPCs
    ).one()
    
    if existing_npcs > 0:
        logger.info(f"⚠ Event {event.id} already has {existing_npcs} NPCs, skipping")
        return existing_npcs
    
    # Disable foreign key constraints temporarily for NPC insertion
    from sqlalchemy import text
    session.exec(text("PRAGMA foreign_keys=OFF"))
    
    # Generate NPCs
    npcs = generate_bulk_npc_attendees(event.id, npc_count)
    
    # Create RSVP records for each NPC
    rsvp_objects = []
    for npc in npcs:
        rsvp = RSVP(
            id=npc["id"],  # Use negative ID from NPC
            user_id=npc["user_id"],  # Negative user_id
            event_id=event.id,
            status=RSVPStatus.GOING,
            notes=None,
            checked_in=False,
        )
        rsvp_objects.append(rsvp)
    
    # Bulk insert (faster for 340 records)
    session.add_all(rsvp_objects)
    session.commit()
    
    # Re-enable foreign key constraints
    session.exec(text("PRAGMA foreign_keys=ON"))
    session.commit()
    
    logger.info(f"✓ Injected {len(rsvp_objects)} NPCs into event {event.id}")
    return len(rsvp_objects)


def populate_evergreen_events(maintenance_mode=False):
    """Main function to populate evergreen events."""
    logger.info("🚀 Starting evergreen events population...")
    
    with Session(engine) as session:
        # Count existing evergreen events
        existing_count = session.exec(
            select(func.count(Event.id))
            .where(Event.is_evergreen == True)
            .where(Event.event_start > datetime.utcnow())  # Only future events
        ).one()
        
        logger.info(f"📊 Current evergreen events: {existing_count}")
        
        target_count = EVERGREEN_CONFIG["pool_size"]
        needed = target_count - existing_count
        
        if needed <= 0:
            logger.info(f"✅ Pool is healthy ({existing_count}/{target_count}). No action needed.")
            if not maintenance_mode:
                logger.info("Run with --maintenance to force replenishment check.")
            return
        
        logger.info(f"📝 Need to create {needed} more events to reach target of {target_count}")
        
        # Get all templates
        templates = get_all_event_templates()
        cities = EVERGREEN_CONFIG["cities"]
        
        # Shuffle to randomize selection
        random.shuffle(templates)
        random.shuffle(cities)
        
        created_count = 0
        
        for i in range(needed):
            # Round-robin through templates and cities
            template = templates[i % len(templates)]
            city = cities[i % len(cities)]
            
            # Create or get organizer
            organizer = create_or_get_organizer(session, template["organizer_key"])
            
            # Create event
            event = create_evergreen_event(
                session=session,
                template=template,
                organizer_id=organizer.id,
                city=city
            )
            
            # Inject NPCs (340 fake attendees)
            inject_npcs_into_event(
                session=session,
                event=event,
                npc_count=EVERGREEN_CONFIG["npc_per_event"]
            )
            
            created_count += 1
            
            # Safety: don't create too many in one run
            if created_count >= 20:
                logger.warning("⚠ Created 20 events, stopping to prevent overflow")
                break
        
        # Final count
        final_count = session.exec(
            select(func.count(Event.id))
            .where(Event.is_evergreen == True)
            .where(Event.event_start > datetime.utcnow())
        ).one()
        
        logger.info(f"✅ Evergreen events population complete!")
        logger.info(f"📊 Final count: {final_count}/{target_count}")
        logger.info(f"✨ Created {created_count} new events with {EVERGREEN_CONFIG['npc_per_event']} NPCs each")


def cleanup_expired_events():
    """Clean up past evergreen events (optional maintenance)."""
    logger.info("🧹 Cleaning up expired evergreen events...")
    
    with Session(engine) as session:
        expired = session.exec(
            select(Event)
            .where(Event.is_evergreen == True)
            .where(Event.event_end < datetime.utcnow())
        ).all()
        
        if not expired:
            logger.info("✓ No expired events to clean")
            return
        
        for event in expired:
            # Delete associated RSVPs first
            session.exec(
                select(RSVP).where(RSVP.event_id == event.id)
            ).all()
            session.delete(event)
        
        session.commit()
        logger.info(f"✓ Cleaned up {len(expired)} expired events")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate evergreen events")
    parser.add_argument(
        "--maintenance",
        action="store_true",
        help="Run maintenance mode (cleanup + replenish)"
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Only cleanup expired events"
    )
    
    args = parser.parse_args()
    
    if args.cleanup:
        cleanup_expired_events()
    elif args.maintenance:
        cleanup_expired_events()
        populate_evergreen_events(maintenance_mode=True)
    else:
        populate_evergreen_events()

from __future__ import annotations

"""
Reset and seed events for Oct 5–10, 2025.

Actions:
- Delete ALL existing RSVPs, Comments tied to events, and Events
- Ensure an admin user exists
- Create fresh events spanning Oct 5..10, 2025 across all dropdown categories,
  including specific Indian and Western festival events
- Assign organizer_id to the Admin user for all new events ("give access to admin")
- Attach external cover images (Unsplash) for rich cards; thumbnails left None

Run:
  cd backend && ENVIRONMENT=dev .venv/bin/python scripts/reset_seed_oct_2025_events.py

Safe to run multiple times (purges everything then re-inserts a fixed set).
"""

import os
import sys
from typing import List, Dict
from datetime import datetime, timedelta

# Ensure backend package import works when run as a script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from sqlmodel import Session, select

from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.comment import Comment
from app.core.auth import get_password_hash


def ensure_admin(session: Session) -> User:
    admin = session.exec(select(User).where(User.role == UserRole.ADMIN)).first()
    if admin:
        return admin
    admin = session.exec(select(User).where(User.email == "admin@eventify.com")).first()
    if admin:
        # Backfill role if needed
        admin.role = UserRole.ADMIN
        session.add(admin)
        session.commit()
        session.refresh(admin)
        return admin
    # Create a default admin
    admin = User(
        email="admin@eventify.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash("admin123"),
        is_active=True,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


def purge_all_events(session: Session) -> Dict[str, int]:
    # Gather all event ids
    events = session.exec(select(Event)).all()
    if not events:
        return {"events": 0, "rsvps": 0, "comments": 0}
    event_ids = [e.id for e in events if e.id is not None]

    # Delete comments linked to these events
    comments = session.exec(select(Comment).where(Comment.event_id.in_(event_ids))).all()
    for i, c in enumerate(comments, 1):
        session.delete(c)
        if i % 200 == 0:
            session.flush()

    # Delete RSVPs linked to these events
    rsvps = session.exec(select(RSVP).where(RSVP.event_id.in_(event_ids))).all()
    for j, r in enumerate(rsvps, 1):
        session.delete(r)
        if j % 200 == 0:
            session.flush()

    # Commit child deletions first to satisfy FK constraints (SQLite ordering can vary)
    session.commit()

    # Delete events in a second phase
    events2 = session.exec(select(Event)).all()
    for k, ev in enumerate(events2, 1):
        session.delete(ev)
        if k % 200 == 0:
            session.flush()
    session.commit()
    return {"events": len(events2), "rsvps": len(rsvps), "comments": len(comments)}


def build_events_payload(admin_id: int) -> List[Dict]:
    # Fixed base date range (UTC). Oct 5–10, 2025.
    # We'll place multiple events across these six days at friendly times.
    days = [
        datetime(2025, 10, 5, 11, 0),
        datetime(2025, 10, 6, 14, 0),
        datetime(2025, 10, 7, 18, 30),
        datetime(2025, 10, 8, 10, 0),
        datetime(2025, 10, 9, 16, 0),
        datetime(2025, 10, 10, 19, 0),
    ]

    # Cover images (Unsplash) picked to be representative; thumbnails left None
    covers = {
        "wedding": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop",
        "music": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
        "tech": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "food": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
        "art": "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
        "health": "https://images.unsplash.com/photo-1554284126-ef290c8494f4?q=80&w=1200&auto=format&fit=crop",
        "sports": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop",
        "business": "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop",
        "education": "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
        "networking": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
        "entertainment": "https://images.unsplash.com/photo-1498069022511-01d8baab2a74?q=80&w=1200&auto=format&fit=crop",
        "recreation": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        "anniversary": "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?q=80&w=1200&auto=format&fit=crop",
        # Festivals (we’ll use entertainment cover for both to align with dropdown filter)
        "festival_indian": "https://images.unsplash.com/photo-1543599537-29720c7d0d01?q=80&w=1200&auto=format&fit=crop",  # Garba/Holi vibe
        "festival_western": "https://images.unsplash.com/photo-1518176258769-f227c798151c?q=80&w=1200&auto=format&fit=crop",  # Oktoberfest
    }

    idx = 0
    events: List[Dict] = []

    def place_on_day(offset_hours: int = 0) -> datetime:
        nonlocal idx
        d = days[idx % len(days)] + timedelta(hours=offset_hours)
        idx += 1
        return d

    # Create one event for each dropdown category
    events += [
        {
            "title": "Elegant Wedding Reception",
            "description": "Celebrate love with an evening of music, dinner, and dancing.",
            "category": "wedding",
            "event_start": place_on_day(0),
            "event_end": None,
            "location": "Grand Ballroom, City Convention Center",
            "max_attendees": 180,
            "price": 0.0,
            "image": covers["wedding"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Live Jazz Night",
            "description": "An intimate live jazz performance featuring local artists.",
            "category": "music",
            "event_start": place_on_day(2),
            "event_end": None,
            "location": "Riverside Amphitheater",
            "max_attendees": 350,
            "price": 15.0,
            "image": covers["music"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "AI Summit Express",
            "description": "Lightning talks on GenAI, RAG patterns, and production MLOps.",
            "category": "tech",
            "event_start": place_on_day(1),
            "event_end": None,
            "location": "Innovation Hub, Tech Park",
            "max_attendees": 220,
            "price": 25.0,
            "image": covers["tech"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Street Food Fiesta",
            "description": "Taste the city! 20+ stalls of global street food and desserts.",
            "category": "food",
            "event_start": place_on_day(3),
            "event_end": None,
            "location": "Old Town Market Square",
            "max_attendees": 800,
            "price": 5.0,
            "image": covers["food"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Contemporary Art Walk",
            "description": "Gallery crawl with curator notes and artist meetups.",
            "category": "art",
            "event_start": place_on_day(4),
            "event_end": None,
            "location": "Arts District, Downtown",
            "max_attendees": 120,
            "price": 10.0,
            "image": covers["art"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Wellness & Yoga Morning",
            "description": "Guided yoga, breathwork, and nutrition tips for a healthier you.",
            "category": "health",
            "event_start": place_on_day(0) + timedelta(hours=1),
            "event_end": None,
            "location": "City Park Lawn",
            "max_attendees": 200,
            "price": 0.0,
            "image": covers["health"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Community 5K Fun Run",
            "description": "All skill levels welcome. Proceeds support youth sports.",
            "category": "sports",
            "event_start": place_on_day(2) + timedelta(hours=2),
            "event_end": None,
            "location": "Lakeside Trail",
            "max_attendees": 500,
            "price": 0.0,
            "image": covers["sports"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Startup Pitch Night",
            "description": "5-minute pitches, live feedback, and investor networking.",
            "category": "business",
            "event_start": place_on_day(1) + timedelta(hours=2),
            "event_end": None,
            "location": "Founders Forum Hall",
            "max_attendees": 160,
            "price": 0.0,
            "image": covers["business"],
            "thumbnail": None,
            "requires_approval": True,
            "organizer_id": admin_id,
        },
        {
            "title": "Python for Data Crash Course",
            "description": "Hands-on workshop on pandas, plotting, and notebooks.",
            "category": "education",
            "event_start": place_on_day(3) + timedelta(hours=1),
            "event_end": None,
            "location": "Community Learning Center Room 2",
            "max_attendees": 60,
            "price": 0.0,
            "image": covers["education"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Founders & Creators Mixer",
            "description": "Make real connections with speed networking rounds.",
            "category": "networking",
            "event_start": place_on_day(4) + timedelta(hours=2),
            "event_end": None,
            "location": "Skyline Bar, Level 12",
            "max_attendees": 120,
            "price": 0.0,
            "image": covers["networking"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Comedy & Magic Showcase",
            "description": "A fast-paced variety show—laughs, illusions, and surprises.",
            "category": "entertainment",
            "event_start": place_on_day(5),
            "event_end": None,
            "location": "Main Stage Theater",
            "max_attendees": 300,
            "price": 12.0,
            "image": covers["entertainment"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Autumn Hike Meetup",
            "description": "Leisurely 8km hike—bring water and a light snack.",
            "category": "recreation",
            "event_start": place_on_day(0) + timedelta(hours=4),
            "event_end": None,
            "location": "Pine Ridge Trailhead",
            "max_attendees": 60,
            "price": 0.0,
            "image": covers["recreation"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Silver Anniversary Soirée",
            "description": "25 years together—join for toasts, music, and photos.",
            "category": "anniversary",
            "event_start": place_on_day(1) + timedelta(hours=4),
            "event_end": None,
            "location": "Rose Garden Pavilion",
            "max_attendees": 140,
            "price": 0.0,
            "image": covers["anniversary"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        # Festivals (titles mention festival; category aligned to dropdown via 'entertainment')
        {
            "title": "Navratri Garba Night (Indian Festival)",
            "description": "Traditional Garba & Dandiya with live folk music. Ethnic wear encouraged!",
            "category": "entertainment",
            "event_start": place_on_day(2) + timedelta(hours=4),
            "event_end": None,
            "location": "Cultural Center Hall A",
            "max_attendees": 500,
            "price": 8.0,
            "image": covers["festival_indian"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
        {
            "title": "Oktoberfest Celebration (Western Festival)",
            "description": "Brass bands, pretzels, and seasonal specials. Family-friendly areas included.",
            "category": "entertainment",
            "event_start": place_on_day(3) + timedelta(hours=4),
            "event_end": None,
            "location": "Town Square Beer Garden",
            "max_attendees": 700,
            "price": 10.0,
            "image": covers["festival_western"],
            "thumbnail": None,
            "requires_approval": False,
            "organizer_id": admin_id,
        },
    ]

    return events


def main() -> None:
    with Session(engine) as session:
        admin = ensure_admin(session)
        stats = purge_all_events(session)
        print(f"Purged: events={stats['events']}, rsvps={stats['rsvps']}, comments={stats['comments']}")

        payloads = build_events_payload(admin.id)
        created = 0
        for data in payloads:
            ev = Event(**data)
            session.add(ev)
            created += 1
        session.commit()
        print(f"Seeded {created} events for Oct 5–10, 2025. Organizer: admin@eventify.com (id={admin.id})")


if __name__ == "__main__":
    main()

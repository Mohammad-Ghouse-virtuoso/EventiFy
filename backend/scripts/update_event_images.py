from __future__ import annotations

"""
Update cover images for specific events that have off/broken images.

Targets:
- Navratri Garba Night (Indian Festival)
- Oktoberfest Celebration (Western Festival)
- Comedy & Magic Showcase
- Wellness & Yoga Morning

Run:
  cd backend && ENVIRONMENT=dev .venv/bin/python scripts/update_event_images.py

This script updates only Event.image (and leaves thumbnail as-is or None).
"""

import os
import sys
from typing import Dict

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from sqlmodel import Session, select

from app.db.database import engine
from app.models.event import Event


TITLE_TO_IMAGE: Dict[str, str] = {
    # Festivals -> use local static assets provided by user
    "Navratri Garba Night (Indian Festival)": "/static/event_images/Garba.png",
    "Oktoberfest Celebration (Western Festival)": "/static/event_images/oktoberfest.png",

    # Tech conference vibe for AI Summit
    "AI Summit Express": (
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"
    ),

    # Art Walk -> use local art gallery image
    "Contemporary Art Walk": "/static/event_images/art_gallery.jpg",

    # Startup pitch/networking ambiance
    "Startup Pitch Night": (
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop"
    ),

    # Keep prior improvements too (won't hurt if present)
    "Comedy & Magic Showcase": (
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1200&auto=format&fit=crop"
    ),
    "Wellness & Yoga Morning": (
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop"
    ),
}


def main() -> None:
    updated = 0
    missing = []
    with Session(engine) as session:
        for title, url in TITLE_TO_IMAGE.items():
            ev = session.exec(select(Event).where(Event.title == title)).first()
            if not ev:
                missing.append(title)
                continue
            ev.image = url
            # Clear any previous/broken thumbnail so frontend falls back to image
            ev.thumbnail = None
            session.add(ev)
            updated += 1
        if updated:
            session.commit()
    print(f"Updated images for {updated} events.")
    if missing:
        print("Events not found (skipped):")
        for t in missing:
            print(f" - {t}")


if __name__ == "__main__":
    main()

import os
from typing import Dict, Optional
from sqlmodel import Session, select
from app.db.database import engine
from app.models.event import Event
from app.core.config import settings

"""
Attach cover images and thumbnails to events that are missing them, using a provided
mapping of event titles to specific image filenames under static/event_images.

This script is idempotent and only updates events where image/thumbnail are missing.
"""

# Map event titles to exact image filenames (must exist under backend/static/event_images)
TITLE_TO_IMAGE: Dict[str, str] = {
    "Lopez & Henna's Anniversary": "event_1758142274.jpeg",
    "Elia's Bachelorette Party": "event_1758142372.jpg",
    "Reception": "event_1758144656.jpeg",
    "House Warming": "event_1758225287.jpg",
    "Hookah Night": "event_1758226074.jpg",
    "Paul's B'day": "event_1758225740.jpg",
    "Jamie Dimon's briefing": "event_1758144795.jpg",
    "Hard Rock Club": "event_1758145471.jpeg",
    "Hailey's Grand Prix": "event_1758144744.jpeg",
    "Emma's Botinical Garden": "event_1758141459.jpg",
    "Krish's babyshower": "event_1758144656.jpeg",
    "St. Stephen's College": "event_1758138764.jpg",
}


def ensure_thumb_for(image_filename: str) -> Optional[str]:
    """Derive a thumbnail URL if an automatic thumb exists; otherwise return None.
    This assumes earlier backfill created thumbs named like event_*_thumb.jpg in thumbs/.
    We cannot recreate thumbs reliably here without Pillow imports; keep simple.
    """
    thumbs_dir = os.path.join(settings.STATIC_DIR, "event_images", "thumbs")
    # Best-effort: pick any existing backfill thumb to use if dedicated not found
    # Otherwise leave None; UI will use skeleton and original image.
    if not os.path.isdir(thumbs_dir):
        return None
    # Prefer most recent backfill thumb
    files = [f for f in os.listdir(thumbs_dir) if f.endswith(".jpg")]
    if not files:
        return None
    files.sort()
    thumb_name = files[-1]
    return f"{settings.BASE_URL.rstrip('/')}" \
           f"/static/event_images/thumbs/{thumb_name}"


def main():
    static_base = os.path.join(settings.STATIC_DIR, "event_images")
    if not os.path.isdir(static_base):
        print(f"Static event_images directory missing: {static_base}")
        return

    with Session(engine) as session:
        events = session.exec(select(Event)).all()
        updated = 0
        for ev in events:
            if ev.title in TITLE_TO_IMAGE:
                if ev.image and ev.thumbnail:
                    continue  # already has covers
                filename = TITLE_TO_IMAGE[ev.title]
                image_path = os.path.join(static_base, filename)
                if not os.path.exists(image_path):
                    print(f"Image file missing for '{ev.title}': {image_path}")
                    continue
                ev.image = f"{settings.BASE_URL.rstrip('/')}" \
                          f"/static/event_images/{filename}"
                # Try to assign an existing thumbnail; if not, leave None
                ev.thumbnail = ensure_thumb_for(filename) or ev.thumbnail
                session.add(ev)
                updated += 1
        if updated:
            session.commit()
        print(f"Attached covers to {updated} events.")


if __name__ == "__main__":
    main()

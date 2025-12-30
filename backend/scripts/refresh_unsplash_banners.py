"""
Refresh event banners with unique Unsplash images.
Assigns a rotating set of photo URLs so events are not duplicated.
"""
import sys
from pathlib import Path
from sqlmodel import Session, select, create_engine

sys.path.append(str(Path(__file__).parent.parent))
from app.models.event import Event

UNSPLASH_IMAGES = [
    "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=1200",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200",
    "https://images.unsplash.com/photo-1515165562835-c3b8c9df72a0?w=1200",
    "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1524386189627-88c2cb03f74c?w=1200",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200",
    "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200",
    "https://images.unsplash.com/photo-1453838956707-38a7aa3cd62d?w=1200",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200",
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200",
    "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=1200",
    "https://images.unsplash.com/photo-1497493292307-31c376b6e479?w=1200",
    "https://images.unsplash.com/photo-1484795819573-86ae049cb815?w=1200",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200",
]

DATABASE_URL = "sqlite:///./eventify.db"
engine = create_engine(DATABASE_URL, echo=False)

def main():
    with Session(engine) as session:
        events = session.exec(select(Event).order_by(Event.id)).all()
        if not events:
            print("No events found")
            return
        updated = 0
        for idx, event in enumerate(events):
            url = UNSPLASH_IMAGES[idx % len(UNSPLASH_IMAGES)]
            event.image = url
            session.add(event)
            updated += 1
        session.commit()
        print(f"Updated {updated} events with Unsplash images")

if __name__ == "__main__":
    main()

"""
Refresh event banners with category-specific Unsplash images.
Maps event categories to curated image pools for better visual alignment.
"""
import sys
import random
from pathlib import Path
from sqlmodel import Session, select, create_engine

sys.path.append(str(Path(__file__).parent.parent))
from app.models.event import Event
from app.services.banner_pool import CATEGORY_IMAGE_POOLS, get_image_for_category

DATABASE_URL = "sqlite:///./eventify.db"
engine = create_engine(DATABASE_URL, echo=False)

def main():
    with Session(engine) as session:
        events = session.exec(select(Event).order_by(Event.id)).all()
        if not events:
            print("No events found")
            return
        
        # Track usage to avoid duplicates where possible
        used_urls = set()
        updated = 0
        
        for event in events:
            # Get category-appropriate image
            category = event.category or "general"
            pool = CATEGORY_IMAGE_POOLS.get(category.lower(), CATEGORY_IMAGE_POOLS["general"])
            
            # Try to pick an unused URL from the pool
            available = [url for url in pool if url not in used_urls]
            if not available:
                # All used, pick any from pool
                url = random.choice(pool)
            else:
                url = random.choice(available)
            
            used_urls.add(url)
            event.image = url
            session.add(event)
            updated += 1
            print(f"  {event.id:2} | {category:15} | {event.title[:40]}")
        
        session.commit()
        print(f"\n✅ Updated {updated} events with category-specific Unsplash images")

if __name__ == "__main__":
    main()

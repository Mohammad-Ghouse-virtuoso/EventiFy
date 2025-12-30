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

# Category-specific image pools (curated Unsplash URLs)
CATEGORY_IMAGE_POOLS = {
    "art": [
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200",  # Art gallery
        "https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=1200",  # Abstract art
        "https://images.unsplash.com/photo-1577083288073-40892c0860df?w=1200",  # Art exhibition
        "https://images.unsplash.com/photo-1578321272176-d1bfc5e06d20?w=1200",  # Modern art
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",  # Canvas painting
        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=1200",  # Photography
        "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200",  # Art studio
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200",  # Gallery exhibit
        "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1200",  # Museum
        "https://images.unsplash.com/photo-1574888546928-d37f2a7eb48a?w=1200",  # Creative space
    ],
    "food": [
        "https://images.unsplash.com/photo-1504674900152-b8b80e7ddb41?w=1200",  # Food market
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200",  # Food preparation
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",  # Restaurant table
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200",  # Street food
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200",  # Cooking
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200",  # Fine dining
        "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200",  # Food festival
        "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200",  # Culinary
        "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=1200",  # Restaurant scene
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",  # Dining
    ],
    "nightlife": [
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200",  # Concert/club
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",  # Live music
        "https://images.unsplash.com/photo-1571266028243-d220c6781cf5?w=1200",  # DJ/nightclub
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200",  # Bar scene
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200",  # Party lights
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200",  # Night venue
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200",  # Party crowd
        "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200",  # DJ booth
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200",  # Club lights
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",  # Music venue
    ],
    "sports": [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",  # Motorcycle/racing
        "https://images.unsplash.com/photo-1461773518188-b3e86f98242f?w=1200",  # Cycling
        "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200",  # Motorsports
        "https://images.unsplash.com/photo-1519625212778-3c175d1bdbf7?w=1200",  # Sports arena
        "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=1200",  # Racing track
        "https://images.unsplash.com/photo-1519500099198-a1c6d494e8a6?w=1200",  # Outdoor sports
        "https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200",  # Stadium
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200",  # Basketball
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",  # Sports event
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1200",  # Racing cars
    ],
    "education": [
        "https://images.unsplash.com/photo-1427504494785-cdba6c3fb77b?w=1200",  # Study/learning
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200",  # Classroom
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200",  # Books/study
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200",  # Workshop
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",  # Team learning
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200",  # Professional talk
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200",  # Laptop study
        "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200",  # Workshop space
        "https://images.unsplash.com/photo-1562774053-701939374585?w=1200",  # Career development
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200",  # Conference
    ],
    "entertainment": [
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",  # Event/celebration
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200",  # Entertainment venue
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",  # Gaming/fun
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200",  # Party/celebration
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200",  # Fireworks/event
        "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=1200",  # Stage/performance
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200",  # Theater
        "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200",  # Concert
        "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200",  # Gaming event
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",  # New year party
    ],
    "general": [
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",  # General gathering
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200",  # Meeting
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200",  # Conference
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200",  # Office/workspace
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200",  # Business meeting
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200",  # Team gathering
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",  # Community event
        "https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=1200",  # Town hall
    ],
    "archive": [
        "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200",  # Throwback/vintage
        "https://images.unsplash.com/photo-1513623935135-c896b59073c1?w=1200",  # Classic event
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200",  # Past event
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200",  # Memory
        "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=1200",  # Vintage party
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",  # Historical
    ],
}

DATABASE_URL = "sqlite:///./eventify.db"
engine = create_engine(DATABASE_URL, echo=False)

def get_image_for_category(category: str) -> str:
    """Get a random image URL for the given category."""
    category_lower = category.lower()
    pool = CATEGORY_IMAGE_POOLS.get(category_lower, CATEGORY_IMAGE_POOLS["general"])
    return random.choice(pool)

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

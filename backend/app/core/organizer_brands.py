"""
Organizer Brands Configuration
Maps organizers to their branded themes/labels while using random names
"""
from typing import Dict, Optional

# Brand registry - maps brand key to brand metadata
BRAND_REGISTRY = {
    "remo": {
        "label": "Remo",
        "category": "nightlife",
        "description": "Premium nightlife events, cocktails & music",
    },
    "artfolk": {
        "label": "Artfolk",
        "category": "art",
        "description": "Contemporary art & gallery experiences",
    },
    "cookingg": {
        "label": "Cookingg",
        "category": "food",
        "description": "Food festivals & culinary experiences",
    },
    "giggling": {
        "label": "Giggling",
        "category": "education",
        "description": "Learning & professional development",
    },
    "daytona": {
        "label": "Daytona",
        "category": "sports",
        "description": "Racing, motorsports & adrenaline events",
    },
}

# Random first names pool for organizers
FIRST_NAMES = [
    "Alex", "Jordan", "Sam", "Casey", "Morgan", "Taylor", "Riley", "Quinn",
    "Avery", "Blake", "Cameron", "Dana", "Emma", "Finley", "Grace", "Harper",
    "Indie", "Jamie", "Kansas", "Logan", "Milan", "Noah", "Ocean", "Parker",
    "River", "Skylar", "Tyler", "Urban", "Vale", "Winter", "Xavier", "Yuval"
]

# Random last names pool
LAST_NAMES = [
    "Anderson", "Baker", "Chen", "Davis", "Edison", "Foster", "Garcia", "Hayes",
    "Ibrahim", "Jackson", "Khan", "Liu", "Martinez", "Nelson", "O'Brien", "Parker",
    "Quinn", "Rodriguez", "Smith", "Torres", "Underwood", "Voss", "Watson", "Young",
    "Zhang", "Brooks", "Carter", "Douglas", "Evans", "Fletcher", "Grant", "Hill"
]


def get_random_organizer_name(seed: Optional[int] = None) -> str:
    """
    Generate a random organizer name from name pools.
    
    Args:
        seed: Optional seed for reproducibility (event_id can be used)
    
    Returns:
        Full name like "Alex Martinez"
    """
    import random
    
    if seed is not None:
        random.seed(seed)
    
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"


def get_brand_for_organizer(organizer_name: str) -> Optional[Dict]:
    """
    Determine if an organizer has a brand association based on event organization patterns.
    Uses organizer_id or event patterns to determine brand.
    
    Args:
        organizer_name: Organizer full name
    
    Returns:
        Brand dict or None if no branded organizer
    """
    # Check if this looks like one of our branded organizers
    # In a real system, this would be stored in the database
    name_lower = organizer_name.lower()
    
    # Map patterns to brands
    if any(x in name_lower for x in ["remo", "bar", "nightlife"]):
        return BRAND_REGISTRY.get("remo")
    elif any(x in name_lower for x in ["artfolk", "art", "gallery", "curator"]):
        return BRAND_REGISTRY.get("artfolk")
    elif any(x in name_lower for x in ["cookingg", "cooking", "chef", "food"]):
        return BRAND_REGISTRY.get("cookingg")
    elif any(x in name_lower for x in ["giggling", "university", "education"]):
        return BRAND_REGISTRY.get("giggling")
    elif any(x in name_lower for x in ["daytona", "racing", "sports"]):
        return BRAND_REGISTRY.get("daytona")
    
    return None


def format_organizer_display(organizer_name: str, brand: Optional[Dict] = None) -> str:
    """
    Format organizer name with brand label for UI display.
    
    Args:
        organizer_name: Organizer full name
        brand: Brand dict or None
    
    Returns:
        Formatted display string like "Alex Martinez at Artfolk"
    """
    if brand:
        return f"{organizer_name} at {brand['label']}"
    return organizer_name

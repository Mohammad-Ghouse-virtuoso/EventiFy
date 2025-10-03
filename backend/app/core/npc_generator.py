"""
Virtual NPC (Non-Player Character) Attendees Generator
Creates fake attendees that appear in event lists but don't have accounts.
These "ghost" attendees auto-disappear when events expire - zero DB footprint!
"""
import random
from datetime import datetime
from typing import List, Dict

# Pool of realistic first & last names
FIRST_NAMES = [
    "Alex", "Blake", "Casey", "Dakota", "Ellis", "Finley", "Gray", "Harper",
    "Indigo", "Jordan", "Kai", "Logan", "Morgan", "Nova", "Owen", "Parker",
    "Quinn", "Riley", "Sage", "Taylor", "Uma", "Val", "Winter", "Xen",
    "Yuki", "Zara", "Aria", "Brynn", "Cedar", "Drew", "Eden", "Finn",
    "Gage", "Haven", "Iris", "Jules", "Koa", "Lane", "Mika", "Nico",
    "Phoenix", "Reed", "Sky", "Tate", "Uri", "Vega", "Wren", "Zia",
    "Amara", "Bodhi", "Cruz", "Devi", "Echo", "Flynn", "Gem", "Hiro",
]

LAST_NAMES = [
    "Smith", "Johnson", "Chen", "Patel", "Kim", "Martinez", "Anderson", "Lee",
    "Taylor", "Brown", "Wilson", "Garcia", "Rodriguez", "Davis", "Lopez",
    "White", "Harris", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young",
    "King", "Wright", "Scott", "Green", "Adams", "Baker", "Nelson", "Carter",
    "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker",
    "Evans", "Edwards", "Collins", "Stewart", "Morris", "Rogers", "Reed",
    "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson",
]

def generate_npc_name(seed: int) -> str:
    """Generate a consistent NPC name based on seed (event_id + index)"""
    random.seed(seed)
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"

def generate_npc_attendees(event_id: int, real_attendee_count: int, max_total: int = None) -> List[Dict]:
    """
    Generate virtual NPC attendees for an event.
    
    Args:
        event_id: Event ID to use as seed for consistency
        real_attendee_count: Number of real RSVPs already in the event
        max_total: Maximum total attendees (if None, adds 5-10 NPCs)
    
    Returns:
        List of fake RSVP-like dicts with NPC data
    """
    # Determine how many NPCs to add
    if max_total:
        # Fill up to max_total
        npc_count = max(0, max_total - real_attendee_count)
    else:
        # Add 5-10 random NPCs (use event_id as seed for consistency)
        random.seed(event_id)
        npc_count = random.randint(5, 10)
    
    # Cap NPCs to avoid crazy numbers (unless force_npc_count is very high)
    if max_total is None and npc_count > 20:
        # Only cap automatic NPCs, not forced counts
        npc_count = 20
    
    npcs = []
    for i in range(npc_count):
        # Generate consistent NPC for this event slot
        seed = (event_id * 1000) + i
        name = generate_npc_name(seed)
        
        # Create fake RSVP-like object
        npc_rsvp = {
            "id": -(event_id * 1000 + i),  # Negative ID to mark as NPC
            "user_id": -(event_id * 1000 + i),  # Negative user_id
            "event_id": event_id,
            "status": "going",  # NPCs are always "going"
            "notes": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "checked_in": False,
            "checked_in_at": None,
            "user": {
                "id": -(event_id * 1000 + i),
                "email": f"npc_{event_id}_{i}@virtual.eventify",
                "full_name": name,
                "role": "attendee"
            },
            "is_npc": True  # Flag to identify NPCs in frontend
        }
        npcs.append(npc_rsvp)
    
    return npcs

def inject_npcs_into_attendees(event_id: int, real_attendees: List[Dict], event_max: int = None, force_npc_count: int = None) -> List[Dict]:
    """
    Inject NPC attendees into real attendee list.
    
    Args:
        event_id: Event ID
        real_attendees: List of real RSVP dicts
        event_max: Event's max_attendees (if set, fill up to this)
        force_npc_count: Force exact number of NPCs (overrides normal logic)
    
    Returns:
        Combined list of real + NPC attendees, shuffled
    """
    real_count = len(real_attendees)
    
    # If force_npc_count is specified, use it directly
    if force_npc_count is not None:
        npcs = generate_npc_attendees(event_id, real_count, real_count + force_npc_count)
    else:
        npcs = generate_npc_attendees(event_id, real_count, event_max)
    
    # Combine and shuffle (but use event_id as seed for consistency)
    combined = real_attendees + npcs
    random.seed(event_id)
    random.shuffle(combined)
    
    return combined

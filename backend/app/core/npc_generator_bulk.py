"""
Enhanced NPC Generator with bulk generation support.
Generates hundreds of virtual attendees per event.
"""
from app.core.npc_generator import (
    generate_npc_name,
    generate_npc_attendees as _original_generate_npc_attendees,
    inject_npcs_into_attendees as _original_inject_npcs,
    FIRST_NAMES,
    LAST_NAMES,
)
import random
from datetime import datetime
from typing import List, Dict

def generate_bulk_npc_attendees(event_id: int, npc_count: int) -> List[Dict]:
    """
    Generate large numbers of NPCs (100-500+) for realistic event attendance.
    
    Args:
        event_id: Event ID to use as seed for consistency
        npc_count: Exact number of NPCs to generate
    
    Returns:
        List of NPC RSVP dicts
    """
    npcs = []
    for i in range(npc_count):
        # Generate consistent NPC for this event slot
        seed = (event_id * 10000) + i
        name = generate_npc_name(seed)
        
        # Create fake RSVP-like object
        npc_rsvp = {
            "id": -(event_id * 10000 + i),  # Negative ID to mark as NPC
            "user_id": -(event_id * 10000 + i),  # Negative user_id
            "event_id": event_id,
            "status": "going",  # NPCs are always "going"
            "notes": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "checked_in": False,
            "checked_in_at": None,
            "user": {
                "id": -(event_id * 10000 + i),
                "email": f"npc_{event_id}_{i}@virtual.eventify",
                "full_name": name,
                "role": "attendee"
            },
            "is_npc": True  # Flag to identify NPCs in frontend
        }
        npcs.append(npc_rsvp)
    
    return npcs


def inject_bulk_npcs_into_attendees(
    event_id: int,
    real_attendees: List[Dict],
    target_npc_count: int = None
) -> List[Dict]:
    """
    Inject large numbers of NPCs into attendee list.
    
    Args:
        event_id: Event ID
        real_attendees: List of real RSVP dicts
        target_npc_count: Target number of NPCs (100-500 recommended)
    
    Returns:
        Combined list of real + bulk NPC attendees, shuffled
    """
    if target_npc_count is None:
        target_npc_count = random.randint(100, 300)
    
    npcs = generate_bulk_npc_attendees(event_id, target_npc_count)
    
    # Combine and shuffle (but use event_id as seed for consistency)
    combined = real_attendees + npcs
    random.seed(event_id)
    random.shuffle(combined)
    
    return combined


# Export all functions
__all__ = [
    'generate_npc_name',
    'generate_bulk_npc_attendees',
    'inject_bulk_npcs_into_attendees',
    'FIRST_NAMES',
    'LAST_NAMES'
]

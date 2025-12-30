"""
Update Evergreen Event Organizer Names
Changes branded organizers from old names (Remo Martinez, Elena Artfolk, etc.) 
to random names (Jordan Martinez, Avery Chen, etc.)
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select, create_engine
from app.models.user import User
from app.models.event import Event

# Create engine
DATABASE_URL = "sqlite:///./eventify.db"
engine = create_engine(DATABASE_URL, echo=False)


def main():
    print("=" * 70)
    print("🔄 Updating Evergreen Event Organizer Names")
    print("=" * 70)
    
    # Mapping of old names to new names
    name_mapping = {
        "Remo Martinez": "Jordan Martinez",
        "Elena Artfolk": "Avery Chen",
        "Chef Marco Cookingg": "Riley Foster",
        "Dr. Sarah Giggling": "Morgan Brooks",
        "Mike Daytona": "Cameron Torres",
    }
    
    with Session(engine) as session:
        updated_users = 0
        updated_events = 0
        
        print(f"\n📊 Processing organizer updates...")
        
        for old_name, new_name in name_mapping.items():
            # Find user with old name
            user = session.exec(
                select(User).where(User.full_name == old_name)
            ).first()
            
            if user:
                print(f"\n  ✓ Found user: {old_name}")
                print(f"    → Updating to: {new_name}")
                user.full_name = new_name
                session.add(user)
                updated_users += 1
                
                # Count events organized by this user
                events = session.exec(
                    select(Event).where(Event.organizer_id == user.id)
                ).all()
                
                print(f"    → Associated events: {len(events)}")
                updated_events += len(events)
            else:
                print(f"\n  ⚠ User not found: {old_name}")
        
        # Commit changes
        session.commit()
        
        print(f"\n{'=' * 70}")
        print(f"✅ Update Complete!")
        print(f"   Updated Users: {updated_users}")
        print(f"   Affected Events: {updated_events}")
        print(f"{'=' * 70}\n")


if __name__ == '__main__':
    main()

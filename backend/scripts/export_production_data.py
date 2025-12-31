"""
Export production data from local database to SQL file for Railway import.
This creates a PostgreSQL-compatible SQL dump that can be imported to Railway.
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.database import engine
from app.models.event import Event
from app.models.user import User
from app.models.rsvp import RSVP
import json
from datetime import datetime

def export_to_sql():
    """Export database to PostgreSQL-compatible SQL INSERT statements."""
    
    with Session(engine) as session:
        # Get all data
        users = session.exec(select(User)).all()
        events = session.exec(select(Event)).all()
        rsvps = session.exec(select(RSVP)).all()
        
        output_file = Path(__file__).parent.parent / "production_data_export.sql"
        
        with open(output_file, 'w') as f:
            f.write("-- EventiFy Production Data Export\n")
            f.write(f"-- Generated: {datetime.now().isoformat()}\n")
            f.write(f"-- Events: {len(events)}, Users: {len(users)}, RSVPs: {len(rsvps)}\n\n")
            
            # Export Users (excluding sample users that already exist)
            f.write("-- USERS (NPCs and production users)\n")
            f.write("-- Skipping: admin@eventify.com, organizer@eventify.com, john@example.com, jane@example.com, organizer2@eventify.com\n\n")
            
            sample_emails = {
                'admin@eventify.com', 
                'organizer@eventify.com', 
                'john@example.com', 
                'jane@example.com', 
                'organizer2@eventify.com'
            }
            
            for user in users:
                if user.email not in sample_emails:
                    created_at = user.created_at.isoformat() if user.created_at else 'NOW()'
                    full_name_escaped = user.full_name.replace("'", "''")
                    f.write(f"INSERT INTO \"user\" (id, email, full_name, hashed_password, role, is_active, created_at) VALUES ")
                    f.write(f"({user.id}, '{user.email}', '{full_name_escaped}', ")
                    f.write(f"'{user.hashed_password}', '{user.role}', {str(user.is_active).lower()}, '{created_at}')")
                    f.write(" ON CONFLICT (id) DO NOTHING;\n")
            
            f.write("\n-- EVENTS\n\n")
            
            # Export Events (excluding sample events)
            sample_event_titles = {
                "Sarah & Mike's Wedding Celebration",
                "Baby Shower for Emma & David",
                "Golden Anniversary - 50 Years Together",
                "Tech Meetup: AI in 2024",
                "Summer Music Festival"
            }
            
            for event in events:
                if event.title not in sample_event_titles:
                    # Escape single quotes
                    title = event.title.replace("'", "''")
                    description = (event.description or '').replace("'", "''")
                    category = (event.category or '').replace("'", "''")
                    location = (event.location or '').replace("'", "''")
                    image = (event.image or '').replace("'", "''")
                    thumbnail = (event.thumbnail or '').replace("'", "''")
                    terms = (event.terms_and_conditions or '').replace("'", "''")
                    bio = (event.organizer_bio or '').replace("'", "''")
                    contact = (event.organizer_contact or '').replace("'", "''")
                    org_email = (event.organizer_email or '').replace("'", "''")
                    tags = (event.tags or '').replace("'", "''")
                    timezone = (event.timezone or 'UTC').replace("'", "''")
                    
                    event_start = event.event_start.isoformat() if event.event_start else 'NULL'
                    event_end = event.event_end.isoformat() if event.event_end else 'NULL'
                    created_at = event.created_at.isoformat() if event.created_at else 'NOW()'
                    last_refreshed = event.last_refreshed_at.isoformat() if event.last_refreshed_at else 'NULL'
                    
                    f.write(f"INSERT INTO event (id, title, description, category, location, max_attendees, price, image, thumbnail, ")
                    f.write(f"requires_approval, organizer_id, organizer_email, created_at, is_active, event_start, event_end, ")
                    f.write(f"terms_and_conditions, organizer_bio, organizer_contact, is_evergreen, tags, timezone, last_refreshed_at) VALUES (")
                    f.write(f"{event.id}, '{title}', '{description}', '{category}', '{location}', ")
                    f.write(f"{event.max_attendees}, {event.price}, '{image}', '{thumbnail}', ")
                    f.write(f"{str(event.requires_approval).lower()}, {event.organizer_id}, '{org_email}', '{created_at}', ")
                    f.write(f"{str(event.is_active).lower()}, '{event_start}', '{event_end}', ")
                    f.write(f"'{terms}', '{bio}', '{contact}', {str(event.is_evergreen).lower()}, '{tags}', '{timezone}', ")
                    if last_refreshed == 'NULL':
                        f.write("NULL")
                    else:
                        f.write(f"'{last_refreshed}'")
                    f.write(") ON CONFLICT (id) DO NOTHING;\n")
            
            f.write("\n-- RSVPs (for non-sample events)\n\n")
            
            # Get sample event IDs
            sample_event_ids = {e.id for e in events if e.title in sample_event_titles}
            
            for rsvp in rsvps:
                if rsvp.event_id not in sample_event_ids:
                    notes = (rsvp.notes or '').replace("'", "''")
                    created_at = rsvp.created_at.isoformat() if rsvp.created_at else 'NOW()'
                    updated_at = rsvp.updated_at.isoformat() if rsvp.updated_at else 'NOW()'
                    
                    f.write(f"INSERT INTO rsvp (id, user_id, event_id, status, notes, created_at, updated_at) VALUES ")
                    f.write(f"({rsvp.id}, {rsvp.user_id}, {rsvp.event_id}, '{rsvp.status}', '{notes}', '{created_at}', '{updated_at}')")
                    f.write(" ON CONFLICT (id) DO NOTHING;\n")
            
            f.write("\n-- Update sequences to prevent ID conflicts\n")
            f.write("SELECT setval('user_id_seq', (SELECT MAX(id) FROM \"user\"));\n")
            f.write("SELECT setval('event_id_seq', (SELECT MAX(id) FROM event));\n")
            f.write("SELECT setval('rsvp_id_seq', (SELECT MAX(id) FROM rsvp));\n")
            
        print(f"✅ Export complete!")
        print(f"📄 File: {output_file}")
        print(f"📊 Exported: {len([u for u in users if u.email not in sample_emails])} users, {len([e for e in events if e.title not in sample_event_titles])} events")
        print(f"\n🚀 Next steps:")
        print(f"1. Copy this file to Railway PostgreSQL")
        print(f"2. Run: psql $DATABASE_URL < production_data_export.sql")

if __name__ == "__main__":
    export_to_sql()

from sqlmodel import Session, select
from datetime import datetime, timedelta
from app.db.database import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus
from app.core.auth import get_password_hash

def init_db():
    """Initialize database with tables and seed data."""
    # Create all tables
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if we already have users (avoid duplicate seeding)
        existing_users = session.exec(select(User)).first()
        if existing_users:
            print("Database already seeded, skipping...")
            return
        
        # Create sample users
        users_data = [
            {
                "email": "admin@eventify.com",
                "full_name": "Admin User",
                "role": UserRole.ADMIN,
                "password": "admin123"
            },
            {
                "email": "organizer@eventify.com", 
                "full_name": "Event Organizer",
                "role": UserRole.ORGANIZER,
                "password": "organizer123"
            },
            {
                "email": "john@example.com",
                "full_name": "John Doe",
                "role": UserRole.ATTENDEE,
                "password": "attendee123"
            },
            {
                "email": "jane@example.com",
                "full_name": "Jane Smith", 
                "role": UserRole.ATTENDEE,
                "password": "attendee123"
            },
            {
                "email": "organizer2@eventify.com",
                "full_name": "Sarah Wilson",
                "role": UserRole.ORGANIZER,
                "password": "organizer123"
            }
        ]
        
        created_users = []
        for user_data in users_data:
            password = user_data.pop("password")
            hashed_password = get_password_hash(password)
            
            user = User(
                **user_data,
                hashed_password=hashed_password
            )
            session.add(user)
            created_users.append(user)
        
        session.commit()
        
        # Refresh users to get their IDs
        for user in created_users:
            session.refresh(user)
        
        # Create sample events with future dates
        base_date = datetime.now() + timedelta(days=7)  # Start from next week
        
        events_data = [
            {
                "title": "Sarah & Mike's Wedding Celebration",
                "description": "Join us for a beautiful wedding ceremony and reception. Dress code: Semi-formal. Dinner and dancing to follow the ceremony.",
                "date": base_date + timedelta(days=14),  # 3 weeks from now
                "location": "Grand Ballroom, Marriott Hotel, Downtown",
                "max_attendees": 150,
                "price": 0.0,
                "organizer_id": created_users[1].id  # organizer@eventify.com
            },
            {
                "title": "Baby Shower for Emma & David",
                "description": "Celebrating the upcoming arrival of baby Johnson! Games, gifts, and refreshments. Please RSVP with dietary restrictions.",
                "date": base_date + timedelta(days=21),  # 4 weeks from now
                "location": "Community Center, 123 Oak Street",
                "max_attendees": 50,
                "price": 0.0,
                "organizer_id": created_users[4].id  # organizer2@eventify.com
            },
            {
                "title": "Golden Anniversary - 50 Years Together",
                "description": "Celebrating Robert & Mary's 50th wedding anniversary! Join us for an afternoon of memories, music, and cake.",
                "date": base_date + timedelta(days=28),  # 5 weeks from now
                "location": "Sunset Gardens Event Hall",
                "max_attendees": 100,
                "price": 0.0,
                "organizer_id": created_users[1].id  # organizer@eventify.com
            },
            {
                "title": "Tech Meetup: AI in 2024",
                "description": "Monthly tech meetup discussing the latest trends in AI and machine learning. Networking and pizza included!",
                "date": base_date + timedelta(days=10),  # 2.5 weeks from now
                "location": "Innovation Hub, Tech District",
                "max_attendees": 80,
                "price": 15.0,
                "organizer_id": created_users[4].id  # organizer2@eventify.com
            },
            {
                "title": "Summer Music Festival",
                "description": "Outdoor music festival featuring local bands and food trucks. Bring your own chairs and enjoy the music!",
                "date": base_date + timedelta(days=35),  # 6 weeks from now
                "location": "Central Park Amphitheater",
                "max_attendees": 500,
                "price": 25.0,
                "organizer_id": created_users[1].id  # organizer@eventify.com
            }
        ]
        
        created_events = []
        for event_data in events_data:
            event = Event(**event_data)
            session.add(event)
            created_events.append(event)
        
        session.commit()
        
        # Refresh events to get their IDs
        for event in created_events:
            session.refresh(event)
        
        # Create some sample RSVPs
        rsvps_data = [
            # Wedding RSVPs
            {"user_id": created_users[2].id, "event_id": created_events[0].id, "status": RSVPStatus.GOING},
            {"user_id": created_users[3].id, "event_id": created_events[0].id, "status": RSVPStatus.GOING},
            
            # Baby shower RSVPs
            {"user_id": created_users[2].id, "event_id": created_events[1].id, "status": RSVPStatus.INTERESTED},
            {"user_id": created_users[3].id, "event_id": created_events[1].id, "status": RSVPStatus.GOING},
            
            # Tech meetup RSVPs
            {"user_id": created_users[2].id, "event_id": created_events[3].id, "status": RSVPStatus.GOING},
            {"user_id": created_users[3].id, "event_id": created_events[3].id, "status": RSVPStatus.GOING},
        ]
        
        for rsvp_data in rsvps_data:
            rsvp = RSVP(**rsvp_data)
            session.add(rsvp)
        
        session.commit()
        
        print("Database initialized successfully!")
        print("\nSample users created:")
        print("- admin@eventify.com (password: admin123) - Admin")
        print("- organizer@eventify.com (password: organizer123) - Organizer") 
        print("- organizer2@eventify.com (password: organizer123) - Organizer")
        print("- john@example.com (password: attendee123) - Attendee")
        print("- jane@example.com (password: attendee123) - Attendee")
        print(f"\n{len(created_events)} sample events created with future dates")
        print(f"{len(rsvps_data)} sample RSVPs created")

if __name__ == "__main__":
    init_db()

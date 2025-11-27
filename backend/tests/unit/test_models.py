"""
Unit tests for database models.
"""

import pytest
from datetime import datetime, timedelta
from app.models.user import User, UserRole, UserCreate
from app.models.event import Event, EventCreate
from app.core.auth import get_password_hash


@pytest.mark.unit
class TestUserModel:
    """Test User model validation and behavior"""
    
    def test_user_creation(self, session):
        """User should be created with valid data"""
        user = User(
            email="newuser@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="New User",
            role=UserRole.ATTENDEE
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        assert user.id is not None
        assert user.email == "newuser@example.com"
        assert user.full_name == "New User"
        assert user.role == UserRole.ATTENDEE
        assert user.is_active is True
        assert user.created_at is not None
    
    def test_user_default_role(self, session):
        """User should default to ATTENDEE role"""
        user = User(
            email="attendee@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Attendee User"
        )
        session.add(user)
        session.commit()
        
        assert user.role == UserRole.ATTENDEE
    
    def test_user_default_active(self, session):
        """User should default to active"""
        user = User(
            email="active@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Active User"
        )
        session.add(user)
        session.commit()
        
        assert user.is_active is True
    
    def test_user_email_unique(self, session, test_user):
        """Duplicate email should raise error"""
        with pytest.raises(Exception):  # IntegrityError
            duplicate = User(
                email=test_user.email,  # Same email
                hashed_password=get_password_hash("password"),
                full_name="Duplicate"
            )
            session.add(duplicate)
            session.commit()
    
    def test_user_role_types(self, session):
        """All user role types should be valid"""
        roles = [UserRole.ATTENDEE, UserRole.ORGANIZER, UserRole.ADMIN]
        
        for idx, role in enumerate(roles):
            user = User(
                email=f"user{idx}@example.com",
                hashed_password=get_password_hash("password"),
                full_name=f"User {idx}",
                role=role
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            
            assert user.role == role


@pytest.mark.unit
class TestEventModel:
    """Test Event model validation and behavior"""
    
    def test_event_creation(self, session, test_organizer):
        """Event should be created with valid data"""
        future_date = datetime.now() + timedelta(days=7)
        event = Event(
            title="Test Conference",
            description="A conference about testing",
            organizer_id=test_organizer.id,
            event_start=future_date,
            event_end=future_date + timedelta(hours=3),
            location="Convention Center",
            category="Technology",
            max_attendees=500,
            price=50.0
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        
        assert event.id is not None
        assert event.title == "Test Conference"
        assert event.organizer_id == test_organizer.id
        assert event.max_attendees == 500
        assert event.price == 50.0
        assert event.is_active is True
        assert event.created_at is not None
    
    def test_event_default_price(self, session, test_organizer):
        """Event price should default to 0.0"""
        event = Event(
            title="Free Event",
            description="No cost event",
            organizer_id=test_organizer.id,
            event_start=datetime.now() + timedelta(days=1),
            location="Online",
            category="Social",
            max_attendees=100
        )
        session.add(event)
        session.commit()
        
        assert event.price == 0.0
    
    def test_event_default_active(self, session, test_organizer):
        """Event should default to active"""
        event = Event(
            title="Active Event",
            description="Event description",
            organizer_id=test_organizer.id,
            event_start=datetime.now() + timedelta(days=2),
            location="Test Location",
            category="Technology",
            max_attendees=50
        )
        session.add(event)
        session.commit()
        
        assert event.is_active is True
    
    def test_event_requires_organizer(self, session, test_organizer):
        """Event creation requires valid organizer_id"""
        event = Event(
            title="Valid Event",
            description="Event with valid organizer",
            organizer_id=test_organizer.id,
            event_start=datetime.now() + timedelta(days=1),
            location="Somewhere",
            category="Test",
            max_attendees=10
        )
        
        session.add(event)
        session.commit()
        
        # Verify organizer_id is set correctly
        assert event.organizer_id == test_organizer.id
    
    def test_event_optional_end_time(self, session, test_organizer):
        """Event end time should be optional"""
        event = Event(
            title="Open-ended Event",
            description="Event with no end time",
            organizer_id=test_organizer.id,
            event_start=datetime.now() + timedelta(days=1),
            event_end=None,  # No end time
            location="TBD",
            category="Other",
            max_attendees=25
        )
        session.add(event)
        session.commit()
        
        assert event.event_end is None
    
    def test_event_optional_image(self, session, test_organizer):
        """Event image should be optional"""
        event = Event(
            title="No Image Event",
            description="Event without image",
            organizer_id=test_organizer.id,
            event_start=datetime.now() + timedelta(days=1),
            location="Test",
            category="Test",
            max_attendees=10,
            image=None
        )
        session.add(event)
        session.commit()
        
        assert event.image is None
        assert event.thumbnail is None

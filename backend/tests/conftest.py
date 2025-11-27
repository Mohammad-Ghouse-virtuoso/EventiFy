"""
Pytest configuration and shared fixtures for EventiFy backend tests.
"""

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import os

# Set test environment BEFORE importing app modules
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["LOGIN_RATE_LIMIT_PER_MINUTE"] = "1000"  # High limit for tests

# Now import app modules
from app.main import app
from app.db.database import get_session
from app.models.user import User
from app.models.event import Event
from app.models.rsvp import RSVP
from app.core.auth import get_password_hash, create_access_token

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """Create test database engine (session-scoped)"""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def session(engine):
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(session):
    """FastAPI test client with overridden database session"""
    def override_get_session():
        yield session
    
    app.dependency_overrides[get_session] = override_get_session
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(session):
    """Create a test user (attendee)"""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role="attendee",
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def test_organizer(session):
    """Create a test organizer user"""
    user = User(
        email="organizer@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Organizer",
        role="organizer",
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def test_admin(session):
    """Create a test admin user"""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test Admin",
        role="admin",
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Generate auth headers for test user"""
    token = create_access_token(data={"sub": str(test_user.id)}, user=test_user)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def organizer_headers(test_organizer):
    """Generate auth headers for organizer"""
    token = create_access_token(data={"sub": str(test_organizer.id)}, user=test_organizer)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin):
    """Generate auth headers for admin"""
    token = create_access_token(data={"sub": str(test_admin.id)}, user=test_admin)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_event(session, test_organizer):
    """Create a test event"""
    future_date = datetime.utcnow() + timedelta(days=7)
    event = Event(
        title="Test Event",
        description="This is a test event for testing purposes",
        organizer_id=test_organizer.id,
        event_start=future_date,
        event_end=future_date + timedelta(hours=2),
        location="Test Location, 123 Test St",
        category="Technology",
        max_attendees=100,
        price=0.0,
        requires_approval=False,
        is_active=True
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@pytest.fixture
def test_past_event(session, test_organizer):
    """Create a past event"""
    past_date = datetime.utcnow() - timedelta(days=7)
    event = Event(
        title="Past Test Event",
        description="This is a past test event",
        organizer_id=test_organizer.id,
        event_start=past_date,
        event_end=past_date + timedelta(hours=2),
        location="Test Location",
        category="Social",
        max_attendees=50,
        price=0.0,
        is_active=True
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@pytest.fixture
def test_rsvp(session, test_user, test_event):
    """Create a test RSVP"""
    from app.models.rsvp import RSVPStatus
    rsvp = RSVP(
        user_id=test_user.id,
        event_id=test_event.id,
        status=RSVPStatus.GOING,
        checked_in=False
    )
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    return rsvp


# Pytest markers
def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")

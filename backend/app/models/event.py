from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class EventBase(SQLModel):
    title: str
    description: str
    category: str
    event_start: datetime
    event_end: Optional[datetime] = None
    location: str
    timezone: Optional[str] = "UTC"  # IANA timezone (e.g., America/Chicago)
    max_attendees: int
    price: float = 0.0
    image: Optional[str] = None  # URL for event banner/image
    thumbnail: Optional[str] = None  # URL for small card thumbnail
    requires_approval: bool = False  # Whether RSVPs need admin approval
    terms_and_conditions: Optional[str] = None  # T&C for the event
    organizer_bio: Optional[str] = None  # About the organizer
    organizer_contact: Optional[str] = None  # Contact email or info

class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")
    organizer_email: Optional[str] = None  # Denormalized for quick filtering
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    is_evergreen: bool = False  # True for auto-populated recurring events
    tags: Optional[str] = None  # JSON array or comma-separated tags
    last_refreshed_at: Optional[datetime] = None  # Last time banners/NPCs were auto-refreshed

class EventCreate(EventBase):
    pass

class EventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_start: Optional[datetime] = None
    event_end: Optional[datetime] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    max_attendees: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None  # URL for event banner/image
    thumbnail: Optional[str] = None  # URL for small card thumbnail
    requires_approval: Optional[bool] = None  # Whether RSVPs need admin approval
    terms_and_conditions: Optional[str] = None  # T&C for the event
    organizer_bio: Optional[str] = None  # About the organizer
    organizer_contact: Optional[str] = None  # Contact email or info


class EventOut(EventBase):
    """Public-facing event model enriched with organizer meta info."""
    id: int
    organizer_id: int
    organizer_name: str
    organizer_role: str
    organizer_email: Optional[str] = None
    created_at: datetime
    is_active: bool
    is_evergreen: bool = False
    tags: Optional[str] = None
    last_refreshed_at: Optional[datetime] = None
    # Optional convenience field used by UI; backend may leave it unset
    attendees_count: Optional[int] = 0
    # Real-time convenience fields for "What's Happening Now"
    time_until_start_seconds: Optional[int] = None
    urgency_level: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    organizer_bio: Optional[str] = None
    organizer_contact: Optional[str] = None
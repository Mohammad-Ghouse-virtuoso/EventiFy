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
    max_attendees: int
    price: float = 0.0
    image: Optional[str] = None  # URL for event banner/image
    thumbnail: Optional[str] = None  # URL for small card thumbnail
    requires_approval: bool = False  # Whether RSVPs need admin approval

class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class EventCreate(EventBase):
    pass

class EventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_start: Optional[datetime] = None
    event_end: Optional[datetime] = None
    location: Optional[str] = None
    max_attendees: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None  # URL for event banner/image
    thumbnail: Optional[str] = None  # URL for small card thumbnail
    requires_approval: Optional[bool] = None  # Whether RSVPs need admin approval


class EventOut(EventBase):
    """Public-facing event model enriched with organizer meta info."""
    id: int
    organizer_id: int
    organizer_name: str
    organizer_role: str
    created_at: datetime
    is_active: bool
    # Optional convenience field used by UI; backend may leave it unset
    attendees_count: Optional[int] = 0
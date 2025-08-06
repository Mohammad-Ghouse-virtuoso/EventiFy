from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class EventBase(SQLModel):
    title: str
    description: str
    date: datetime
    location: str
    max_attendees: int
    price: float = 0.0

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
    date: Optional[datetime] = None
    location: Optional[str] = None
    max_attendees: Optional[int] = None
    price: Optional[float] = None
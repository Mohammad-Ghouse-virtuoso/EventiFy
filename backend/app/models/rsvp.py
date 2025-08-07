from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class RSVPStatus(str, Enum):
    GOING = "going"
    INTERESTED = "interested"
    NOT_GOING = "not_going"

class RSVPBase(SQLModel):
    status: RSVPStatus
    notes: Optional[str] = None

class RSVP(RSVPBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None

class RSVPCreate(RSVPBase):
    pass  # event_id comes from URL path parameter

class RSVPUpdate(SQLModel):
    status: Optional[RSVPStatus] = None
    notes: Optional[str] = None

class RSVPResponse(RSVPBase):
    id: int
    user_id: int
    event_id: int
    created_at: datetime
    updated_at: datetime
    checked_in: bool
    checked_in_at: Optional[datetime] = None

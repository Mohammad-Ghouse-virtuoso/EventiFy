from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import sqlalchemy as sa

class RSVPStatus(str, Enum):
    GOING = "going"
    MAYBE = "maybe"
    NOT_GOING = "not_going"
    WAITING_FOR_APPROVAL = "waiting_for_approval"
    APPROVED = "approved"
    REJECTED = "rejected"

class RSVPBase(SQLModel):
    # Persist as VARCHAR to avoid DB-native ENUM type; application still uses Python Enum
    status: RSVPStatus = Field(sa_column=sa.Column(sa.String(32), nullable=False))
    notes: Optional[str] = None

class RSVP(RSVPBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    approved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    approved_at: Optional[datetime] = None

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
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import sqlalchemy as sa

class UserRole(str, Enum):
    ATTENDEE = "attendee"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    # Persist as VARCHAR to avoid DB-native ENUM requirements; keep Python Enum for app logic
    role: UserRole = Field(
        default=UserRole.ATTENDEE,
        sa_column=sa.Column(sa.String(20), nullable=False),
    )
    is_active: bool = True

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    password: str

class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
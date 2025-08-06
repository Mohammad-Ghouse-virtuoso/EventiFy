from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class CommentBase(SQLModel):
    content: str
    rating: Optional[int] = Field(default=None, ge=1, le=5)  # 1-5 star rating

class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_approved: bool = True  # For moderation

class CommentCreate(CommentBase):
    event_id: int

class CommentUpdate(SQLModel):
    content: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)

class CommentResponse(CommentBase):
    id: int
    user_id: int
    event_id: int
    created_at: datetime
    updated_at: datetime
    is_approved: bool
    # Include user info in response
    user_name: Optional[str] = None

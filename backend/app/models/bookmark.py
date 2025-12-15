from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

class UserBookmark(SQLModel, table=True):
    """User bookmark model - tracks which events users have bookmarked"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    event_id: int = Field(foreign_key="event.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    __tablename__ = "user_bookmarks"

class BookmarkResponse(SQLModel):
    """Response format for bookmark operations"""
    message: str
    id: int

class IsBookmarkedResponse(SQLModel):
    """Response for checking if event is bookmarked"""
    is_bookmarked: bool

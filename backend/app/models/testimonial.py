from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import sqlalchemy as sa


class TestimonialBase(SQLModel):
    quote: str = Field(min_length=10, max_length=500)
    rating: int = Field(ge=1, le=5)
    # Optional linkage to a specific event
    event_id: Optional[int] = Field(default=None, foreign_key="event.id")
    # Optional user-provided avatar URL; frontend will auto-generate fallback if missing
    avatar_url: Optional[str] = None


class Testimonial(TestimonialBase, table=True):
    __tablename__ = "testimonials"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")

    is_approved: bool = Field(default=False)
    is_featured: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TestimonialCreate(TestimonialBase):
    # Require event_id for submission to enforce RSVP verification
    event_id: int


class TestimonialUpdate(SQLModel):
    quote: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    is_approved: Optional[bool] = None
    is_featured: Optional[bool] = None


class TestimonialOut(TestimonialBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_approved: bool
    is_featured: bool
    # Denormalized for UI
    user_name: Optional[str] = None
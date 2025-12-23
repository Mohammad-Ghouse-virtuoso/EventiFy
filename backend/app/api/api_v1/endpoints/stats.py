"""Public statistics endpoints for social proof on homepage."""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select, func, desc
from app.db.database import get_session
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["stats"])


class StatsSummary(BaseModel):
    """Summary statistics for the platform."""
    total_events: int
    events_this_month: int
    total_users: int
    total_rsvps: int


class RecentActivityItem(BaseModel):
    """A single recent activity item (anonymized)."""
    user_initial: str  # First letter of name
    user_name_partial: str  # "Sarah R."
    event_title: str
    action: str  # "RSVP'd", "created", etc.
    time_ago: str  # "2 minutes ago"


class TrendingEventItem(BaseModel):
    """A trending event with attendee count."""
    id: int
    title: str
    category: str
    location: str
    event_start: datetime
    attendees_count: int
    image: Optional[str] = None
    thumbnail: Optional[str] = None


@router.get("/summary", response_model=StatsSummary)
async def get_stats_summary(session: Session = Depends(get_session)):
    """Get platform-wide statistics for social proof."""
    now = datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count active events
    total_events = session.exec(
        select(func.count(Event.id)).where(Event.is_active == True)
    ).one()
    
    # Count events created this month
    events_this_month = session.exec(
        select(func.count(Event.id)).where(
            Event.created_at >= first_of_month,
            Event.is_active == True
        )
    ).one()
    
    # Count active users
    total_users = session.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).one()
    
    # Count confirmed RSVPs (going + approved)
    total_rsvps = session.exec(
        select(func.count(RSVP.id)).where(
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED])
        )
    ).one()
    
    return StatsSummary(
        total_events=total_events or 0,
        events_this_month=events_this_month or 0,
        total_users=total_users or 0,
        total_rsvps=total_rsvps or 0
    )


def _time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable 'X ago' string."""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "just now"


def _anonymize_name(full_name: str) -> tuple[str, str]:
    """Convert full name to anonymized format: ('S', 'Sarah R.')"""
    if not full_name:
        return ("U", "User")
    
    parts = full_name.strip().split()
    first_name = parts[0]
    initial = first_name[0].upper()
    
    if len(parts) > 1:
        last_initial = parts[-1][0].upper()
        return (initial, f"{first_name} {last_initial}.")
    else:
        return (initial, first_name)


@router.get("/recent-activity", response_model=List[RecentActivityItem])
async def get_recent_activity(
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """Get recent RSVP activity for social proof feed."""
    # Get recent RSVPs with user and event info
    recent_rsvps = session.exec(
        select(RSVP, User, Event)
        .join(User, RSVP.user_id == User.id)
        .join(Event, RSVP.event_id == Event.id)
        .where(
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
            Event.is_active == True
        )
        .order_by(desc(RSVP.created_at))
        .limit(limit)
    ).all()
    
    activities = []
    for rsvp, user, event in recent_rsvps:
        initial, partial_name = _anonymize_name(user.full_name)
        activities.append(RecentActivityItem(
            user_initial=initial,
            user_name_partial=partial_name,
            event_title=event.title,
            action="RSVP'd to",
            time_ago=_time_ago(rsvp.created_at)
        ))
    
    return activities


@router.get("/trending", response_model=List[TrendingEventItem])
async def get_trending_events(
    limit: int = 5,
    session: Session = Depends(get_session)
):
    """Get trending events sorted by attendee count."""
    now = datetime.utcnow()
    
    # Get upcoming active events with RSVP counts
    # Using subquery for attendee count
    events = session.exec(
        select(Event).where(
            Event.is_active == True,
            Event.event_start >= now  # Only upcoming events
        )
    ).all()
    
    # Calculate attendee counts for each event
    trending = []
    for event in events:
        attendees_count = session.exec(
            select(func.count(RSVP.id)).where(
                RSVP.event_id == event.id,
                RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED])
            )
        ).one() or 0
        
        trending.append(TrendingEventItem(
            id=event.id,
            title=event.title,
            category=event.category,
            location=event.location,
            event_start=event.event_start,
            attendees_count=attendees_count,
            image=event.image,
            thumbnail=event.thumbnail
        ))
    
    # Sort by attendee count descending, then by event_start
    trending.sort(key=lambda x: (-x.attendees_count, x.event_start))
    
    return trending[:limit]

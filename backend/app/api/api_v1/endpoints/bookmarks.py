from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.bookmark import UserBookmark, BookmarkResponse, IsBookmarkedResponse
from app.models.event import Event
from app.core.auth import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1", tags=["bookmarks"])

@router.post("/events/{event_id}/bookmark")
async def bookmark_event(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Bookmark an event for the current user"""
    
    # Check if event exists
    event = session.exec(
        select(Event).where(Event.id == event_id)
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check if already bookmarked
    existing = session.exec(
        select(UserBookmark).where(
            (UserBookmark.user_id == current_user.id) &
            (UserBookmark.event_id == event_id)
        )
    ).first()
    
    if existing:
        # Already bookmarked, return 200 (idempotent)
        return {"message": "Event already bookmarked", "id": existing.id}
    
    # Create new bookmark
    bookmark = UserBookmark(
        user_id=current_user.id,
        event_id=event_id
    )
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    
    return BookmarkResponse(
        message="Event bookmarked",
        id=bookmark.id
    )

@router.delete("/events/{event_id}/bookmark")
async def unbookmark_event(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Remove bookmark for the current user"""
    
    bookmark = session.exec(
        select(UserBookmark).where(
            (UserBookmark.user_id == current_user.id) &
            (UserBookmark.event_id == event_id)
        )
    ).first()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    session.delete(bookmark)
    session.commit()
    
    return {"message": "Bookmark removed"}

@router.get("/events/{event_id}/bookmark/status")
async def check_bookmark_status(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Check if current user has bookmarked this event"""
    
    bookmark = session.exec(
        select(UserBookmark).where(
            (UserBookmark.user_id == current_user.id) &
            (UserBookmark.event_id == event_id)
        )
    ).first()
    
    return IsBookmarkedResponse(is_bookmarked=bookmark is not None)

@router.get("/user/bookmarks")
async def get_user_bookmarks(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all bookmarked events for current user"""
    
    bookmarks = session.exec(
        select(UserBookmark).where(
            UserBookmark.user_id == current_user.id
        ).order_by(UserBookmark.created_at.desc())
    ).all()
    
    # Get associated events
    event_ids = [b.event_id for b in bookmarks]
    if not event_ids:
        return []
    
    events = session.exec(
        select(Event).where(Event.id.in_(event_ids))
    ).all()
    
    # Format response with event details
    result = []
    for bookmark in bookmarks:
        event = next((e for e in events if e.id == bookmark.event_id), None)
        if event:
            result.append({
                "id": event.id,
                "title": event.title,
                "date": event.event_start,
                "location": event.location,
                "image": event.image,
                "category": event.category,
                "bookmarked_at": bookmark.created_at
            })
    
    return result

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.event import Event, EventCreate, EventUpdate
from app.models.user import User
from app.models.rsvp import RSVP, RSVPCreate, RSVPUpdate, RSVPStatus
from app.core.auth import get_current_active_user, require_organizer_or_admin

router = APIRouter()

@router.get("/", response_model=List[Event])
@router.get("", response_model=List[Event])  # Handle both with and without trailing slash
async def get_events(
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    date: Optional[str] = None,
    location: Optional[str] = None,
    created_by: Optional[int] = None,
    rsvp_status: Optional[str] = None
):
    statement = select(Event).where(Event.is_active == True)

    # Search filter
    if search:
        statement = statement.where(
            Event.title.contains(search) | Event.description.contains(search)
        )

    # Category filter
    if category:
        statement = statement.where(Event.category.ilike(f"%{category}%"))

    # Date filter (events on the specified date only)
    if date:
        try:
            from datetime import datetime, timedelta
            filter_date = datetime.fromisoformat(date)
            next_day = filter_date + timedelta(days=1)
            statement = statement.where(
                (Event.date >= filter_date) & (Event.date < next_day)
            )
        except ValueError:
            pass  # Invalid date format, ignore filter

    # Location filter
    if location:
        statement = statement.where(Event.location.ilike(f"%{location}%"))

    # Created by filter (for dashboard)
    if created_by:
        statement = statement.where(Event.organizer_id == created_by)

    # RSVP status filter (for dashboard - events user has RSVP'd to)
    if rsvp_status:
        from app.models.rsvp import RSVP
        statement = statement.join(RSVP).where(RSVP.status == rsvp_status)

    statement = statement.offset(skip).limit(limit)
    events = session.exec(statement).all()
    return events

@router.get("/{event_id}", response_model=Event)
async def get_event(
    event_id: int,
    session: Session = Depends(get_session)
):
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event

@router.post("/", response_model=Event)
@router.post("", response_model=Event)  # Handle both with and without trailing slash
async def create_event(
    event_data: EventCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_organizer_or_admin)
):
    db_event = Event(
        **event_data.dict(),
        organizer_id=current_user.id
    )

    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@router.put("/{event_id}", response_model=Event)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is the organizer or admin
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this event"
        )

    update_data = event_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is the organizer or admin
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this event"
        )

    event.is_active = False
    session.add(event)
    session.commit()
    return {"message": "Event deleted successfully"}

@router.post("/{event_id}/rsvp")
async def rsvp_to_event(
    event_id: int,
    rsvp_data: RSVPCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    # Check if event exists
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user already has an RSVP
    statement = select(RSVP).where(
        RSVP.user_id == current_user.id,
        RSVP.event_id == event_id
    )
    existing_rsvp = session.exec(statement).first()

    if existing_rsvp:
        # Update existing RSVP
        existing_rsvp.status = rsvp_data.status
        existing_rsvp.notes = rsvp_data.notes
        session.add(existing_rsvp)
        session.commit()
        session.refresh(existing_rsvp)
        return existing_rsvp
    else:
        # Create new RSVP
        db_rsvp = RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status=rsvp_data.status,
            notes=rsvp_data.notes
        )
        session.add(db_rsvp)
        session.commit()
        session.refresh(db_rsvp)
        return db_rsvp

@router.get("/{event_id}/rsvps")
async def get_event_rsvps(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    # Check if event exists
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # If user is organizer or admin, return all RSVPs
    if event.organizer_id == current_user.id or current_user.role == "admin":
        # Get RSVPs with user information for organizer/admin
        statement = select(RSVP, User).join(User).where(RSVP.event_id == event_id)
        results = session.exec(statement).all()
        
        rsvps_with_users = []
        for rsvp, user in results:
            rsvp_dict = {
                "id": rsvp.id,
                "user_id": rsvp.user_id,
                "event_id": rsvp.event_id,
                "status": rsvp.status,
                "notes": rsvp.notes,
                "created_at": rsvp.created_at,
                "updated_at": rsvp.updated_at,
                "checked_in": rsvp.checked_in,
                "checked_in_at": rsvp.checked_in_at,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role
                }
            }
            rsvps_with_users.append(rsvp_dict)
        
        return rsvps_with_users
    
    else:
        # For regular users, only return their own RSVP
        statement = select(RSVP).where(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id
        )
        user_rsvp = session.exec(statement).first()
        
        if user_rsvp:
            return [{
                "id": user_rsvp.id,
                "user_id": user_rsvp.user_id,
                "event_id": user_rsvp.event_id,
                "status": user_rsvp.status,
                "notes": user_rsvp.notes,
                "created_at": user_rsvp.created_at,
                "updated_at": user_rsvp.updated_at,
                "checked_in": user_rsvp.checked_in,
                "checked_in_at": user_rsvp.checked_in_at
            }]
        else:
            return []
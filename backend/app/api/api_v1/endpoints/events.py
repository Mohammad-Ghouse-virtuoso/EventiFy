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
async def get_events(
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None
):
    statement = select(Event).where(Event.is_active == True)

    if search:
        statement = statement.where(
            Event.title.contains(search) | Event.description.contains(search)
        )

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
    # Check if event exists and user is organizer or admin
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view RSVPs for this event"
        )

    statement = select(RSVP).where(RSVP.event_id == event_id)
    rsvps = session.exec(statement).all()
    return rsvps
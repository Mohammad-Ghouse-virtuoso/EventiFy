from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_session
from app.models.event import Event, EventCreate, EventUpdate, EventOut
from app.models.user import User
from app.models.rsvp import RSVP, RSVPCreate, RSVPUpdate, RSVPStatus
from app.core.auth import get_current_active_user, require_organizer_or_admin, require_admin
from app.core.config import settings
from app.core.npc_generator import inject_npcs_into_attendees
from sqlalchemy import func, exists, select as sa_select

router = APIRouter()

# 🎭 Event-specific NPC configurations (event_id: npc_count)
SPECIAL_NPC_COUNTS = {
    17: 43,  # Heema's Choir Show - 43 NPCs + 2 real (latha + Jamie) = 45 total
}

@router.get("/", response_model=List[EventOut])
@router.get("", response_model=List[EventOut])  # Handle both with and without trailing slash
async def get_events(
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    date: Optional[str] = None,
    location: Optional[str] = None,
    created_by: Optional[int] = None,
    rsvp_status: Optional[str] = None,
    rsvp_user_id: Optional[int] = None,
    include_past: bool = False,
    include_inactive: bool = False,
):
    # Auto-expire events: if their end time is past now (or start time if no end), mark inactive
    now = datetime.utcnow()
    expired_events = session.exec(
        select(Event).where(
            Event.is_active == True,
            (
                ((Event.event_end != None) & (Event.event_end < now))
                | ((Event.event_end == None) & (Event.event_start < now))
            ),
        )
    ).all()
    if expired_events:
        for ev in expired_events:
            ev.is_active = False
            session.add(ev)
        session.commit()

    # Build base filters
    conditions = []
    if not include_inactive:
        conditions.append(Event.is_active == True)

    # Hide past events by default unless include_past is true
    if not include_past:
        # Include events where (event_end >= now) OR (event_end is null AND event_start >= now)
        conditions.append(
            (((Event.event_end != None) & (Event.event_end >= now)) | ((Event.event_end == None) & (Event.event_start >= now)))
        )

    if search:
        conditions.append(Event.title.contains(search) | Event.description.contains(search))

    if category:
        conditions.append(Event.category.ilike(f"%{category}%"))

    if date:
        try:
            filter_date = datetime.fromisoformat(date)
            next_day = filter_date + timedelta(days=1)
            conditions.append((Event.event_start >= filter_date) & (Event.event_start < next_day))
        except ValueError:
            # Invalid date format, ignore filter
            pass

    if location:
        conditions.append(Event.location.ilike(f"%{location}%"))

    if created_by:
        conditions.append(Event.organizer_id == created_by)

    if rsvp_status:
        # Support comma-separated statuses (e.g., "going,approved")
        raw_statuses = [s.strip() for s in str(rsvp_status).split(',') if s and s.strip()]
        # Map raw strings to enum values when possible, otherwise keep as raw string for comparison
        statuses: list = []
        for s in raw_statuses:
            try:
                statuses.append(RSVPStatus(s))
            except Exception:
                statuses.append(s)

        rsvp_conditions = [RSVP.event_id == Event.id]
        if statuses:
            rsvp_conditions.append(RSVP.status.in_(statuses))
        if rsvp_user_id is not None:
            rsvp_conditions.append(RSVP.user_id == rsvp_user_id)

        conditions.append(
            exists(
                sa_select(1)
                .select_from(RSVP)
                .where(*rsvp_conditions)
            )
        )
    elif rsvp_user_id is not None:
        # Filter events that the specific user has any RSVP for
        conditions.append(
            exists(
                sa_select(1)
                .select_from(RSVP)
                .where(RSVP.event_id == Event.id, RSVP.user_id == rsvp_user_id)
            )
        )

    # Subquery for attendees count per event
    # Count only confirmed attendees (exclude maybe, not_going, waiting, rejected)
    counts_sq = (
        sa_select(
            RSVP.event_id.label("eid"),
            func.count(1).label("attendees_count"),
        )
        .where(RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]))
        .group_by(RSVP.event_id)
        .subquery()
    )

    # Single query: Event + Organizer(User) + RSVP counts
    query = (
        sa_select(
            Event,
            User.full_name.label("organizer_name"),
            User.role.label("organizer_role"),
            counts_sq.c.attendees_count,
        )
        .join(User, User.id == Event.organizer_id)
        .outerjoin(counts_sq, counts_sq.c.eid == Event.id)
        .where(*conditions)
        .order_by(Event.event_start.desc())
        .offset(skip)
        .limit(limit)
    )

    rows = session.exec(query).all()
    if not rows:
        return []

    # Build response objects
    event_out_list: List[EventOut] = []
    for (ev, organizer_name, organizer_role, attendees_count) in rows:
        # Normalize role to plain lowercase string
        try:
            role_value = str(organizer_role.value).lower()  # Enum -> str
        except AttributeError:
            role_value = str(organizer_role).lower() if organizer_role is not None else "attendee"

        # Include NPC count if configured for this event
        real_count = attendees_count or 0
        npc_count = SPECIAL_NPC_COUNTS.get(ev.id, 0)
        total_attendees = real_count + npc_count

        event_out_list.append(
            EventOut(
                id=ev.id,
                title=ev.title,
                description=ev.description,
                category=ev.category,
                event_start=ev.event_start,
                event_end=ev.event_end,
                location=ev.location,
                max_attendees=ev.max_attendees,
                price=ev.price,
                image=ev.image,
                thumbnail=ev.thumbnail,
                requires_approval=ev.requires_approval,
                organizer_id=ev.organizer_id,
                organizer_name=organizer_name or "Unknown",
                organizer_role=role_value or "attendee",
                created_at=ev.created_at,
                is_active=ev.is_active,
                attendees_count=total_attendees,
            )
        )
    return event_out_list

@router.get("/{event_id}", response_model=EventOut)
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
    organizer = session.get(User, event.organizer_id)
    # Count only confirmed attendees
    attendees_count = session.exec(
        select(RSVP).where(
            RSVP.event_id == event.id,
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
        )
    ).all()
    
    # Include NPC count if configured for this event
    real_count = len(attendees_count)
    npc_count = SPECIAL_NPC_COUNTS.get(event.id, 0)
    total_attendees = real_count + npc_count
    
    # Normalize role to plain string
    if organizer:
        try:
            role_value = str(organizer.role.value).lower()
        except AttributeError:
            role_value = str(organizer.role).lower()
    else:
        role_value = "attendee"
    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        category=event.category,
    event_start=event.event_start,
    event_end=event.event_end,
        location=event.location,
        max_attendees=event.max_attendees,
        price=event.price,
    image=event.image,
    thumbnail=event.thumbnail,
        requires_approval=event.requires_approval,
        organizer_id=event.organizer_id,
    organizer_name=organizer.full_name if organizer else "Unknown",
    organizer_role=role_value,
        created_at=event.created_at,
        is_active=event.is_active,
        attendees_count=total_attendees
    )


# Original JSON endpoint (for banner selection)
@router.post("/", response_model=EventOut)
@router.post("", response_model=EventOut)  # Handle both with and without trailing slash
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
    organizer = session.get(User, db_event.organizer_id)
    if organizer:
        try:
            role_value = str(organizer.role.value).lower()
        except AttributeError:
            role_value = str(organizer.role).lower()
    else:
        role_value = "attendee"
    return EventOut(
        id=db_event.id,
        title=db_event.title,
        description=db_event.description,
        category=db_event.category,
        event_start=db_event.event_start,
        event_end=db_event.event_end,
        location=db_event.location,
        max_attendees=db_event.max_attendees,
        price=db_event.price,
    image=db_event.image,
    thumbnail=db_event.thumbnail,
        requires_approval=db_event.requires_approval,
        organizer_id=db_event.organizer_id,
    organizer_name=organizer.full_name if organizer else "Unknown",
    organizer_role=role_value,
        created_at=db_event.created_at,
        is_active=db_event.is_active,
        attendees_count=0
    )

# New endpoint for file upload (cover image)
@router.post("/upload", response_model=EventOut)
async def create_event_with_image(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    event_start: str = Form(...),
    event_end: Optional[str] = Form(None),
    location: str = Form(...),
    max_attendees: int = Form(...),
    price: float = Form(0.0),
    requires_approval: bool = Form(False),
    image: UploadFile = File(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_organizer_or_admin)
):
    import os
    from datetime import datetime
    from io import BytesIO
    from PIL import Image
    # Save image if provided
    image_url = None
    thumb_url = None
    if image:
        ext = os.path.splitext(image.filename)[-1]
        ts = int(datetime.utcnow().timestamp())
        filename = f"event_{ts}{ext}"
        # Save under configured static directory
        save_dir = os.path.join(os.path.abspath(settings.STATIC_DIR), "event_images")
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)
        raw_bytes = await image.read()
        with open(file_path, "wb") as f:
            f.write(raw_bytes)
        # Use configured BASE_URL for the image URL
        image_url = f"{settings.BASE_URL.rstrip('/')}/static/event_images/{filename}"

        # Generate a compressed thumbnail (e.g., 300x200)
        try:
            thumb_dir = os.path.join(save_dir, 'thumbs')
            os.makedirs(thumb_dir, exist_ok=True)
            thumb_name = f"event_{ts}_thumb.jpg"
            thumb_path = os.path.join(thumb_dir, thumb_name)
            im = Image.open(BytesIO(raw_bytes)).convert('RGB')
            # Center-crop to cover 3:2 ratio, then resize
            target_w, target_h = 300, 200
            src_w, src_h = im.size
            target_ratio = target_w / target_h
            src_ratio = src_w / src_h
            if src_ratio > target_ratio:
                # source wider: crop width
                new_w = int(src_h * target_ratio)
                left = (src_w - new_w) // 2
                im = im.crop((left, 0, left + new_w, src_h))
            else:
                # source taller: crop height
                new_h = int(src_w / target_ratio)
                top = (src_h - new_h) // 2
                im = im.crop((0, top, src_w, top + new_h))
            im = im.resize((target_w, target_h), Image.LANCZOS)
            im.save(thumb_path, format='JPEG', quality=78, optimize=True)
            thumb_url = f"{settings.BASE_URL.rstrip('/')}/static/event_images/thumbs/{thumb_name}"
        except Exception as e:
            # If thumbnail generation fails, fall back silently
            thumb_url = None

    db_event = Event(
        title=title,
        description=description,
        category=category,
        event_start=datetime.fromisoformat(event_start),
        event_end=datetime.fromisoformat(event_end) if event_end else None,
        location=location,
        max_attendees=max_attendees,
        price=price,
        image=image_url,
        thumbnail=thumb_url,
        requires_approval=requires_approval,
        organizer_id=current_user.id
    )
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    organizer = session.get(User, db_event.organizer_id)
    if organizer:
        try:
            role_value = organizer.role.value
        except AttributeError:
            role_value = organizer.role
    else:
        role_value = "attendee"
    return EventOut(
        id=db_event.id,
        title=db_event.title,
        description=db_event.description,
        category=db_event.category,
    event_start=db_event.event_start,
    event_end=db_event.event_end,
        location=db_event.location,
        max_attendees=db_event.max_attendees,
        price=db_event.price,
        image=db_event.image,
        thumbnail=db_event.thumbnail,
        requires_approval=db_event.requires_approval,
        organizer_id=db_event.organizer_id,
    organizer_name=organizer.full_name if organizer else "Unknown",
    organizer_role=role_value,
        created_at=db_event.created_at,
        is_active=db_event.is_active,
        attendees_count=0
    )

@router.put("/{event_id}", response_model=EventOut)
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
    # Normalize role for comparison
    _role = getattr(current_user.role, "value", current_user.role)
    current_role = str(_role).lower() if _role is not None else "attendee"
    if event.organizer_id != current_user.id and current_role != "admin":
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
    organizer = session.get(User, event.organizer_id)
    # Count only confirmed attendees
    attendees_count = session.exec(
        select(RSVP).where(
            RSVP.event_id == event.id,
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
        )
    ).all()
    if organizer:
        try:
            role_value = str(organizer.role.value).lower()
        except AttributeError:
            role_value = str(organizer.role).lower()
    else:
        role_value = "attendee"
    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        category=event.category,
    event_start=event.event_start,
    event_end=event.event_end,
        location=event.location,
        max_attendees=event.max_attendees,
        price=event.price,
    image=event.image,
    thumbnail=event.thumbnail,
        requires_approval=event.requires_approval,
        organizer_id=event.organizer_id,
        organizer_name=organizer.full_name if organizer else "Unknown",
        organizer_role=role_value,
        created_at=event.created_at,
        is_active=event.is_active,
        attendees_count=len(attendees_count)
    )

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
    _role = getattr(current_user.role, "value", current_user.role)
    current_role = str(_role).lower() if _role is not None else "attendee"
    if event.organizer_id != current_user.id and current_role != "admin":
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
    # Business rule: Admins should not RSVP to events
    try:
        _role = getattr(current_user.role, "value", current_user.role)
    except Exception:
        _role = current_user.role
    current_role = str(_role).lower() if _role is not None else "attendee"
    if current_role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot RSVP to events"
        )

    # Check if event exists
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user already has an RSVP (exists/first)
    statement = (
        select(RSVP)
        .where(RSVP.user_id == current_user.id, RSVP.event_id == event_id)
        .limit(1)
    )
    existing_rsvp = session.exec(statement).first()

    # Determine the actual status to set based on event approval requirements
    # Disallow clients from directly setting APPROVED/REJECTED; use admin endpoints instead
    if rsvp_data.status in [RSVPStatus.APPROVED, RSVPStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid RSVP status change"
        )
    actual_status = rsvp_data.status
    if event.requires_approval and rsvp_data.status in [RSVPStatus.GOING, RSVPStatus.MAYBE]:
        # For approval-required events, convert intent to waiting state
        actual_status = RSVPStatus.WAITING_FOR_APPROVAL
    elif not event.requires_approval and rsvp_data.status == RSVPStatus.GOING:
        # For non-approval events, prevent overbooking when marking as going
        confirmed_count = session.exec(
            select(RSVP).where(
                RSVP.event_id == event.id,
                RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
            )
        ).all()
        if event.max_attendees is not None and len(confirmed_count) >= event.max_attendees:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event is full. Cannot RSVP as 'going'."
            )

    if existing_rsvp:
        # Update existing RSVP
        # If changing away from APPROVED, clear approval metadata
        if existing_rsvp.status == RSVPStatus.APPROVED and actual_status != RSVPStatus.APPROVED:
            existing_rsvp.approved_by = None
            existing_rsvp.approved_at = None
        # If switching to GOING on non-approval events, re-validate capacity
        if not event.requires_approval and actual_status == RSVPStatus.GOING:
            confirmed_count = session.exec(
                select(RSVP).where(
                    RSVP.event_id == event.id,
                    RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
                )
            ).all()
            if event.max_attendees is not None and len(confirmed_count) >= event.max_attendees:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Event is full. Cannot RSVP as 'going'."
                )
        existing_rsvp.status = actual_status
        existing_rsvp.notes = rsvp_data.notes
        existing_rsvp.updated_at = datetime.utcnow()
        session.add(existing_rsvp)
        session.commit()
        return existing_rsvp
    else:
        # Create new RSVP
        db_rsvp = RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status=actual_status,
            notes=rsvp_data.notes
        )
        session.add(db_rsvp)
        session.commit()
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
    _role = getattr(current_user.role, "value", current_user.role)
    current_role = str(_role).lower() if _role is not None else "attendee"
    if event.organizer_id == current_user.id or current_role == "admin":
        # Get RSVPs with user information for organizer/admin
        statement = select(RSVP, User).join(User, RSVP.user_id == User.id).where(RSVP.event_id == event_id)
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
                    "role": str(getattr(user.role, "value", user.role)).lower()
                }
            }
            rsvps_with_users.append(rsvp_dict)
        
        # 🎭 Inject NPC attendees ONLY for events with specific NPC configuration
        # Check if this event has a special NPC count requirement
        force_npc_count = SPECIAL_NPC_COUNTS.get(event.id)
        
        if force_npc_count is not None:
            # Only inject NPCs if event is configured in SPECIAL_NPC_COUNTS
            rsvps_with_npcs = inject_npcs_into_attendees(
                event_id=event.id,
                real_attendees=rsvps_with_users,
                event_max=None,  # Don't auto-fill to max
                force_npc_count=force_npc_count
            )
        else:
            # No NPCs for events not in SPECIAL_NPC_COUNTS
            rsvps_with_npcs = rsvps_with_users
        
        return rsvps_with_npcs
    
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

@router.post("/{event_id}/rsvp/{rsvp_id}/approve")
async def approve_rsvp(
    event_id: int,
    rsvp_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Approve a pending RSVP (Admin/Organizer only)"""
    # Check if event exists and user has permission
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Approval only applies to events that require approval
    if not event.requires_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This event does not require approval for RSVPs"
        )

    # Get the RSVP
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp or rsvp.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )

    # Only pending RSVPs can be approved
    if rsvp.status != RSVPStatus.WAITING_FOR_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending RSVPs can be approved"
        )

    # Enforce capacity on approval (confirmed attendees = going + approved)
    confirmed_count = session.exec(
        select(RSVP).where(
            RSVP.event_id == event.id,
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
        )
    ).all()
    if event.max_attendees is not None and len(confirmed_count) >= event.max_attendees:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is full. Cannot approve more attendees."
        )

    # Update RSVP status
    rsvp.status = RSVPStatus.APPROVED
    rsvp.approved_by = current_user.id
    rsvp.approved_at = datetime.utcnow()
    rsvp.updated_at = datetime.utcnow()
    
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    
    return {"message": "RSVP approved successfully", "rsvp": rsvp}

@router.post("/{event_id}/rsvp/{rsvp_id}/reject")
async def reject_rsvp(
    event_id: int,
    rsvp_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Reject a pending RSVP (Admin/Organizer only)"""
    # Check if event exists and user has permission
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Rejections only apply if event requires approval
    if not event.requires_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This event does not require approval for RSVPs"
        )

    # Get the RSVP
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp or rsvp.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )

    # Only pending RSVPs can be rejected
    if rsvp.status != RSVPStatus.WAITING_FOR_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending RSVPs can be rejected"
        )

    # Update RSVP status
    rsvp.status = RSVPStatus.REJECTED
    rsvp.approved_by = current_user.id
    rsvp.approved_at = datetime.utcnow()
    rsvp.updated_at = datetime.utcnow()
    
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    
    return {"message": "RSVP rejected successfully", "rsvp": rsvp}

@router.get("/{event_id}/pending-rsvps")
async def get_pending_rsvps(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get all pending RSVPs for an event (Admin/Organizer only)"""
    # Check if event exists
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Ensure this event actually requires approval
    if not event.requires_approval:
        return []

    # Get pending RSVPs with user details
    from app.models.user import User
    statement = select(RSVP, User).join(
        User, RSVP.user_id == User.id
    ).where(
        RSVP.event_id == event_id,
        RSVP.status == RSVPStatus.WAITING_FOR_APPROVAL
    )
    
    results = session.exec(statement).all()
    
    pending_rsvps = []
    for rsvp, user in results:
        # Split full_name into first and last name
        name_parts = user.full_name.split(' ', 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        pending_rsvps.append({
            "rsvp_id": rsvp.id,
            "user_id": rsvp.user_id,
            "first_name": first_name,
            "last_name": last_name,
            "user_email": user.email,
            "status": rsvp.status,
            "notes": rsvp.notes,
            "created_at": rsvp.created_at
        })
    
    return pending_rsvps
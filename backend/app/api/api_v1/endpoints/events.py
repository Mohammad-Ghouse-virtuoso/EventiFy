from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
import random
import re
from app.db.database import get_session
from app.models.event import Event, EventCreate, EventUpdate, EventOut
from app.models.user import User
from app.models.rsvp import RSVP, RSVPCreate, RSVPUpdate, RSVPStatus
from app.models.qna import (
    EventQuestion,
    EventQuestionCreate,
    EventQuestionResponse,
    EventAnswer,
    EventAnswerCreate,
    EventAnswerResponse,
    AnswerHelpfulVote,
)
from app.core.auth import (
    get_current_active_user,
    get_current_user_optional,
    require_organizer_or_admin,
    require_admin,
)
from app.core.config import settings
from app.core.npc_generator import inject_npcs_into_attendees
from app.core.npc_generator_bulk import inject_bulk_npcs_into_attendees
from sqlalchemy import func, exists, select as sa_select

router = APIRouter()

# 🎭 Event-specific NPC configurations (event_id: npc_count)
SPECIAL_NPC_COUNTS = {
    17: 43,  # Heema's Choir Show - 43 NPCs + 2 real (latha + Jamie) = 45 total
}

_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "your", "about",
    "will", "have", "what", "when", "where", "which", "does", "can",
    "how", "are", "you", "its", "any", "into", "been", "they", "them",
}

_GENERIC_EVENT_TOPICS = {
    "parking", "dress", "clothes", "food", "meal", "vegan", "vegetarian",
    "ticket", "tickets", "price", "cost", "entry", "time", "start", "end",
    "schedule", "agenda", "location", "venue", "address", "arrival", "gate",
    "accessibility", "wheelchair", "refund", "policy", "age", "kids", "child",
    "alcohol", "drink", "security", "recording", "stream", "livestream",
    "seat", "seating", "capacity", "max", "register", "registration",
}


def _tokenize(text: str) -> set:
    tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return {t for t in tokens if t not in _STOPWORDS}


def _keywords_from_event(event: Event) -> set:
    chunks = [event.title or "", event.description or "", event.category or "", event.location or ""]
    tokens = set()
    for chunk in chunks:
        tokens |= _tokenize(chunk)
    return tokens | _GENERIC_EVENT_TOPICS


def _validate_question_relevance(question_text: str, event: Event) -> Optional[str]:
    text = (question_text or "").strip()
    if len(text) < 8:
        return "Please provide a bit more detail in your question."
    if len(text) > 500:
        return "Questions must be 500 characters or fewer."
    if re.search(r"https?://", text):
        return "Links are not allowed in questions."
    if re.search(r"\b(violence|harm|weapon|bomb|kill)\b", text, re.IGNORECASE):
        return "This content is not allowed."

    overlap = _tokenize(text) & _keywords_from_event(event)
    if not overlap:
        return "Please keep questions about this event's schedule, location, access, or logistics."
    return None

@router.get("/", response_model=List[EventOut])
@router.get("", response_model=List[EventOut])
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
            User.email.label("organizer_email"),
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
    for (ev, organizer_name, organizer_role, organizer_email, attendees_count) in rows:
        # Normalize role to plain lowercase string
        try:
            role_value = str(organizer_role.value).lower()  # Enum -> str
        except AttributeError:
            role_value = str(organizer_role).lower() if organizer_role is not None else "attendee"

        # Include NPC count if configured for this event
        real_count = attendees_count or 0
        npc_count = 0
        if organizer_email == "ai_organizer@eventify.system":
            target = ev.max_attendees or 200
            # Fill toward target with NPCs, within sensible bounds
            npc_count = max(0, min(500, max(target - real_count, 150)))
        elif ev.id in SPECIAL_NPC_COUNTS:
            npc_count = SPECIAL_NPC_COUNTS[ev.id]

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
                terms_and_conditions=ev.terms_and_conditions,
                organizer_bio=ev.organizer_bio,
                organizer_contact=ev.organizer_contact,
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
    npc_count = 0
    organizer_email = organizer.email if organizer else None
    if organizer_email == "ai_organizer@eventify.system":
        target = event.max_attendees or 200
        npc_count = max(0, min(500, max(target - real_count, 150)))
    elif event.id in SPECIAL_NPC_COUNTS:
        npc_count = SPECIAL_NPC_COUNTS[event.id]
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
        attendees_count=total_attendees,
        terms_and_conditions=event.terms_and_conditions,
        organizer_bio=event.organizer_bio,
        organizer_contact=event.organizer_contact,
    )


# Original JSON endpoint (for banner selection)
@router.post("/", response_model=EventOut)
@router.post("", response_model=EventOut)
async def create_event(
    event_data: EventCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)  # Any authenticated user can create events
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
        attendees_count=0,
        terms_and_conditions=db_event.terms_and_conditions,
        organizer_bio=db_event.organizer_bio,
        organizer_contact=db_event.organizer_contact,
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
    current_user: User = Depends(get_current_active_user)  # Any authenticated user can create events
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
        attendees_count=0,
        terms_and_conditions=db_event.terms_and_conditions,
        organizer_bio=db_event.organizer_bio,
        organizer_contact=db_event.organizer_contact,
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
        attendees_count=len(attendees_count),
        terms_and_conditions=event.terms_and_conditions,
        organizer_bio=event.organizer_bio,
        organizer_contact=event.organizer_contact,
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
        
        # 🎭 Automatic NPC Injection Logic
        # Check if this is an AI-generated event
        organizer = session.get(User, event.organizer_id)
        is_ai_event = organizer and organizer.email == "ai_organizer@eventify.system"
        
        if is_ai_event:
            # AI events get automatic bulk NPCs (100-500 based on max_attendees)
            target_npc_count = event.max_attendees - len(rsvps_with_users) if event.max_attendees else random.randint(100, 300)
            target_npc_count = max(100, min(500, target_npc_count))  # Clamp to 100-500
            
            rsvps_with_npcs = inject_bulk_npcs_into_attendees(
                event_id=event.id,
                real_attendees=rsvps_with_users,
                target_npc_count=target_npc_count
            )
        elif event.id in SPECIAL_NPC_COUNTS:
            # Manual events with specific NPC requirements
            force_npc_count = SPECIAL_NPC_COUNTS[event.id]
            rsvps_with_npcs = inject_npcs_into_attendees(
                event_id=event.id,
                real_attendees=rsvps_with_users,
                event_max=None,
                force_npc_count=force_npc_count
            )
        else:
            # Regular events - no NPCs
            rsvps_with_npcs = rsvps_with_users
        
        return rsvps_with_npcs
    
    else:
        # For regular users, return their RSVP (if any) plus NPCs for social proof
        statement = (
            select(RSVP, User)
            .join(User, RSVP.user_id == User.id)
            .where(
                RSVP.event_id == event_id,
                RSVP.user_id == current_user.id
            )
        )
        result = session.exec(statement).first()

        rsvps_with_users = []
        if result:
            rsvp, user = result
            rsvps_with_users.append({
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
            })

        organizer = session.get(User, event.organizer_id)
        is_ai_event = organizer and organizer.email == "ai_organizer@eventify.system"

        if is_ai_event:
            target_npc_count = event.max_attendees - len(rsvps_with_users) if event.max_attendees else random.randint(100, 300)
            target_npc_count = max(100, min(500, target_npc_count))
            rsvps_with_npcs = inject_bulk_npcs_into_attendees(
                event_id=event.id,
                real_attendees=rsvps_with_users,
                target_npc_count=target_npc_count
            )
        elif event.id in SPECIAL_NPC_COUNTS:
            force_npc_count = SPECIAL_NPC_COUNTS[event.id]
            rsvps_with_npcs = inject_npcs_into_attendees(
                event_id=event.id,
                real_attendees=rsvps_with_users,
                event_max=None,
                force_npc_count=force_npc_count
            )
        else:
            rsvps_with_npcs = rsvps_with_users

        return rsvps_with_npcs


@router.get("/{event_id}/questions", response_model=List[EventQuestionResponse])
async def get_event_questions(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    questions = session.exec(
        select(EventQuestion)
        .where(EventQuestion.event_id == event_id)
        .order_by(EventQuestion.created_at.desc())
    ).all()

    responses: List[EventQuestionResponse] = []
    for question in questions:
        answers_with_names = session.exec(
            select(EventAnswer, User.full_name)
            .join(User, EventAnswer.user_id == User.id)
            .where(EventAnswer.question_id == question.id)
            .order_by(EventAnswer.created_at.desc())
        ).all()
        answer_ids = [a.id for a, _ in answers_with_names]

        voted_ids = set()
        if current_user and answer_ids:
            voted_rows = session.exec(
                select(AnswerHelpfulVote.answer_id).where(
                    AnswerHelpfulVote.answer_id.in_(answer_ids),
                    AnswerHelpfulVote.user_id == current_user.id,
                )
            ).all()
            voted_ids = {row for row in voted_rows}

        answers: List[EventAnswerResponse] = [
            EventAnswerResponse(
                **answer.dict(),
                answerer_name=full_name,
                has_voted=answer.id in voted_ids,
            )
            for answer, full_name in answers_with_names
        ]

        responses.append(
            EventQuestionResponse(
                **question.dict(),
                answers=answers,
            )
        )

    return responses


@router.post(
    "/{event_id}/questions",
    response_model=EventQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event_question(
    event_id: int,
    question_data: EventQuestionCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if not question_data.asker_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required to ask a question",
        )

    relevance_error = _validate_question_relevance(question_data.text, event)
    if relevance_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=relevance_error,
        )

    db_question = EventQuestion(
        **question_data.dict(),
        event_id=event_id,
        user_id=current_user.id if current_user else None,
    )
    session.add(db_question)
    session.commit()
    session.refresh(db_question)

    return EventQuestionResponse(**db_question.dict(), answers=[])


@router.post(
    "/{event_id}/questions/{question_id}/answers",
    response_model=EventAnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def answer_event_question(
    event_id: int,
    question_id: int,
    answer_data: EventAnswerCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    question = session.get(EventQuestion, question_id)
    if not question or question.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    role_value = getattr(current_user.role, "value", current_user.role)
    is_admin = str(role_value).lower() == "admin"
    if current_user.id != event.organizer_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the organizer or an admin can answer questions",
        )

    if not answer_data.text or not answer_data.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer cannot be empty",
        )

    db_answer = EventAnswer(
        question_id=question_id,
        user_id=current_user.id,
        text=answer_data.text.strip(),
    )
    session.add(db_answer)
    session.commit()
    session.refresh(db_answer)

    return EventAnswerResponse(
        **db_answer.dict(),
        answerer_name=current_user.full_name,
        has_voted=False,
    )


@router.post("/{event_id}/answers/{answer_id}/vote")
async def vote_answer_helpful(
    event_id: int,
    answer_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    answer = session.get(EventAnswer, answer_id)
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    existing_vote = session.exec(
        select(AnswerHelpfulVote).where(
            AnswerHelpfulVote.answer_id == answer_id,
            AnswerHelpfulVote.user_id == current_user.id,
        )
    ).first()

    if existing_vote:
        return {"helpful_count": answer.helpful_count or 0, "voted": True}

    vote = AnswerHelpfulVote(answer_id=answer_id, user_id=current_user.id)
    answer.helpful_count = max(0, (answer.helpful_count or 0) + 1)
    session.add(vote)
    session.add(answer)
    session.commit()
    session.refresh(answer)

    return {"helpful_count": answer.helpful_count, "voted": True}


@router.delete("/{event_id}/answers/{answer_id}/vote")
async def remove_vote_answer_helpful(
    event_id: int,
    answer_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    answer = session.get(EventAnswer, answer_id)
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    existing_vote = session.exec(
        select(AnswerHelpfulVote).where(
            AnswerHelpfulVote.answer_id == answer_id,
            AnswerHelpfulVote.user_id == current_user.id,
        )
    ).first()

    if existing_vote:
        session.delete(existing_vote)
        answer.helpful_count = max(0, (answer.helpful_count or 0) - 1)
        session.add(answer)
        session.commit()
        session.refresh(answer)
        return {"helpful_count": answer.helpful_count, "voted": False}

    return {"helpful_count": answer.helpful_count or 0, "voted": False}

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


# ============================================================================
# QR CODE CHECK-IN ENDPOINTS
# ============================================================================

from jose import jwt
from pydantic import BaseModel

class QRTokenResponse(BaseModel):
    """Response containing QR token data"""
    qr_token: str
    event_id: int
    rsvp_id: int
    attendee_name: str
    event_title: str
    expires_at: datetime

class CheckinRequest(BaseModel):
    """Request body for check-in"""
    qr_token: str

class CheckinResponse(BaseModel):
    """Response after successful check-in"""
    success: bool
    message: str
    attendee_name: str
    attendee_email: str
    rsvp_status: str
    checked_in_at: datetime


@router.get("/{event_id}/qr/{rsvp_id}", response_model=QRTokenResponse)
async def generate_qr_token(
    event_id: int,
    rsvp_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a QR token for an attendee's RSVP.
    
    - Attendee can only get their own QR code
    - Organizer/Admin can get any attendee's QR code for their event
    """
    # Get the event
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get the RSVP
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp or rsvp.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )
    
    # Check permissions: own RSVP or organizer/admin of the event
    is_own_rsvp = rsvp.user_id == current_user.id
    is_organizer = event.organizer_id == current_user.id
    is_admin = current_user.role.value == "admin" if hasattr(current_user.role, 'value') else current_user.role == "admin"
    
    if not (is_own_rsvp or is_organizer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own ticket or manage events you organize"
        )
    
    # Only approved/going RSVPs can get QR codes
    valid_statuses = [RSVPStatus.GOING, RSVPStatus.APPROVED]
    if rsvp.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"QR code only available for confirmed attendees. Current status: {rsvp.status.value}"
        )
    
    # Get attendee info
    attendee = session.get(User, rsvp.user_id)
    
    # Generate JWT token for QR code (expires 24 hours after event ends)
    event_end = event.event_end or event.event_start
    expiry = event_end + timedelta(hours=24)
    
    token_payload = {
        "rsvp_id": rsvp.id,
        "event_id": event.id,
        "user_id": rsvp.user_id,
        "exp": expiry.timestamp(),
        "type": "checkin"
    }
    
    qr_token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return QRTokenResponse(
        qr_token=qr_token,
        event_id=event.id,
        rsvp_id=rsvp.id,
        attendee_name=attendee.full_name if attendee else "Unknown",
        event_title=event.title,
        expires_at=expiry
    )


@router.post("/{event_id}/checkin", response_model=CheckinResponse)
async def checkin_attendee(
    event_id: int,
    request: CheckinRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check in an attendee by scanning their QR code.
    
    - Only organizer of the event or admin can check in attendees
    - Validates the QR token signature and expiry
    - Prevents double check-in
    """
    # Get the event
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions: must be organizer or admin
    is_organizer = event.organizer_id == current_user.id
    is_admin = current_user.role.value == "admin" if hasattr(current_user.role, 'value') else current_user.role == "admin"
    
    if not (is_organizer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only event organizers or admins can check in attendees"
        )
    
    # Decode and validate the QR token
    try:
        payload = jwt.decode(
            request.qr_token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code"
        )
    
    # Validate token type
    if payload.get("type") != "checkin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code type"
        )
    
    # Validate event matches
    if payload.get("event_id") != event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This QR code is for a different event"
        )
    
    # Get the RSVP
    rsvp_id = payload.get("rsvp_id")
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp or rsvp.event_id != event_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )
    
    # Check if already checked in
    if rsvp.checked_in:
        attendee = session.get(User, rsvp.user_id)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{attendee.full_name if attendee else 'Attendee'} is already checked in (at {rsvp.checked_in_at})"
        )
    
    # Perform check-in
    rsvp.checked_in = True
    rsvp.checked_in_at = datetime.utcnow()
    rsvp.updated_at = datetime.utcnow()
    
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    
    # Get attendee info for response
    attendee = session.get(User, rsvp.user_id)
    
    return CheckinResponse(
        success=True,
        message=f"Welcome, {attendee.full_name if attendee else 'Attendee'}! ✅",
        attendee_name=attendee.full_name if attendee else "Unknown",
        attendee_email=attendee.email if attendee else "Unknown",
        rsvp_status=rsvp.status.value if hasattr(rsvp.status, 'value') else str(rsvp.status),
        checked_in_at=rsvp.checked_in_at
    )


@router.get("/{event_id}/checkin-stats")
async def get_checkin_stats(
    event_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get check-in statistics for an event.
    
    - Only organizer or admin can view stats
    """
    # Get the event
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions
    is_organizer = event.organizer_id == current_user.id
    is_admin = current_user.role.value == "admin" if hasattr(current_user.role, 'value') else current_user.role == "admin"
    
    if not (is_organizer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only event organizers or admins can view check-in stats"
        )
    
    # Get all confirmed RSVPs (going + approved)
    confirmed_rsvps = session.exec(
        select(RSVP).where(
            RSVP.event_id == event_id,
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED])
        )
    ).all()
    
    total_confirmed = len(confirmed_rsvps)
    checked_in = sum(1 for r in confirmed_rsvps if r.checked_in)
    not_checked_in = total_confirmed - checked_in
    
    # Get list of checked-in attendees
    checked_in_list = []
    for rsvp in confirmed_rsvps:
        if rsvp.checked_in:
            attendee = session.get(User, rsvp.user_id)
            checked_in_list.append({
                "rsvp_id": rsvp.id,
                "user_id": rsvp.user_id,
                "name": attendee.full_name if attendee else "Unknown",
                "email": attendee.email if attendee else "Unknown",
                "checked_in_at": rsvp.checked_in_at
            })
    
    # Sort by check-in time (most recent first)
    checked_in_list.sort(key=lambda x: x["checked_in_at"] or datetime.min, reverse=True)
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_confirmed": total_confirmed,
        "checked_in": checked_in,
        "not_checked_in": not_checked_in,
        "check_in_rate": round(checked_in / total_confirmed * 100, 1) if total_confirmed > 0 else 0,
        "max_attendees": event.max_attendees,
        "recently_checked_in": checked_in_list[:10]  # Last 10 check-ins
    }


@router.get("/admin/dashboard-stats")
async def get_admin_dashboard_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """
    Comprehensive admin dashboard stats.
    Admin-only endpoint showing complete event & attendance data.
    
    Returns:
    - All events with full details
    - RSVP breakdown per event (going/maybe/not_going)
    - All attendee data with emails & status
    - Check-in statistics
    """
    
    # Get all events
    all_events = session.exec(select(Event).order_by(Event.event_start.desc())).all()
    
    events_data = []
    
    for event in all_events:
        # Get all RSVPs for this event
        all_rsvps = session.exec(
            select(RSVP).where(RSVP.event_id == event.id)
        ).all()
        
        # Count by status
        rsvp_stats = {
            "going": 0,
            "maybe": 0,
            "not_going": 0,
            "approved": 0,
            "rejected": 0,
            "waiting_for_approval": 0
        }
        
        attendees_list = []
        
        for rsvp in all_rsvps:
            # Count status
            status_key = rsvp.status.value if hasattr(rsvp.status, 'value') else str(rsvp.status).lower()
            if status_key in rsvp_stats:
                rsvp_stats[status_key] += 1
            
            # Get user details
            user = session.get(User, rsvp.user_id)
            if user:
                attendees_list.append({
                    "user_id": user.id,
                    "name": user.full_name,
                    "email": user.email,
                    "rsvp_status": status_key,
                    "rsvp_id": rsvp.id,
                    "checked_in": rsvp.checked_in,
                    "checked_in_at": rsvp.checked_in_at.isoformat() if rsvp.checked_in_at else None,
                    "rsvp_created_at": rsvp.created_at.isoformat() if rsvp.created_at else None
                })
        
        # Get organizer details
        organizer = session.get(User, event.organizer_id) if event.organizer_id else None
        
        # Calculate attendance rate
        confirmed = rsvp_stats["going"] + rsvp_stats["approved"]
        checked_in_count = sum(1 for a in attendees_list if a["checked_in"])
        attendance_rate = round(checked_in_count / confirmed * 100, 1) if confirmed > 0 else 0
        
        event_data = {
            "event_id": event.id,
            "title": event.title,
            "description": event.description[:100] + "..." if len(event.description or "") > 100 else event.description,
            "category": event.category,
            "location": event.location,
            "event_start": event.event_start.isoformat() if event.event_start else None,
            "event_end": event.event_end.isoformat() if event.event_end else None,
            "price": float(event.price) if event.price else 0,
            "max_attendees": event.max_attendees,
            "is_active": event.is_active,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "organizer": {
                "user_id": organizer.id,
                "name": organizer.full_name,
                "email": organizer.email
            } if organizer else None,
            "rsvp_statistics": {
                "total_rsvps": len(all_rsvps),
                "going": rsvp_stats["going"],
                "maybe": rsvp_stats["maybe"],
                "not_going": rsvp_stats["not_going"],
                "approved": rsvp_stats["approved"],
                "rejected": rsvp_stats["rejected"],
                "waiting_for_approval": rsvp_stats["waiting_for_approval"],
                "confirmed_attendees": confirmed,
                "checked_in": checked_in_count,
                "attendance_rate": attendance_rate
            },
            "attendees": sorted(attendees_list, key=lambda x: x["rsvp_created_at"], reverse=True)
        }
        
        events_data.append(event_data)
    
    # Get all users summary
    all_users = session.exec(select(User)).all()
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "admin_user": {
            "user_id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email
        },
        "summary": {
            "total_events": len(all_events),
            "total_users": len(all_users),
            "total_rsvps": sum(len(e["attendees"]) for e in events_data),
            "active_events": sum(1 for e in events_data if e["is_active"]),
            "past_events": sum(1 for e in events_data if not e["is_active"])
        },
        "events": events_data,
        "all_users": [
            {
                "user_id": user.id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in all_users
        ]
    }
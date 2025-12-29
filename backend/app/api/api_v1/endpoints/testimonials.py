from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlmodel import Session, select
from sqlalchemy import func
from app.db.database import get_session
from app.core.auth import get_current_active_user, require_admin
from app.models.user import User
from app.models.testimonial import (
    Testimonial,
    TestimonialCreate,
    TestimonialUpdate,
    TestimonialOut,
)
from app.models.rsvp import RSVP, RSVPStatus
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[TestimonialOut])
async def list_testimonials(
    session: Session = Depends(get_session),
    limit: int = Query(6, ge=1, le=24),
    sort: str = Query("rating", pattern="^(rating|recent)$"),
):
    q = select(Testimonial).where(Testimonial.is_approved == True)
    if sort == "rating":
        q = q.order_by(Testimonial.rating.desc(), Testimonial.created_at.desc())
    else:
        q = q.order_by(Testimonial.created_at.desc())
    q = q.limit(limit)

    rows = session.exec(q).all()
    if not rows:
        return []

    # Denormalize user names for UI; avoid heavy joins
    user_ids = {t.user_id for t in rows}
    users = {}
    if user_ids:
        user_rows = session.exec(select(UserModel).where(UserModel.id.in_(list(user_ids)))).all()
        users = {u.id: u.full_name for u in user_rows}

    out: List[TestimonialOut] = []
    for t in rows:
        out.append(TestimonialOut(
            id=t.id,
            user_id=t.user_id,
            quote=t.quote,
            rating=t.rating,
            event_id=t.event_id,
            avatar_url=t.avatar_url,
            is_approved=t.is_approved,
            is_featured=t.is_featured,
            created_at=t.created_at,
            updated_at=t.updated_at,
            user_name=users.get(t.user_id),
        ))
    return out


@router.get("/featured", response_model=List[TestimonialOut])
async def list_featured_testimonials(
    session: Session = Depends(get_session),
    limit: int = Query(6, ge=1, le=24),
):
    rows = session.exec(
        select(Testimonial)
        .where(Testimonial.is_approved == True, Testimonial.is_featured == True)
        .order_by(Testimonial.rating.desc(), Testimonial.created_at.desc())
        .limit(limit)
    ).all()
    if not rows:
        return []

    user_ids = {t.user_id for t in rows}
    users = {}
    if user_ids:
        user_rows = session.exec(select(UserModel).where(UserModel.id.in_(list(user_ids)))).all()
        users = {u.id: u.full_name for u in user_rows}

    return [
        TestimonialOut(
            id=t.id,
            user_id=t.user_id,
            quote=t.quote,
            rating=t.rating,
            event_id=t.event_id,
            avatar_url=t.avatar_url,
            is_approved=t.is_approved,
            is_featured=t.is_featured,
            created_at=t.created_at,
            updated_at=t.updated_at,
            user_name=users.get(t.user_id),
        )
        for t in rows
    ]


@router.post("/", response_model=TestimonialOut, status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    payload: TestimonialCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    # Verify user has RSVP for the event (going or approved)
    rsvps = session.exec(
        select(RSVP).where(
            RSVP.user_id == current_user.id,
            RSVP.event_id == payload.event_id,
            RSVP.status.in_([RSVPStatus.GOING, RSVPStatus.APPROVED]),
        )
    ).all()
    if not rsvps:
        raise HTTPException(status_code=400, detail="You can only submit a testimonial for events you've attended.")

    t = Testimonial(
        user_id=current_user.id,
        quote=payload.quote,
        rating=payload.rating,
        event_id=payload.event_id,
        avatar_url=payload.avatar_url,
        is_approved=False,
        is_featured=False,
    )
    session.add(t)
    session.commit()
    session.refresh(t)

    return TestimonialOut(
        id=t.id,
        user_id=t.user_id,
        quote=t.quote,
        rating=t.rating,
        event_id=t.event_id,
        avatar_url=t.avatar_url,
        is_approved=t.is_approved,
        is_featured=t.is_featured,
        created_at=t.created_at,
        updated_at=t.updated_at,
        user_name=current_user.full_name,
    )


@router.get("/admin", response_model=List[TestimonialOut])
async def admin_list_testimonials(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
    include_unapproved: bool = True,
    limit: int = Query(50, ge=1, le=200),
):
    q = select(Testimonial)
    if not include_unapproved:
        q = q.where(Testimonial.is_approved == True)
    q = q.order_by(Testimonial.created_at.desc()).limit(limit)
    rows = session.exec(q).all()
    user_ids = {t.user_id for t in rows}
    users = {}
    if user_ids:
        user_rows = session.exec(select(UserModel).where(UserModel.id.in_(list(user_ids)))).all()
        users = {u.id: u.full_name for u in user_rows}
    return [
        TestimonialOut(
            id=t.id,
            user_id=t.user_id,
            quote=t.quote,
            rating=t.rating,
            event_id=t.event_id,
            avatar_url=t.avatar_url,
            is_approved=t.is_approved,
            is_featured=t.is_featured,
            created_at=t.created_at,
            updated_at=t.updated_at,
            user_name=users.get(t.user_id),
        )
        for t in rows
    ]


@router.put("/admin/{testimonial_id}", response_model=TestimonialOut)
async def admin_update_testimonial(
    testimonial_id: int,
    payload: TestimonialUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    t = session.get(Testimonial, testimonial_id)
    if not t:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(t, k, v)
    t.updated_at = func.now()
    session.add(t)
    session.commit()
    session.refresh(t)

    user = session.get(UserModel, t.user_id)
    return TestimonialOut(
        id=t.id,
        user_id=t.user_id,
        quote=t.quote,
        rating=t.rating,
        event_id=t.event_id,
        avatar_url=t.avatar_url,
        is_approved=t.is_approved,
        is_featured=t.is_featured,
        created_at=t.created_at,
        updated_at=t.updated_at,
        user_name=user.full_name if user else None,
    )


@router.delete("/admin/{testimonial_id}")
async def admin_delete_testimonial(
    testimonial_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    t = session.get(Testimonial, testimonial_id)
    if not t:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    session.delete(t)
    session.commit()
    return {"message": "Testimonial deleted"}

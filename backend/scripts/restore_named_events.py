from datetime import datetime, timedelta
from typing import List, Tuple

from sqlmodel import Session, select

from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event


def ensure_admin(session: Session) -> User:
    admin = session.exec(select(User).where(User.role == UserRole.ADMIN)).first()
    if admin:
        return admin
    # Fallback: create a minimal admin if missing
    admin = User(
        email="admin@eventify.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        hashed_password="not-used-in-seed",
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


def ensure_jack(session: Session) -> User:
    # Try to find by email or full_name
    jack = session.exec(select(User).where(User.email == "jack@eventify.com")).first()
    if jack:
        return jack
    jack = session.exec(select(User).where(User.full_name.ilike("jack%"))).first()  # type: ignore[attr-defined]
    if jack:
        return jack
    # Create new organizer account for Jack
    jack = User(
        email="jack@eventify.com",
        full_name="Jack",
        role=UserRole.ORGANIZER,
        hashed_password="not-used-in-seed",
    )
    session.add(jack)
    session.commit()
    session.refresh(jack)
    return jack


def upsert_events(
    session: Session,
    organizer: User,
    items: List[Tuple[str, bool]],
    start_at: datetime,
) -> int:
    """
    Create events for organizer, skipping duplicates by (title, organizer_id).
    items: list of (title, requires_approval)
    start_at: base datetime; each event will be placed +i days
    """
    created = 0
    for idx, (title, requires_approval) in enumerate(items):
        existing = session.exec(
            select(Event).where(Event.title == title, Event.organizer_id == organizer.id)
        ).first()
        if existing:
            continue

        when = start_at + timedelta(days=idx * 2)
        ev = Event(
            title=title,
            description="Restored event",
            category="celebration",
            event_start=when,
            event_end=when + timedelta(hours=3),
            location="TBD",
            max_attendees=200,
            price=0.0,
            image=None,
            thumbnail=None,
            requires_approval=requires_approval,
            organizer_id=organizer.id,
        )
        session.add(ev)
        session.commit()
        created += 1
    return created


def main():
    now = datetime.now()
    with Session(engine) as session:
        admin = ensure_admin(session)
        jack = ensure_jack(session)

        # Admin events
        admin_rsvp = [
            ("Lopez & Henna's Anniversary", True),
            ("Elia's Bachelorette Party", True),
            ("Reception", True),
        ]
        admin_no_rsvp = [
            ("House Warming", False),
            ("Hookah Night", False),
            ("Paul's B'day", False),
        ]

        # Jack events
        jack_rsvp = [
            ("Jamie Dimon's briefing", True),
            ("Hard Rock Club", True),
            ("Hailey's Grand Prix", True),
        ]
        jack_no_rsvp = [
            ("Emma's Botinical Garden", False),
            ("Krish's babyshower", False),
            ("St. Stephen's College", False),
        ]

        c1 = upsert_events(session, admin, admin_rsvp, now + timedelta(days=3))
        c2 = upsert_events(session, admin, admin_no_rsvp, now + timedelta(days=5))
        c3 = upsert_events(session, jack, jack_rsvp, now + timedelta(days=7))
        c4 = upsert_events(session, jack, jack_no_rsvp, now + timedelta(days=9))

        total = c1 + c2 + c3 + c4
        print(f"Restoration complete. Created {total} events (admin: {c1+c2}, jack: {c3+c4}).")


if __name__ == "__main__":
    main()

from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus

"""
Create a few past-dated events with a mix of RSVPs so admin can view analytics.
Idempotent by (title, organizer_id).
"""

PAST_TITLES = [
    ("Founders' Mixer 2023", False),
    ("Summer Gala 2024", True),
    ("Tech Throwback 2022", False),
]

ATTENDEE_EMAILS = [
    "alice@example.com",
    "bob@example.com",
    "carol@example.com",
    "dave@example.com",
    "erin@example.com",
]


def ensure_admin(session: Session) -> User:
    admin = session.exec(select(User).where(User.role == UserRole.ADMIN)).first()
    if admin:
        return admin
    admin = User(email="admin@eventify.com", full_name="Admin User", role=UserRole.ADMIN, hashed_password="seeded")
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


def ensure_attendees(session: Session):
    for email in ATTENDEE_EMAILS:
        u = session.exec(select(User).where(User.email == email)).first()
        if not u:
            u = User(email=email, full_name=email.split("@")[0].title(), role=UserRole.ATTENDEE, hashed_password="seeded")
            session.add(u)
            session.commit()


def upsert_event(session: Session, organizer_id: int, title: str, requires_approval: bool, days_ago: int) -> Event:
    ev = session.exec(select(Event).where(Event.title == title, Event.organizer_id == organizer_id)).first()
    if ev:
        return ev
    start = datetime.now() - timedelta(days=days_ago)
    ev = Event(
        title=title,
        description=f"Past event: {title}",
        category="archive",
        event_start=start,
        event_end=start + timedelta(hours=2),
        location="Archive Hall",
        max_attendees=200,
        price=0.0,
        requires_approval=requires_approval,
        organizer_id=organizer_id,
    )
    session.add(ev)
    session.commit()
    session.refresh(ev)
    return ev


def upsert_rsvp(session: Session, user_id: int, event_id: int, status: RSVPStatus):
    existing = session.exec(select(RSVP).where(RSVP.user_id == user_id, RSVP.event_id == event_id)).first()
    if existing:
        return existing
    r = RSVP(user_id=user_id, event_id=event_id, status=status)
    session.add(r)
    session.commit()
    session.refresh(r)
    return r


def main():
    with Session(engine) as session:
        admin = ensure_admin(session)
        ensure_attendees(session)

        days = [90, 60, 30]
        events = []
        for (title, req), d in zip(PAST_TITLES, days):
            ev = upsert_event(session, admin.id, title, req, d)
            events.append(ev)

        # Attach RSVPs
        attendees = session.exec(select(User).where(User.email.in_(ATTENDEE_EMAILS))).all()
        for ev in events:
            for i, u in enumerate(attendees):
                if ev.requires_approval:
                    status = [RSVPStatus.WAITING_FOR_APPROVAL, RSVPStatus.APPROVED, RSVPStatus.REJECTED][i % 3]
                else:
                    status = [RSVPStatus.GOING, RSVPStatus.MAYBE, RSVPStatus.NOT_GOING][i % 3]
                upsert_rsvp(session, u.id, ev.id, status)

        print(f"Seeded {len(events)} past events for analytics under admin")


if __name__ == "__main__":
    main()

from datetime import datetime, timedelta
from sqlmodel import Session, select

from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus


ATTENDEES = [
    ("alice@example.com", "Alice Johnson"),
    ("bob@example.com", "Bob Lee"),
    ("carol@example.com", "Carol Perez"),
    ("dave@example.com", "Dave Kim"),
    ("erin@example.com", "Erin Wang"),
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
    for email, name in ATTENDEES:
        u = session.exec(select(User).where(User.email == email)).first()
        if not u:
            u = User(email=email, full_name=name, role=UserRole.ATTENDEE, hashed_password="seeded")
            session.add(u)
            session.commit()


def upsert_today_event(session: Session, admin_id: int) -> Event:
    title = "Admin Townhall Today"
    ev = session.exec(select(Event).where(Event.title == title, Event.organizer_id == admin_id)).first()
    if ev:
        return ev
    now = datetime.now()
    start = now + timedelta(hours=1)
    ev = Event(
        title=title,
        description="A quick townhall to demo admin views",
        category="general",
        event_start=start,
        event_end=start + timedelta(hours=2),
        location="Main Hall",
        max_attendees=200,
        price=0.0,
        requires_approval=True,
        organizer_id=admin_id,
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
        ev = upsert_today_event(session, admin.id)

        # Mix of pending and going so both admin sections show data
        attendees = session.exec(select(User).where(User.email.in_([e for e, _ in ATTENDEES]))).all()
        statuses = [
            RSVPStatus.WAITING_FOR_APPROVAL,
            RSVPStatus.WAITING_FOR_APPROVAL,
            RSVPStatus.GOING,
            RSVPStatus.GOING,
            RSVPStatus.MAYBE,
        ]
        for u, st in zip(attendees, statuses):
            upsert_rsvp(session, u.id, ev.id, st)

        print(f"Seeded today's event '{ev.title}' (id={ev.id}) with mixed RSVPs")


if __name__ == "__main__":
    main()

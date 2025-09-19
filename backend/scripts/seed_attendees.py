from datetime import datetime, timedelta
from random import randint, choice
from typing import List
from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus

"""
Seed attendees for specific restored events and some past events for analytics.
- Creates a few attendee users if needed.
- Adds a mix of RSVP statuses. For approval-required events, seeds WAITING_FOR_APPROVALs that can be approved via admin.

Safe: idempotent per (user_id,event_id) pair; will not duplicate RSVPs.
"""

ATTENDEE_EMAILS = [
    ("alice@example.com", "Alice Johnson"),
    ("bob@example.com", "Bob Lee"),
    ("carol@example.com", "Carol Perez"),
    ("dave@example.com", "Dave Kim"),
    ("erin@example.com", "Erin Wang"),
]

TARGET_TITLES = [
    "Lopez & Henna's Anniversary",
    "Elia's Bachelorette Party",
    "Reception",
    "House Warming",
    "Hookah Night",
    "Paul's B'day",
    "Jamie Dimon's briefing",
    "Hard Rock Club",
    "Hailey's Grand Prix",
]


def ensure_attendees(session: Session) -> List[User]:
    users: List[User] = []
    for email, name in ATTENDEE_EMAILS:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            user = User(email=email, full_name=name, role=UserRole.ATTENDEE, hashed_password="seeded")
            session.add(user)
            session.commit()
            session.refresh(user)
        users.append(user)
    return users


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
        attendees = ensure_attendees(session)
        events = session.exec(select(Event).where(Event.title.in_(TARGET_TITLES))).all()
        seeded = 0
        for ev in events:
            for u in attendees:
                # Mix statuses: favor confirmed for non-approval; waiting for approval for approval events
                if ev.requires_approval:
                    status = choice([RSVPStatus.WAITING_FOR_APPROVAL, RSVPStatus.MAYBE, RSVPStatus.NOT_GOING])
                else:
                    status = choice([RSVPStatus.GOING, RSVPStatus.MAYBE, RSVPStatus.NOT_GOING])
                upsert_rsvp(session, u.id, ev.id, status)
                seeded += 1
        print(f"Seeded {seeded} RSVPs across {len(events)} events")


if __name__ == "__main__":
    main()

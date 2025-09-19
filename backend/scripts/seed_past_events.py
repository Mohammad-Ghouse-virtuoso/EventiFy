import os
import random
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.rsvp import RSVP, RSVPStatus


def ensure_organizer(session: Session) -> User:
    # Try to find an organizer; if none, pick any non-admin and treat as organizer
    user = session.exec(select(User).where(User.role == UserRole.ORGANIZER)).first()
    if user:
        return user
    fallback = session.exec(select(User).where(User.role != UserRole.ADMIN)).first()
    if fallback:
        return fallback
    # As last resort, create a basic organizer
    org = User(
        email=f"organizer_{int(datetime.utcnow().timestamp())}@example.com",
        full_name="Demo Organizer",
        role=UserRole.ORGANIZER,
        hashed_password="not-used-in-seed",
    )
    session.add(org)
    session.commit()
    session.refresh(org)
    return org


def main():
    past_days = [30, 14, 7, 3]
    titles = [
        "Retro Tech Meetup",
        "Culinary Night Social",
        "Sunset Run 5K",
        "Art & Coffee Evening",
    ]
    locations = [
        "White Castle PUB, Las Vegas - Nevada",
        "Downtown Community Hall",
        "City Park Arena",
        "Riverside Cafe",
    ]

    with Session(engine) as session:
        organizer = ensure_organizer(session)

        for i, days in enumerate(past_days):
            start = datetime.utcnow() - timedelta(days=days, hours=2)
            end = start + timedelta(hours=3)
            ev = Event(
                title=f"{titles[i % len(titles)]} (Past {days}d)",
                description="Seeded past event for analytics demo",
                category="networking",
                event_start=start,
                event_end=end,
                location=locations[i % len(locations)],
                max_attendees=50,
                price=0,
                image=None,
                thumbnail=None,
                requires_approval=bool(i % 2),
                organizer_id=organizer.id,
            )
            session.add(ev)
            session.commit()
            session.refresh(ev)

            # Create a few attendees with mixed statuses
            attendees = [
                ("alex@example.com", "Alex Seed", RSVPStatus.GOING),
                ("jordan@example.com", "Jordan Seed", RSVPStatus.MAYBE),
                ("casey@example.com", "Casey Seed", RSVPStatus.NOT_GOING),
                ("sam@example.com", "Sam Seed", RSVPStatus.APPROVED),
            ]

            for email, name, status in attendees:
                user = session.exec(select(User).where(User.email == email)).first()
                if not user:
                    user = User(
                        email=email,
                        full_name=name,
                        role=UserRole.ATTENDEE,
                        hashed_password="not-used-in-seed",
                    )
                    session.add(user)
                    session.commit()
                    session.refresh(user)

                rsvp = RSVP(
                    user_id=user.id,
                    event_id=ev.id,
                    status=status,
                )
                session.add(rsvp)
            session.commit()

    print("Seeded past events with RSVPs.")


if __name__ == "__main__":
    main()

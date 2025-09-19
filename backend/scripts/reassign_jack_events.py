from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User
from app.models.event import Event

"""
Reassign specific events from jack@example.com to jack@eventify.com so the
organizer account matches the intended login.
Safe: updates organizer_id on matching titles if both users exist.
"""

JACK_TITLES = [
    "Jamie Dimon's briefing",
    "Hard Rock Club",
    "Hailey's Grand Prix",
    "Emma's Botinical Garden",
    "Krish's babyshower",
    "St. Stephen's College",
]


def main():
    with Session(engine) as session:
        old = session.exec(select(User).where(User.email == "jack@example.com")).first()
        new = session.exec(select(User).where(User.email == "jack@eventify.com")).first()
        if not new:
            print("Target user jack@eventify.com does not exist. Run ensure_users.py first.")
            return
        if not old:
            print("Source user jack@example.com not found; nothing to reassign.")
            return
        updated = 0
        for title in JACK_TITLES:
            ev = session.exec(select(Event).where(Event.title == title, Event.organizer_id == old.id)).first()
            if ev:
                ev.organizer_id = new.id
                session.add(ev)
                updated += 1
        if updated:
            session.commit()
        print(f"Reassigned {updated} events from {old.email} to {new.email}")


if __name__ == "__main__":
    main()

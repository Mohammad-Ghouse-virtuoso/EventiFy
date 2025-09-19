from datetime import datetime
from sqlmodel import Session, select
import os, sys

# Allow running as a script by adding backend/ to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.db.database import engine
from app.models.event import Event
from app.models.rsvp import RSVP


def purge_before(cutoff: datetime) -> tuple[int, int]:
    """
    Delete events and their RSVPs with event_start < cutoff.
    Returns (deleted_rsvps, deleted_events).
    """
    print(f"[DBG] Purge starting. Cutoff: {cutoff.isoformat()}")
    with Session(engine) as session:
        events = session.exec(select(Event).where(Event.event_start < cutoff)).all()
        if not events:
            print("[DBG] No events to purge.")
            return (0, 0)
        event_ids = [e.id for e in events]
        # Delete RSVPs first to satisfy FK (delete in smaller batches)
        rsvps = session.exec(select(RSVP).where(RSVP.event_id.in_(event_ids))).all()
        print(f"[DBG] Deleting {len(rsvps)} RSVPs for {len(events)} events...")
        for i, r in enumerate(rsvps, 1):
            session.delete(r)
            if i % 200 == 0:
                session.flush()
        session.flush()
        print("[DBG] RSVPs deleted, deleting events...")
        for j, ev in enumerate(events, 1):
            session.delete(ev)
            if j % 200 == 0:
                session.flush()
        session.commit()
        print(f"[DBG] Purge complete. RSVPs: {len(rsvps)}, Events: {len(events)}")
        return (len(rsvps), len(events))


if __name__ == "__main__":
    # 10th Sept 2025 00:00:00 as cutoff
    cutoff_dt = datetime(2025, 9, 10)
    purge_before(cutoff_dt)

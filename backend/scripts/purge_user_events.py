"""
Delete events created by specified users while excluding protected accounts.

Usage examples:
  python -m backend.scripts.purge_user_events --exclude-emails admin@eventify.com jack@example.com --creator-like "@yourdomain.com" --dry-run
  python -m backend.scripts.purge_user_events --exclude-names Admin Jack --dry-run
  python -m backend.scripts.purge_user_events --creator-email you@example.com

Notes:
 - Deletes dependent RSVPs first to satisfy FK constraints.
 - Operates only on active events by default unless --include-inactive is set.
"""
from __future__ import annotations
import argparse
import sys
import os
from typing import List
from sqlmodel import Session, select

# Ensure project root on sys.path for `app.*` imports
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.db.database import engine
from app.models.event import Event
from app.models.user import User
from app.models.rsvp import RSVP


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Purge events by creator with exclusions")
    p.add_argument("--creator-email", dest="creator_email", help="Delete events created by this exact email")
    p.add_argument("--creator-like", dest="creator_like", help="Delete events where creator email contains this substring")
    p.add_argument("--exclude-emails", nargs="*", default=[], help="User emails to exclude from deletion (protected)")
    p.add_argument("--exclude-names", nargs="*", default=["admin", "jack"], help="User names to exclude (case-insensitive contains match)")
    p.add_argument("--include-inactive", action="store_true", help="Also include inactive events in deletion scope")
    p.add_argument("--dry-run", action="store_true", help="Print actions without committing changes")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    deleted_events = 0
    deleted_rsvps = 0

    with Session(engine) as session:
        # Build base user filter
        user_stmt = select(User)
        if args.creator_email:
            user_stmt = user_stmt.where(User.email == args.creator_email)
        if args.creator_like:
            user_stmt = user_stmt.where(User.email.contains(args.creator_like))

        users = session.exec(user_stmt).all()
        if not users:
            print("[DBG] No matching users for the provided filters.")
            return

        # Apply exclusions
        protected_emails = set(e.lower() for e in args.exclude_emails)
        protected_name_tokens = [n.lower() for n in args.exclude_names]

        target_user_ids: List[int] = []
        for u in users:
            name = (u.full_name or "").lower()
            if u.email and u.email.lower() in protected_emails:
                print(f"[DBG] Skip protected by email: {u.email}")
                continue
            if any(tok in name for tok in protected_name_tokens):
                print(f"[DBG] Skip protected by name token: {u.full_name}")
                continue
            target_user_ids.append(u.id)

        if not target_user_ids:
            print("[DBG] No users left after applying exclusion rules.")
            return

        # Query events by these organizers
        ev_stmt = select(Event).where(Event.organizer_id.in_(target_user_ids))
        if not args.include_inactive:
            ev_stmt = ev_stmt.where(Event.is_active == True)

        events = session.exec(ev_stmt).all()
        if not events:
            print("[DBG] No events found for deletion.")
            return

        print(f"[DBG] Candidate events: {len(events)}")
        for ev in events:
            # Count RSVPs
            rsvps = session.exec(select(RSVP).where(RSVP.event_id == ev.id)).all()
            print(f" - Event #{ev.id}: '{ev.title}' by user {ev.organizer_id} | RSVPs: {len(rsvps)}")
            if not args.dry_run:
                # Delete RSVPs first
                for r in rsvps:
                    session.delete(r)
                    deleted_rsvps += 1
                # Soft-delete event (consistent with API) or hard delete? We'll soft-delete.
                ev.is_active = False
                session.add(ev)
                deleted_events += 1

        if args.dry_run:
            print("[DBG] Dry run: no changes committed.")
        else:
            session.commit()
            print("[DBG] Commit complete.")

    print(f"[DBG] Purge summary: events={deleted_events}, rsvps={deleted_rsvps}")


if __name__ == "__main__":
    main()

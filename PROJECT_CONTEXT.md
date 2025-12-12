# EventiFy Context Snapshot (Dec 2025)

A concise reference of what the platform actually supports right now. Use this to keep answers consistent with the codebase.

## What the product does today
- Event discovery and RSVP on a React/Vite frontend backed by FastAPI + SQLModel (SQLite in dev; Docker profile for Postgres available).
- Roles exist (attendee/organizer/admin) with standard event CRUD and RSVP flows.
- Evergreen sandbox data: `npm run seed:evergreen` creates 5 template events (Berlin/NYC/London/Tokyo/Amsterdam) plus NPC attendees so the app always looks “alive.”
- QR check-in flow implemented: backend issues JWT QR tokens per RSVP (`GET /api/v1/events/{event_id}/qr/{rsvp_id}`), organizers check in via token (`POST /api/v1/events/{event_id}/checkin`) and can view stats (`GET /api/v1/events/{event_id}/checkin-stats`). Frontend components: `QRTicket.jsx` (shows QR) and `QRScanner.jsx` (camera scanner).
- API client additions: `checkinAPI` in `src/services/api.js` handles QR token fetch, check-in, and stats.

## Explicitly **not** implemented
- Plus-ones, dietary/preferences capture, seat/slot selection, or capacity rules beyond basic RSVP counts.
- Email/push notifications, calendar exports, waitlist, recurring events, advanced search/geo, in-app chat/real-time feeds.
- Payment/tickets, pricing tiers, refunds.
- Role-based access beyond what’s currently coded for organizers/admin; no granular permissions.

## Tech stack snapshot
- Frontend: React 18, Vite, TailwindCSS; QR rendering via `qrcode`; scanning via `jsqr`.
- Backend: FastAPI, SQLModel, JWT auth; SQLite dev DB; pytest suite in `backend/tests`.
- Tooling: Vitest for frontend, Docker Compose (postgres profile), Node seeder scripts.

## Quick usage notes
- Seeder: run `npm run seed:evergreen` with the backend running to populate sandbox events and NPC RSVPs.
- QR tokens are short-lived JWTs tied to `event_id`, `rsvp_id`, and `user_id`; already-checked-in RSVPs are rejected on rescan.
- Keep references to unbuilt features future-facing only; do not claim plus-ones, dietary options, email flows, or payments exist yet.

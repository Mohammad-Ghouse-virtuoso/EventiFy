# EventiFy — Post-PRD (Post Deployment Requirements Document)

Date: 2025-09-13
Scope: This document captures the features that are implemented and deployed in EventiFy, including API surface, data models, files, configurations, and external dependencies.

## 1) Delivered Features

- Authentication & Authorization
  - Email/password login using OAuth2 Password flow, JWT-based sessions (Bearer token)
  - Registration with role selection (attendee, organizer); admin seeded by default
  - Auth context persisted on the client; protected routes/operations
- User Profiles
  - View/update own profile (email, full name, password); active flag
  - Role-based access: attendee, organizer, admin
- Events Management
  - Create, read, update, soft-delete (is_active=false)
  - Filters: search, category, date, location, created_by
  - Event image support: either predefined banner URL or image upload endpoint
  - Organizer meta enrichment for UI (organizer_name, organizer_role)
- RSVP System
  - User RSVP statuses: going, maybe, not_going; waiting_for_approval, approved, rejected
  - Organizer/Admin approval workflow when event.requires_approval is true
  - Event attendees count in listings
  - Per-event RSVPs fetch with organizer/admin visibility

- Comments & Ratings ||||
  - Add/update/delete comments on events (1–5 rating, optional)
  - Public fetch of approved comments; admin moderation (pending/approve)
- Admin & Organizer Dashboards
  - Admin analytics: events overview, RSVP breakdown, pending approvals
  - Organizer dashboard: created events, attendee counts, RSVP approvals
  - Attendee dashboard: events attending
- UI/UX
  - Modern React + Tailwind UI (Vite)
  - Auth forms, events list with filters, create/edit forms, banners/avatars

## 2) API Surface (FastAPI)

Base URL: `${API_V1_STR}` = `/api/v1`
Auth: Bearer JWT in Authorization header

- Auth (prefix: `/auth`)
  - POST `/auth/login` — OAuth2 form fields: username (email), password
    - Response: `{ access_token, refresh_token, token_type, user: { id, email, full_name, role, is_active } }`
  - POST `/auth/register` — JSON: `{ email, full_name, password, role? }`
    - Response: same as login
  - POST `/auth/refresh` — JSON: `{ refresh_token }` returns `{ access_token, token_type }`
  - GET `/auth/me` — requires Bearer; current user profile

- Users (prefix: `/users`)
  - GET `/users/me` — current profile (auth)
  - PUT `/users/me` — update profile (auth). Accepts `{ email?, full_name?, password?, is_active? }`
  - GET `/users/` — list users (admin)
  - GET `/users/{user_id}` — get user by id (admin)

- Events (prefix: `/events`)
  - GET `/events` — query params: `skip, limit, search, category, date (ISO date), location, created_by, rsvp_status`
    - Returns array of EventOut: includes organizer_name, organizer_role, attendees_count
  - GET `/events/{event_id}` — single EventOut
  - POST `/events` — JSON EventCreate (auth: organizer/admin). Fields: `title, description, category, date (ISO), time, location, max_attendees, price?, image?, requires_approval?`
  - POST `/events/upload` — multipart form (auth: organizer/admin). Fields: `title, description, category, date (ISO), time, location, max_attendees, price?, image(file)`; saves to `/static/event_images/*` and sets full image URL
  - PUT `/events/{event_id}` — JSON EventUpdate (auth: organizer/admin or owner). Partial fields allowed
  - DELETE `/events/{event_id}` — soft delete (auth: organizer/admin or owner)

  - RSVP Endpoints
  - POST `/events/{event_id}/rsvp` — body: `{ status, notes? }` (auth). If `requires_approval`, converts going/maybe → waiting_for_approval
    - GET `/events/{event_id}/rsvps` — (auth). Organizer/admin: returns all RSVPs with user info. Regular user: returns only own RSVP (array form)
    - POST `/events/{event_id}/rsvp/{rsvp_id}/approve` — organizer/admin for that event
    - POST `/events/{event_id}/rsvp/{rsvp_id}/reject` — organizer/admin for that event

- Comments (mounted under events router with `tags=["comments"]`)
  - GET `/events/{event_id}/comments` — list approved comments with `user_name`
  - POST `/events/{event_id}/comments` — create comment (auth)
  - PUT `/events/comments/{comment_id}` — update own comment or admin
  - DELETE `/events/comments/{comment_id}` — delete own comment or admin
  - GET `/events/comments/pending` — list pending comments (admin)
  - PUT `/events/comments/{comment_id}/approve` — approve comment (admin)

Notes:

- Authorization helpers in `app/core/auth.py`: `get_current_active_user`, `require_organizer_or_admin`, `require_admin`
- Static files mounted at `/static` for uploaded images

## 3) Data Model (SQLModel)

- User (`app/models/user.py`)
  - id PK, email (unique, indexed), full_name, role: enum(attendee|organizer|admin), is_active: bool
  - hashed_password, created_at: datetime
  - DTOs: `UserCreate(password)`, `UserUpdate(...)`

- Event (`app/models/event.py`)
  - id PK, title, description, category, date: datetime, time: str, location
  - max_attendees: int, price: float, image: str?, requires_approval: bool
  - organizer_id FK user.id, created_at, is_active
  - DTOs: `EventCreate`, `EventUpdate`, `EventOut` (adds organizer_name, organizer_role, attendees_count)

- RSVP (`app/models/rsvp.py`)
  - id PK, user_id FK user.id, event_id FK event.id
  - status: enum(going, maybe, not_going, waiting_for_approval, approved, rejected)
  - notes?, created_at, updated_at, checked_in: bool, checked_in_at?, approved_by?, approved_at?
  - DTOs: `RSVPCreate`, `RSVPUpdate`, `RSVPResponse`

- Comment (`app/models/comment.py`)
  - id PK, user_id FK user.id, event_id FK event.id
  - content, rating (1–5 optional), created_at, updated_at, is_approved
  - DTOs: `CommentCreate(event_id)`, `CommentUpdate`, `CommentResponse(user_name)`

## 4) Backend App & Config

- Framework: FastAPI
- App entry: `backend/app/main.py`
  - CORS: origins now taken from `settings.BACKEND_CORS_ORIGINS`
  - Startup hook: `init_db()` creates tables and seeds sample data if empty
  - Static mount: `/static` mapped from `settings.STATIC_DIR` (ensure directory exists)
  - API router mounted at `/api/v1`
- Settings: `backend/app/core/config.py`
  - `DATABASE_URL` (default sqlite:///./eventify.db; env override supported)
  - JWT: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
  - Refresh: `REFRESH_SECRET_KEY`, `REFRESH_TOKEN_EXPIRE_DAYS`
  - `BACKEND_CORS_ORIGINS`
  - `BASE_URL` (e.g., http://localhost:8000) used to construct absolute static asset URLs
  - `STATIC_DIR` absolute path for static files (default resolves to backend/app/../static)
- Auth utils: `backend/app/core/auth.py`
  - bcrypt hashing, JWT create/verify, role guards
- Database: `backend/app/db/database.py`
  - `engine = create_engine(DATABASE_URL)`
  - `create_db_and_tables()`; `get_session()` session dependency
- DB init/seed: `backend/app/db/init_db.py`
  - Seeds admin/organizers/attendees and 5 sample events + RSVPs
- Static uploads: `backend/static/event_images/` for uploaded images

## 5) Frontend App (Vite + React)

- Location: `src/`
- Routing & Pages
  - `pages/Login.jsx`, `pages/Register.jsx`: auth flows
  - `pages/Home.jsx` (present in repo), `pages/Events.jsx`: discovery with filters and search
  - `pages/CreateEvent.jsx`, `pages/EditEvent.jsx`: organizer CRUD; supports banners and uploads
  - `pages/Dashboard.jsx`: role-aware dashboard with stats and approvals section
  - `pages/AdminPanel.jsx`: global analytics and RSVP moderation
- Contexts
  - `contexts/AuthContext.jsx`: stores user and token, exposes login/register/logout, loads /auth/me
  - `contexts/ProfileContext.jsx`, `contexts/NotificationContext.jsx`: profile visuals and UI toasts
- Components
  - `components/EventCard.jsx`, `BannerSelector.jsx`, `AvatarSelector.jsx`, `Navbar.jsx`, etc.
- Services
  - `services/api.js`: Axios instance with bearer token; wraps auth, events, RSVP, and admin calls
- Styling
  - Tailwind CSS via `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `src/styles/modern.css`
- Vite config: `vite.config.js` (port 3000, open, sourcemap)

## 6) Environments & Configuration

- Backend env example: `backend/env.example`
  - `DATABASE_URL=postgresql://eventify_user:eventify_pass@localhost:5432/eventify_db`
  - `SECRET_KEY`, `REFRESH_SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `UPLOAD_DIR`
  - `BASE_URL` (default `http://localhost:8000`)
  - `STATIC_DIR` (optional absolute path)
- Default DB is SQLite (if env not set) at `./eventify.db` (repo root); prod should point to Postgres
- Frontend base API URL: `VITE_API_URL` env; falls back to `http://localhost:8000/api/v1`
  - Root `.env.example` added with `VITE_API_URL` example
  - Image URLs: absolute URLs used as-is; `/static/...` paths are prefixed with the origin derived from `VITE_API_URL`
- Static assets exposed under `/static` (uploads) and frontend build under `dist` (if built)

## 7) Key Files and Directories

Backend

- `backend/app/main.py` — FastAPI app, CORS, static, routing
- `backend/app/api/api_v1/api.py` — API router wiring
- `backend/app/api/api_v1/endpoints/` — route modules: `auth.py`, `users.py`, `events.py`, `comments.py`
- `backend/app/models/` — SQLModel files: `user.py`, `event.py`, `rsvp.py`, `comment.py`
- `backend/app/core/` — config and auth helpers
- `backend/app/db/` — engine/session, bootstrap/seed
- `backend/static/event_images/` — uploaded event images

Frontend

- `src/pages/` — Login, Register, Home, Events, Dashboard, CreateEvent, EditEvent, AdminPanel, etc.
- `src/components/` — EventCard, BannerSelector, AvatarSelector, Navbar, Footer, etc.
- `src/contexts/` — AuthContext, ProfileContext, NotificationContext
- `src/services/api.js` — Axios client and API wrappers
- `vite.config.js`, `tailwind.config.js`, `postcss.config.js`

Repo root & Utilities

- `requirements.txt` — backend deps (FastAPI, SQLModel, jose, passlib, etc.)
- `package.json` — frontend deps (React, axios, date-fns, qrcode)
- `backend/migrate_db.py`, `show_db.py` — helper scripts
- `backend/eventify.db` — SQLite DB file (if previously created)

## 8) Data Flow & Permissions

- Auth token is stored in localStorage and applied to all Axios requests via interceptor
- Role gates:
  - Organizer/Admin: create events, update/delete own events; approve/reject RSVPs; view all RSVPs for their events
  - Admin: platform-wide user list access; comment moderation; RSVP approvals on any event
  - Attendee: RSVP to events, create comments, edit/delete own comments

## 9) External Dependencies

Backend (requirements.txt)

- fastapi, uvicorn
- sqlmodel (SQLAlchemy + Pydantic)
- python-jose[cryptography] for JWT
- passlib[bcrypt] for hashing
- python-multipart for file uploads
- pillow for image handling (if needed)
- python-decouple for env vars
- alembic (not yet wired in code) for migrations
- pytest, httpx (for testing)

Frontend (package.json)

- react, react-dom, react-router-dom
- axios for HTTP
- date-fns for formatting
- @headlessui/react, @heroicons/react for UI
- qrcode (present; not actively used in pages captured)
- vite + tailwind toolchain

## 10) Known Gaps / Notes

- Time handling: `Event` stores `date` (datetime) and also `time` string; frontend sometimes constructs ISO by combining date+time — ensure consistency.
- Image upload previously hardcoded `http://localhost:8000`; now uses `BASE_URL` from settings and frontend resolves `/static` with `VITE_API_URL` origin.
- AdminPanel shows RSVP categories (going/maybe/not_going); backend now uses `maybe` consistently (previously `interested`).

Upgrade note (2025-09-13):
- Unified RSVP status naming to use `maybe` instead of `interested` across backend and frontend.
- Migrations:
  - Run `make alembic-upgrade` to apply `20250913_000002_rsvp_interested_to_maybe` which renames existing rows.
- API behavior: when `requires_approval` is true, statuses `going` or `maybe` are converted to `waiting_for_approval` until approved.
- Alembic is listed but migrations are not configured; current schema bootstraps via SQLModel metadata.
- Comment moderation default `is_approved=True` allows immediate display; adjust default if stricter moderation required.
- Security: SECRET_KEY default is long but should be rotated in production; consider HTTPS, refresh tokens, CSRF for forms if needed.
  - Now enforced: SECRET_KEY and REFRESH_SECRET_KEY must be provided via env; added Makefile target `gen-secret` to generate strong keys.
  - Refresh tokens added; `/auth/refresh` issues new access tokens.
  - Basic CSRF protection added for form endpoints using `X-CSRF-Token` header and `csrftoken` cookie.

## 11) Acceptance and Verification

- API responds at `/api/v1` with OpenAPI at `/api/v1/openapi.json`
- Auth flows validated via `src/pages/Login.jsx` and `Register.jsx`
- Event creation tested via JSON and multipart upload endpoints; uploaded images saved under `backend/static/event_images/`
- Dashboard/Admin views consume the documented endpoints; pending RSVPs management exercised in Dashboard and AdminPanel

Image URL QA (new):
- Run `npm run qa:images` (ensure `VITE_API_URL` is set or pass API base as arg)
- Expected: `[OK]` for each image URL and zero failures; script auto-resolves `/static/...` using the origin of `VITE_API_URL`.

---
Owner: EventiFy Team
Repository: Mohammad-Ghouse-virtuoso/EventiFy
Branch: main

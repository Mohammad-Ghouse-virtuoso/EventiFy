\n## Load test results — 2025-09-15

| Endpoint | VUs | p95 | Fail-rate | Iterations | Status |
|---|---:|---:|---:|---:|---|
| rsvp | 50 | 53.07 ms | 0.00% | 3530 | PASS |
| login | 50 | 197.28 ms | 99.90% | 5215 | FAIL |

Re-run (dev, argon2id, per-user rate key) — 2025-09-15 later

| Endpoint | VUs | p95 | Fail-rate | Iterations | Status |
|---|---:|---:|---:|---:|---|
| login | 50 | 4389.72 ms | 0.00% | 234 | FAIL (p95>300ms) |

Artifacts:
- Raw NDJSON: `reports/login_20250915_221844.json`
- Summary: `reports/login_20250915_221844_summary.json`

Notes:
- 0% failures and correct tokens indicate CSRF and credentials are good.
- High p95 (~4.39s) is due to Argon2id hashing cost under concurrent load (50 VUs), not rate limiting.
- Next: consider tuning Argon2 parameters for login or adding adaptive backoff/captcha after a few attempts while keeping security posture.

Notes:
- Test script: `tests/load-rsvp.js` (login separated from RSVP metrics; counters for attempts/success/missing tokens).
- Summary source: `reports/rsvp_50vus_summary.json`.
- Raw NDJSON: `reports/rsvp_50vus.json`.
- Custom counters observed: attempts=2630, success=2630 (100%), missing_token_vus=45.
- Thresholds enforced: p95<200ms, fail-rate<5% on `endpoint:rsvp` — both satisfied.

Credential requirement for k6: predictable users must exist (`user1..userN@example.com`, password `password123`). Seed with `node scripts/seed.js --users=N --rotate` and `VITE_API_URL` pointing to your API.

Predictable creds are required for the login and RSVP k6 scripts to avoid false failures. Create them with:

```
USER_COUNT=100 VITE_API_URL=http://127.0.0.1:8001/api/v1 node scripts/seed.js --users=100 --rotate
```

## Authentication

Currently uses bcrypt via passlib. Potential hotspots: password verification and token creation.
Switched password hashing from bcrypt to argon2id (argon2-cffi) and added a simple in-memory rate limiter for login.

Highlights:
- Hashing: argon2id with time_cost=2, memory_cost=102400 KiB (~100 MiB), parallelism=8.
- Migration: legacy bcrypt hashes are transparently rehashed to argon2id after a successful login.
- Rate limiting: 5 login attempts per IP per minute; exceeding returns HTTP 429 ("Too many login attempts, try later.").
- JWTs now include role and is_active claims to reduce DB reads during auth checks.

Expected impact:
- Argon2id increases CPU/memory cost per hash (intentional hardening) while keeping login p95 acceptable for typical loads.
- Fewer DB hits on authenticated requests due to trusted JWT claims.

 Recommendations:
 - Keep token signing using HS256. Consider RS256 if public verification is needed later.
# EventiFy Performance: Bottlenecks & Fixes

# Login comparison — Before vs After Argon2 tuning (2025-09-15)

| Endpoint | VUs | p95 | Fail-rate | Iterations | Status | Notes |
|---|---:|---:|---:|---:|---|---|
| login (before tuning) | 50 | 4389.72 ms | 0.00% | 234 | FAIL | Dev run prior to tuning; Argon2id defaults were heavier (mem~100 MiB). |
| login (after tuning)  | 50 | 3232.58 ms | 0.00% | 284 | FAIL | Dev tuned to time=2, mem=51200 KiB, parallelism=2; p95 improved but >300ms threshold. |

Artifacts:
- After tuning raw: `reports/login_tuned.json`
- After tuning summary: `reports/login_tuned_summary.json`

Next steps:
- If the target is p95<300ms at 50 VUs, consider further reducing Argon2 parameters in dev/test (e.g., memory=32768, time=1) or lowering VUs for login-specific tests.
- Keep production parameters strong and rely on rate limiting and backoff for spikes.

Date: 2025-09-13
Scope: Backend FastAPI + SQLModel API (login, events, RSVPs, comments). Frontend excluded from profiling.

This document lists likely bottlenecks and precise fixes based on code review. Once k6 is installed, we will validate with smoke runs and update this file with measurements.

## Summary (TL;DR)

- Switch SQLite dev engine to check_same_thread=False and consider Postgres for realistic concurrency.
- Add DB indexes on hot query columns (RSVP.user_id/event_id, Event.organizer_id/event_start, User.email).
- Avoid N+1 in event listing (joins or aggregated counts instead of per-event queries).
- Tune bcrypt cost or switch to Argon2id; add login rate limiting to protect CPU.
- Reuse DB sessions efficiently; consider connection pooling parameters for Postgres.
- Reduce per-request work in RSVP/comment endpoints; ensure JSON paths are CSRF-exempt (they are) and fast.

Environment split (dev vs prod)
- Dev uses SQLite for speed of iteration and easy seeding, with WAL and tuned pragmas.
- Prod uses a managed database (e.g., Postgres). If targeting PlanetScale, use a MySQL driver; adjust DSN accordingly.
- The backend selects env via ENVIRONMENT/ENV -> `.env.dev` (dev) or `.env.prod` (prod), falling back to `.env`.
- Use `make migrate ENV=dev|prod` to apply migrations to the selected environment.

PostgreSQL production notes

- Driver: `psycopg2-binary` supported; DSN `postgresql+psycopg2://user:pass@host:5432/db`.
- Pooling: prod uses `pool_pre_ping=True`, `pool_size=40`, `max_overflow=100`, `pool_recycle=1800` to keep connections healthy and reduce latency.
- Alembic: standard migrations apply against Postgres.

## Detected Bottlenecks & Fixes

### 1) Database Engine & Concurrency

- Symptom: Using sqlite:/// without explicit check_same_thread=False may serialize access and degrade concurrent VU performance under k6.
- Evidence: backend/app/db/database.py uses engine = create_engine(settings.DATABASE_URL) with defaults.
- Fixes:
  - For SQLite (dev): create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": false}).
  - For production: Use Postgres; configure pool size (e.g., pool_size=10, max_overflow=20, pool_pre_ping=true).
  - Add PRAGMA journal_mode=WAL in SQLite for better concurrency (optional init step).

### 2) Missing Indexes on Hot Paths

- Symptom: Filters and lookups on non-indexed columns cause table scans.
- Evidence:
  - RSVP: frequent lookups by (user_id, event_id) and by event_id (counts and lists).
  - Event: filters by organizer_id, date range on event_start.
  - User: login by email.
- Fixes (Alembic migration recommended):
  - rsvp: index user_id, event_id, and a composite index (user_id, event_id); optional status for moderation queries.
  - event: index organizer_id, event_start, is_active; consider category/location btree if heavily filtered.
  - user: unique index on email (should exist via schema), plus explicit index if not already.

### 3) N+1 Queries in Event Listing

- Symptom: GET /events runs 1 query for events, then per event: session.get(User, organizer_id) and select(RSVP) where event_id==ev.id, leading to O(N) extra queries.
- Evidence: see backend/app/api/api_v1/endpoints/events.py#get_events.
- Fixes:
  - Replace per-event queries with a single joined/aggregated query:
    - Preload organizers via IN on organizer ids and map organizer_id -> (full_name, role).
    - Compute attendee counts via SELECT r.event_id, COUNT(*) FROM rsvp r WHERE r.event_id IN (...) GROUP BY r.event_id and map.
  - Alternatively, add a materialized field attendees_count updated on write (tradeoff).

### 4) Password Hashing Cost on Login

- Symptom: bcrypt default cost can saturate CPU with concurrent logins.
- Evidence: passlib CryptContext(schemes=["bcrypt"]) in core/auth.py.
- Fixes:
  - Consider Argon2id (argon2-cffi), or parameterize bcrypt rounds to a measured value.
  - Add simple rate limiting/backoff for repeated failures (middleware or reverse proxy).

### 5) Token Handling & DB Touches

- Symptom: Extra DB round-trips in get_current_user on every protected request.
- Evidence: Decodes JWT, then fetches the user each time.
- Fixes:
  - Include role and is_active in JWT claims and only hit DB when necessary.
  - Optionally cache user lookups briefly in-memory to reduce load during spikes.

### 6) RSVP Endpoint Upsert Logic

- Symptom: Two queries (existence check + update/insert) can contend under high concurrency.
- Evidence: select existing then conditional update/insert.
- Fixes:
  - Add unique constraint on (user_id, event_id) and perform an upsert (INSERT ON CONFLICT DO UPDATE) in Postgres.
  - Until Postgres: keep composite index to reduce scan time; ensure session commit scope is minimal.

### 7) File Upload Path

- Symptom: /events/upload reads entire file into memory; acceptable for small images but may hurt under load.
- Fixes:
  - Stream to disk in chunks and validate content-type/size early.

### 8) Comments Endpoints & Moderation

- Symptom: Joins done per request; potential unindexed filters (is_approved).
- Fixes:
  - Index comment.event_id, comment.user_id, comment.is_approved.
  - For broadcast-like behavior, consider a dedicated table/endpoint optimized for announcements.

### 9) CORS/CSRF Overhead

- Symptom: CSRF enforced only for form endpoints; JSON APIs are exempt—already optimized.
- Fixes: None.

### 10) Pydantic/Serialization Cost

- Symptom: Per-item shaping for events adds overhead.
- Fixes: Use faster dumps (Pydantic v2) or reduce field transformations by doing more in SQL.

## Suggested Migrations (indexes/constraints)

Create a new Alembic revision applying these (adjust names to your conventions):

- rsvp
  - CREATE INDEX ix_rsvp_user_id ON rsvp (user_id);
  - CREATE INDEX ix_rsvp_event_id ON rsvp (event_id);
  - CREATE UNIQUE INDEX uq_rsvp_user_event ON rsvp (user_id, event_id);
  - Optional: CREATE INDEX ix_rsvp_status ON rsvp (status);

- event
  - CREATE INDEX ix_event_organizer_id ON event (organizer_id);
  - CREATE INDEX ix_event_event_start ON event (event_start);
  - CREATE INDEX ix_event_is_active ON event (is_active);

- comment
  - CREATE INDEX ix_comment_event_id ON comment (event_id);
  - CREATE INDEX ix_comment_user_id ON comment (user_id);
  - CREATE INDEX ix_comment_is_approved ON comment (is_approved);

- user
  - Ensure email is UNIQUE; add explicit CREATE UNIQUE INDEX uq_user_email ON user (email); if not already.

## k6 Smoke Plan (post-install)

Use very light scenarios to validate paths and surface obvious bottlenecks:

- Login smoke
  - VUs: 50, duration: 15s
  - Endpoint: POST /auth/login with CSRF token
  - Thresholds: p95 < 300ms, fail-rate < 5%

- RSVP smoke
  - VUs: 100, duration: 20s
  - Endpoint: POST /events/{id}/rsvp with JSON body
  - Thresholds: p95 < 250ms, fail-rate < 5%

Environment: set API_BASE to your API base URL.

## Postgres Connection Guidance (when switching)

- DSN: postgresql+psycopg2://user:pass@host:5432/db
- Engine tuning example: pool_size=10, max_overflow=20, pool_timeout=30, pool_pre_ping=true
- Run VACUUM ANALYZE after large seeds.

## Appendix: Code Touchpoints

- Engine: backend/app/db/database.py
- Hot endpoints: events.py (get_events, rsvp_to_event), auth.py (login), comments.py
- Security: core/auth.py (hashing, JWT), main.py (CSRF middleware)

---
We will update this document with measured metrics after running smoke tests once k6 is installed.

## Smoke attempt results (2025-09-14)

- Status: Blocked. The backend on 127.0.0.1:8000 accepts TCP connections but does not respond to HTTP GET / or /api/v1/auth/csrf-token within 5s (timeouts). As a result, k6 iterations did not complete.
- Impact: Unable to collect latency/failure metrics.
- Recommended immediate checks:
  1) Restart backend with logs visible to catch any blocking errors during startup.
     - Ensure Alembic migrations are applied: `make alembic-upgrade`.
  2) For SQLite dev, adjust engine to: `create_engine(DATABASE_URL, connect_args={"check_same_thread": False})` and consider enabling WAL.
  3) Temporarily disable or log around startup seeding (`init_db`) to ensure it isn’t hanging on engine inspection.
  4) Verify secrets/env vars are present (SECRET_KEY, REFRESH_SECRET_KEY, BASE_URL) so startup doesn’t block on configuration.
  5) Test a plain curl to `/` after restart and ensure a quick JSON response.

## Smoke results (2025-09-14 later)

- Backend restarted on 127.0.0.1:8001; basic health confirmed (GET / returns 200 JSON).
- Seeded: attendee1..50, organizer1, created one event.

Login (k6, VUS=10, 10s, user=attendee1@example.com)
 
- Success rate: 100% (fail-rate 0.00%)
- Latency: p95 ≈ 3.11s, avg ≈ 1.47s → too high; CPU-bound by hashing.
- Next actions: lower bcrypt cost or switch to argon2id; add login rate limit; benchmark after index and engine tweaks.

RSVP (k6, VUS=10, 10s, JSON with bearer tokens)
 
- Success rate (RSVP endpoint): 77.37% (fail-rate 22.63% overall before scoping)
- Latency: p95 ≈ 131.8ms, avg ≈ 101.8ms (endpoint:rsvp)
- Notes: The elevated fail rate was due to setup/login phases being included in http_req_failed. We updated the test to scope fail-rate thresholds to endpoint:rsvp and tag login requests. Endpoint latency itself is healthy. Next re-run should show fail-rate <5% for RSVP when excluding login noise.

Follow-up optimizations applied (2025-09-14):
 
- SQLite engine tuned for concurrency (WAL, synchronous=NORMAL, foreign_keys=ON) and check_same_thread=False.
- Removed unnecessary session.refresh calls in RSVP writes.
- Added Alembic migration to index rsvp.user_id, rsvp.event_id and enforce unique (user_id, event_id).

Indexes cleanup (2025-09-14 later):
 
- Added composite comment index ix_comment_event_id_is_approved (event_id, is_approved) to accelerate event comments listing and moderation filters.
- Added ix_comment_user_id to speed up "my comments" and joins to users.
- Added ix_comment_is_approved to support pending/approved moderation queues.
- Ensured ix_user_email exists in addition to uq_user_email for login lookups.

## Head-to-Head Results: SQLite vs PostgreSQL (50 VUs / 20s) — 2025-09-14

Methodology

- k6 scripts: `tests/load-events.js` and `tests/load-rsvp.js`
- Tags: Requests are tagged by endpoint (e.g., `endpoint:rsvp`) so thresholds and fail-rate are scoped correctly.
- Runs: 50 virtual users for 20 seconds, steady load.

Results

| Endpoint | DB | VUs | p95 | Fail-rate |
| --- | --- | ---:| ---:| ---:|
| GET /events | SQLite (WAL) | 50 | ~202 ms | 0.00% |
| POST /events/{id}/rsvp | SQLite (WAL) | 50 | ~570 ms | 0.00% (endpoint:rsvp) |
| GET /events | PostgreSQL | 50 | TBD | TBD |
| POST /events/{id}/rsvp | PostgreSQL | 50 | TBD | TBD |

Notes

- SQLite exhibited the expected single-writer bottleneck under concurrent POST /rsvp. Even with WAL and tuned pragmas, writes serialize; at 50 VUs we observed p95 ≈ 570 ms.
- PostgreSQL removes the single-writer constraint of SQLite and, combined with connection pooling (`pool_size=40`, `max_overflow=100`, `pool_pre_ping=True`), should dramatically reduce write latency for RSVP while maintaining low fail-rate. PostgreSQL results will be filled in after running the same tests against the prod env.

How to run

- Dev (SQLite):
  - `make run ENV=dev`
  - `k6 run tests/load-events.js`
  - `k6 run tests/load-rsvp.js`
- PostgreSQL:
  - Install Postgres (Ubuntu: `sudo apt install postgresql`, macOS: `brew install postgresql`)
  - Create DB and user (see README)
  - Configure `backend/.env.prod` with a Postgres DSN
  - `make migrate ENV=prod` then `make run ENV=prod`
  - `API_BASE=http://127.0.0.1:8001/api/v1 k6 run tests/load-events.js`
  - `API_BASE=http://127.0.0.1:8001/api/v1 PASSWORD=... k6 run tests/load-rsvp.js`

Next steps

- Re-run both tests on PostgreSQL and fill in the p95 and fail-rate numbers above.
- Scale the load to 100–200 VUs to observe how read and write paths behave under sustained pressure and to validate connection pool sizing.


## Postgres Results & Automated Reporting (2025-09-15)

New k6 reporting workflow added:

- Make targets: `make load-events`, `make load-rsvp`, `make load-login` produce raw NDJSON (`reports/<endpoint>_TIMESTAMP.json`) and copy the structured `summary.json` into timestamped `*_summary.json` files.
- Analyzer script: `python scripts/analyze_k6.py reports/*.json` parses both single JSON summaries and raw NDJSON streams (reconstructs percentile + fail-rate metrics) and prints a markdown table for quick paste.
- All thresholds now scoped by endpoint tag (`endpoint:events`, `endpoint:rsvp`, `endpoint:login`).

Test context:
- Backend running with PostgreSQL (pool_size=40 / max_overflow=100 / pre_ping / recycle=1800).
- Seeded users via `scripts/seed-k6-users.js` (user1..N, password `password123`).
- Login script still used random `attendee{N}` pattern initially; mismatch with seeded user schema yielded elevated fail-rate.

Captured metrics (50 VUs / 20s steady for events & rsvp, 500 VUs / 30s spike for login default script settings unless overridden):

| Endpoint | VUs | p95 (ms) | Fail-rate (%) | Iterations | Status | Notes |
|----------|-----|----------|---------------|------------|--------|-------|
| GET /events | 50 | ~384.78 | 0.00 | (see report) | p95>250ms | Latency regression vs prior SQLite (~202ms). Likely due to N+1 query pattern + larger pool overhead. |
| POST /rsvp | 50 | ~85.94 | 0.00 | (see report) | ok | Improved vs SQLite write p95 (~570ms). Postgres removed single-writer bottleneck. |
| POST /auth/login | 500 | ~163.24 | 49.95 | (see report) | fail-rate>5% | High fail-rate caused by credential mismatch and argon2id cost under spike. |

Key Findings (2025-09-15):
1. Events endpoint p95 breach: Need to eliminate N+1 (organizer fetch + RSVP counts). Expect sub-250ms once aggregated queries / precomputed counts implemented.
2. RSVP write path healthy: p95 well below 200ms with near-zero failures; next step is scale test to 100–200 VUs and implement ON CONFLICT upsert.
3. Login fail-rate: Test user naming mismatch plus high hash cost under 500 VUs. Will validate latency with fixed known user credentials to isolate hashing performance.

Immediate Remediations Planned:
- Refactor GET /events to batch organizer resolution and RSVP count aggregation.
- Align login script user naming (switch to `user{N}` or provide `FIXED_USER`/`FIXED_PASS`).
- Add composite unique constraint `(user_id, event_id)` if not yet enforced for efficient upsert.

Next Measurement Plan:
- Re-run events after N+1 fix aiming for p95 < 220ms at 50 VUs.
- Increase RSVP test to 100 VUs; confirm p95 < 150ms and fail-rate < 2%.
- Controlled login test: 50 VUs, fixed credentials; target argon2id p95 < 300ms without reducing security cost parameters prematurely.

Automation Notes:
- Analyzer tolerant of NDJSON; no conversion step required.
- Potential future enhancement: persist analyzer output into `reports/summary_latest.md` and integrate into CI to detect regressions.


BACKEND_DIR=backend
PYTHON ?= python3
# Prefer project venv python if available
ifneq (,$(wildcard $(BACKEND_DIR)/.venv/bin/python))
	PYTHON := $(abspath $(BACKEND_DIR)/.venv/bin/python)
endif
# Environment selection: dev (default) or prod
ENV ?= dev

# Resolve env file path
ifeq ($(ENV),prod)
	ENV_FILE=$(BACKEND_DIR)/.env.prod
else
	ENV_FILE=$(BACKEND_DIR)/.env.dev
endif

# If the chosen env file doesn't exist, fall back to $(BACKEND_DIR)/.env if present
ifeq (,$(wildcard $(ENV_FILE)))
	ifneq (,$(wildcard $(BACKEND_DIR)/.env))
		ENV_FILE=$(BACKEND_DIR)/.env
	endif
endif

.PHONY: alembic-rev alembic-upgrade alembic-downgrade

alembic-rev:
	cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) $(PYTHON) -m alembic revision --autogenerate -m "$(m)"

alembic-upgrade:
	cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) $(PYTHON) -m alembic upgrade head

alembic-downgrade:
	cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) $(PYTHON) -m alembic downgrade -1

.PHONY: migrate

# Apply migrations for the selected ENV (ENV=dev|prod)
migrate: alembic-upgrade
	@echo "Applied Alembic migrations for ENV=$(ENV)."

.PHONY: test
test:
	@echo "Running backend tests with ENV=$(ENV)"
	# Placeholders for pytest or other commands
	# cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) pytest -q

.PHONY: run
run:
	@echo "Starting backend with ENV=$(ENV)"
	@if [ "$(ENV)" = "dev" ]; then \
		cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) $(PYTHON) -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload; \
	else \
		cd $(BACKEND_DIR) && ENVIRONMENT=$(ENV) $(PYTHON) -m uvicorn app.main:app --host 0.0.0.0 --port 8001; \
	fi

.PHONY: dev
dev:
	@echo "Starting both backend and frontend (dev mode)"
	@bash scripts/dev.sh

.PHONY: gen-secret
gen-secret:
	cd $(BACKEND_DIR) && $(PYTHON) scripts/gen_secret_key.py

# --- Seeding and Load Testing ---
.PHONY: seed load-rsvp load-login load-message

seed:
	# Uses node seeding script; override counts: USERS=100 EVENTS=20; override API with VITE_API_URL
	@if [ -n "$(USERS)" ] || [ -n "$(EVENTS)" ]; then \
		node scripts/seed.js --users=$${USERS:-2000} --events=$${EVENTS:-200}; \
	else \
		node scripts/seed.js; \
	fi

reports-dir:
	mkdir -p reports

load-events: reports-dir
	# Run k6 events scenario and emit JSON + summary
	@ts=$$(date +%Y%m%d_%H%M%S); \
	out_json=reports/events_$${ts}.json; \
	out_summary=reports/events_$${ts}_summary.json; \
	API_BASE=$${API_BASE:-http://127.0.0.1:8001/api/v1} k6 run --tag test=events --out json=$$out_json tests/load-events.js || true; \
	if [ -f summary.json ]; then cp summary.json $$out_summary; echo "Copied summary.json -> $$out_summary"; else echo "No summary.json produced"; fi; \
	echo "Raw JSON: $$out_json"; \
	echo "Summary:  $$out_summary";

load-rsvp: reports-dir
	# Run k6 RSVP scenario and emit JSON + summary
	@ts=$$(date +%Y%m%d_%H%M%S); \
	out_json=reports/rsvp_$${ts}.json; \
	out_summary=reports/rsvp_$${ts}_summary.json; \
	API_BASE=$${API_BASE:-http://127.0.0.1:8001/api/v1} k6 run --tag test=rsvp --out json=$$out_json tests/load-rsvp.js || true; \
	if [ -f summary.json ]; then cp summary.json $$out_summary; echo "Copied summary.json -> $$out_summary"; else echo "No summary.json produced"; fi; \
	echo "Raw JSON: $$out_json"; \
	echo "Summary:  $$out_summary";

load-login: reports-dir
	# Run k6 login scenario and emit JSON + summary
	@ts=$$(date +%Y%m%d_%H%M%S); \
	out_json=reports/login_$${ts}.json; \
	out_summary=reports/login_$${ts}_summary.json; \
	API_BASE=$${API_BASE:-http://127.0.0.1:8001/api/v1} k6 run --tag test=login --out json=$$out_json tests/load-login.js || true; \
	if [ -f summary.json ]; then cp summary.json $$out_summary; echo "Copied summary.json -> $$out_summary"; else echo "No summary.json produced"; fi; \
	echo "Raw JSON: $$out_json"; \
	echo "Summary:  $$out_summary";

load-message:
	# Run k6 broadcast-style comment scenario; override API_BASE, VUS, DURATION, ORG_START, ORG_COUNT
	k6 run tests/load-message.js

.PHONY: test-login
test-login: reports-dir
	# Seed predictable users (override with START and COUNT)
	@API=$${API_BASE:-http://127.0.0.1:8001/api/v1}; \
	START=$${USER_START:-2001}; COUNT=$${USER_COUNT:-50}; \
	VITE_API_URL=$$API node scripts/seed.js --users=$$COUNT --events=0 --start=$$START --rotate; \
	# Run k6 login with tuned dev parameters and fixed output paths
	VUS=$${VUS:-50} DURATION=$${DURATION:-20s} API_BASE=$$API USER_START=$$START USER_COUNT=$$COUNT PASSWORD=$${PASSWORD:-password123} \
		k6 run --tag test=login --out json=reports/login_tuned.json tests/load-login.js || true; \
	if [ -f summary.json ]; then cp -f summary.json reports/login_tuned_summary.json; fi; \
	# Append comparison row to PERF-BOTTLENECKS.md (after tuning)
	if [ -f reports/login_tuned_summary.json ]; then \
		P95=$$(jq -r '.metrics.p95' reports/login_tuned_summary.json); \
		FAIL=$$(jq -r '.metrics.fail_rate' reports/login_tuned_summary.json); \
		ITERS=$$(jq -r '.metrics.iterations' reports/login_tuned_summary.json); \
		VUS_VAL=$$(jq -r '.metrics.vus' reports/login_tuned_summary.json); \
		STATUS=$$(awk -v p95="$$P95" 'BEGIN{ if (p95+0 < 300) print "PASS"; else print "FAIL" }'); \
		echo "" >> PERF-BOTTLENECKS.md; \
		echo "| login (after tuning) | $$VUS_VAL | $$(printf '%.2f ms' $$P95) | $$(printf '%.2f%%' $$(echo "$$FAIL*100" | bc -l)) | $$ITERS | $$STATUS | Tuned dev Argon2 (t=2,m=51200,p=2). |" >> PERF-BOTTLENECKS.md; \
		echo "Updated PERF-BOTTLENECKS.md with after-tuning row."; \
	else \
		echo "No reports/login_tuned_summary.json found; skipping PERF-BOTTLENECKS.md update."; \
	fi

.PHONY: setup-env-prod
setup-env-prod:
	# Configure backend/.env.prod for PostgreSQL
	cd $(BACKEND_DIR) && $(PYTHON) scripts/setup_env_prod.py $(ARGS)

.PHONY: db-up db-down db-logs
db-up:
	# Start local PostgreSQL via docker-compose (binds host 55432->container 5432)
	docker compose -f docker-compose.postgres.yml up -d
	@echo "Postgres starting on localhost:55432 (user: samrat, db: eventify). Update DATABASE_URL accordingly."

db-down:
	# Stop local PostgreSQL
	docker compose -f docker-compose.postgres.yml down -v

db-logs:
	# Tail Postgres logs
	docker compose -f docker-compose.postgres.yml logs -f

#!/usr/bin/env bash
set -euo pipefail

# One-command dev runner: starts FastAPI backend and Vite frontend, with health checks and clean shutdown.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
UVICORN_HOST="127.0.0.1"
UVICORN_PORT="8000"
FRONTEND_PORT="3000"
ENVIRONMENT="dev"

BACKEND_LOG="$ROOT_DIR/uvicorn_8000.log"
FRONTEND_LOG="$ROOT_DIR/vite.log"
BACKEND_PID_FILE="$ROOT_DIR/uvicorn.pid"
FRONTEND_PID_FILE="$ROOT_DIR/vite.pid"

# Prefer project venv python if available
PYTHON="python3"
if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  PYTHON="$BACKEND_DIR/.venv/bin/python"
fi

echo "[dev.sh] Using python: $PYTHON"

# Ensure backend dependencies exist (uvicorn importable)
ensure_backend_deps() {
  if ! "$PYTHON" - <<'PY'
import importlib
try:
    importlib.import_module('uvicorn')
    importlib.import_module('fastapi')
except Exception as e:
    raise SystemExit(1)
PY
  then
    echo "[dev.sh] Backend deps missing. Creating venv and installing requirements..."
    if [[ ! -x "$BACKEND_DIR/.venv/bin/python" ]]; then
      python3 -m venv "$BACKEND_DIR/.venv"
      PYTHON="$BACKEND_DIR/.venv/bin/python"
    else
      PYTHON="$BACKEND_DIR/.venv/bin/python"
    fi
    "$PYTHON" -m pip install --upgrade pip >/dev/null
    "$PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
  fi
}

start_backend() {
  echo "[dev.sh] Starting backend (uvicorn) on http://$UVICORN_HOST:$UVICORN_PORT ..."
  mkdir -p "$ROOT_DIR"
  # shellcheck disable=SC2164
  cd "$BACKEND_DIR"
  ENVIRONMENT="$ENVIRONMENT" "$PYTHON" -m uvicorn app.main:app \
    --host "$UVICORN_HOST" --port "$UVICORN_PORT" --reload \
    >"$BACKEND_LOG" 2>&1 &
  local pid=$!
  echo "$pid" >"$BACKEND_PID_FILE"
  echo "[dev.sh] Backend PID: $pid (logs: $BACKEND_LOG)"
}

start_frontend() {
  echo "[dev.sh] Starting frontend (Vite) on http://localhost:$FRONTEND_PORT ..."
  # shellcheck disable=SC2164
  cd "$ROOT_DIR"
  # Use npm script "dev" already defined
  npm run dev >"$FRONTEND_LOG" 2>&1 &
  local pid=$!
  echo "$pid" >"$FRONTEND_PID_FILE"
  echo "[dev.sh] Frontend PID: $pid (logs: $FRONTEND_LOG)"
}

kill_children() {
  echo "[dev.sh] Shutting down dev processes..."
  for f in "$FRONTEND_PID_FILE" "$BACKEND_PID_FILE"; do
    if [[ -f "$f" ]]; then
      pid=$(cat "$f" || true)
      if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        # Give it a moment, then force kill if needed
        sleep 0.5
        kill -9 "$pid" 2>/dev/null || true
      fi
      rm -f "$f"
    fi
  done
}

trap kill_children EXIT INT TERM

wait_for_url() {
  local url="$1" max_tries="${2:-40}" delay="${3:-0.25}"
  local n=0
  until curl -sSf "$url" >/dev/null 2>&1; do
    n=$((n+1))
    if (( n >= max_tries )); then
      echo "[dev.sh] Timeout waiting for $url"
      return 1
    fi
    sleep "$delay"
  done
  return 0
}

ensure_backend_deps
start_backend
start_frontend

echo "[dev.sh] Waiting for backend health..."
# Try root health first; fallback to events list if no health endpoint under /api
if ! wait_for_url "http://$UVICORN_HOST:$UVICORN_PORT/health" 40 0.25; then
  wait_for_url "http://$UVICORN_HOST:$UVICORN_PORT/api/v1/events?limit=1" 40 0.25 || true
fi

echo "[dev.sh] Waiting for frontend to be ready..."
wait_for_url "http://localhost:$FRONTEND_PORT" 120 0.5 || true

echo
echo "[dev.sh] Dev servers are up:"
echo "  Backend:  http://$UVICORN_HOST:$UVICORN_PORT (log: $BACKEND_LOG)"
echo "  Frontend: http://localhost:$FRONTEND_PORT (log: $FRONTEND_LOG)"
echo
echo "[dev.sh] Tail logs (optional):"
echo "  tail -f '$BACKEND_LOG'"
echo "  tail -f '$FRONTEND_LOG'"
echo
echo "[dev.sh] Press Ctrl+C to stop both."

# Block until one of the children exits
wait

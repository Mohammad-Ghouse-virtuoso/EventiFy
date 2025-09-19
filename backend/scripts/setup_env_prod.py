#!/usr/bin/env python3
"""
Setup backend/.env.prod for PostgreSQL (psycopg2).

Features:
- Generates strong SECRET_KEY and REFRESH_SECRET_KEY (token_hex, 128 hex chars)
- Idempotent: does not overwrite existing secrets unless --rotate is provided
- Accepts DSN parts or --dsn to set DATABASE_URL (postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DB)
- Ensures ENVIRONMENT=prod

Usage examples:
    python scripts/setup_env_prod.py \
        --user USER --password PASS --host localhost --port 5432 --db DB

    python scripts/setup_env_prod.py --dsn "postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB"

  # Rotate secrets (regenerate SECRET_KEY and REFRESH_SECRET_KEY)
  python scripts/setup_env_prod.py --rotate
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from secrets import token_hex
from typing import Dict, Tuple

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.prod"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Configure backend/.env.prod for PostgreSQL")
    p.add_argument("--dsn", help="Full DSN e.g. postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB", default=None)
    p.add_argument("--user", help="Postgres username", default=None)
    p.add_argument("--password", help="Postgres password", default=None)
    p.add_argument("--host", help="Postgres host", default=None)
    p.add_argument("--port", help="Postgres port", default="5432")
    p.add_argument("--db", help="Postgres database name", default=None)
    p.add_argument("--rotate", action="store_true", help="Regenerate SECRET_KEY and REFRESH_SECRET_KEY even if present")
    return p.parse_args()


def read_env_file(path: Path) -> Tuple[Dict[str, str], str]:
    """Read a simple KEY=VALUE .env file; return dict and original content."""
    if not path.exists():
        return {}, ""
    content = path.read_text(encoding="utf-8")
    env: Dict[str, str] = {}
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):  # keep comments out of mapping
            continue
        if "=" in line:
            key, val = line.split("=", 1)
            env[key.strip()] = val.strip()
    return env, content


def build_dsn(args: argparse.Namespace) -> str | None:
    if args.dsn:
        return args.dsn.strip()
    parts = [args.user, args.password, args.host, args.port, args.db]
    if all(parts):
        return f"postgresql+psycopg2://{args.user}:{args.password}@{args.host}:{args.port}/{args.db}"
    return None


"""
Removed SSL CA handling since PostgreSQL local dev typically doesn't require it.
If you need SSL parameters, consider adding them to your DSN as needed.
"""


def generate_secret() -> str:
    # 128 hex chars (64 bytes) — satisfies 64+ chars requirement
    return token_hex(64)


def write_env(path: Path, data: Dict[str, str], original_content: str) -> None:
    # Canonical order for keys we manage; include any others afterward
    managed_keys = [
        "ENVIRONMENT",
        "DATABASE_URL",
        "SECRET_KEY",
        "REFRESH_SECRET_KEY",
    ]
    # Start with managed keys in order
    lines = []
    for k in managed_keys:
        if k in data:
            lines.append(f"{k}={data[k]}")
    # Add any additional keys not already written (to preserve user content)
    for k, v in data.items():
        if k not in managed_keys:
            lines.append(f"{k}={v}")
    content = "\n".join(lines) + "\n"
    path.write_text(content, encoding="utf-8")


def main() -> int:
    args = parse_args()
    env_map, original = read_env_file(ENV_PATH)

    updated = dict(env_map)  # copy

    # ENVIRONMENT enforced to prod in this file
    updated["ENVIRONMENT"] = "prod"

    # DATABASE_URL
    dsn = build_dsn(args)
    if dsn:
        updated["DATABASE_URL"] = dsn
    elif not updated.get("DATABASE_URL"):
        print("NOTE: DATABASE_URL is not set. Provide --dsn or --user/--password/--host/--db.")

    # No SSL CA entry needed for local Postgres by default
    if "MYSQL_SSL_CA" in updated:
        updated.pop("MYSQL_SSL_CA", None)

    # Secrets (idempotent, rotate if requested)
    if args.rotate or not updated.get("SECRET_KEY"):
        updated["SECRET_KEY"] = generate_secret()
        print(f"SECRET_KEY={updated['SECRET_KEY']}")
    else:
        print("SECRET_KEY already present (use --rotate to regenerate).")

    if args.rotate or not updated.get("REFRESH_SECRET_KEY"):
        updated["REFRESH_SECRET_KEY"] = generate_secret()
        print(f"REFRESH_SECRET_KEY={updated['REFRESH_SECRET_KEY']}")
    else:
        print("REFRESH_SECRET_KEY already present (use --rotate to regenerate).")

    # Write file
    ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    write_env(ENV_PATH, updated, original)
    print(f"Wrote {ENV_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

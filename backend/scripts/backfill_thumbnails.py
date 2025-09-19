#!/usr/bin/env python3
"""
Backfill thumbnails for existing events.
Creates 300x200 JPEG thumbnails for events that have image set but thumbnail is null.

Usage:
  python backend/scripts/backfill_thumbnails.py
"""

import os
from io import BytesIO
from PIL import Image
from urllib.parse import urlparse
import requests

import sys
from sqlmodel import Session, select


def ensure_dirs(settings):
    static_dir = os.path.abspath(settings.STATIC_DIR)
    img_dir = os.path.join(static_dir, 'event_images')
    thumb_dir = os.path.join(img_dir, 'thumbs')
    os.makedirs(thumb_dir, exist_ok=True)
    return img_dir, thumb_dir


def path_from_url(url: str, img_dir: str) -> str | None:
    """If URL is local (/static/event_images/...), return local filesystem path; else None."""
    if not url:
        return None
    try:
        if url.startswith('/static/event_images/'):
            return os.path.join(os.path.abspath(settings.STATIC_DIR), url.lstrip('/static/'))
        parsed = urlparse(url)
        if parsed.path.startswith('/static/event_images/'):
            # Assume local base URL
            return os.path.join(os.path.abspath(settings.STATIC_DIR), parsed.path.lstrip('/static/'))
    except Exception:
        pass
    return None


def load_image_bytes(url: str) -> bytes | None:
    # Try local path first
    local_path = path_from_url(url, '')
    if local_path and os.path.exists(local_path):
        with open(local_path, 'rb') as f:
            return f.read()
    # Fallback to HTTP GET
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return r.content
    except Exception:
        return None


def generate_thumb(raw_bytes: bytes, target=(300, 200)) -> bytes | None:
    try:
        im = Image.open(BytesIO(raw_bytes)).convert('RGB')
        tw, th = target
        sw, sh = im.size
        tr = tw / th
        sr = sw / sh
        if sr > tr:
            nw = int(sh * tr)
            left = (sw - nw) // 2
            im = im.crop((left, 0, left + nw, sh))
        else:
            nh = int(sw / tr)
            top = (sh - nh) // 2
            im = im.crop((0, top, sw, top + nh))
        im = im.resize((tw, th), Image.LANCZOS)
        out = BytesIO()
        im.save(out, format='JPEG', quality=78, optimize=True)
        return out.getvalue()
    except Exception:
        return None


def ensure_thumbnail_column(engine):
    import sqlalchemy as sa
    from sqlalchemy import inspect
    bind = engine.connect()
    try:
        inspector = inspect(bind)
        cols = {c['name'] for c in inspector.get_columns('event')}
        if 'thumbnail' not in cols:
            bind.execute(sa.text("ALTER TABLE event ADD COLUMN thumbnail VARCHAR"))
    finally:
        bind.close()


def main():
    # Ensure we import app.* correctly regardless of where we run
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(script_dir, '..'))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    os.chdir(backend_dir)

    # Now safe to import settings and engine
    from app.core.config import settings
    from app.db.database import engine
    from app.models.event import Event

    img_dir, thumb_dir = ensure_dirs(settings)
    base_url = settings.BASE_URL.rstrip('/')

    # Ensure DB has the thumbnail column
    ensure_thumbnail_column(engine)
    cnt = 0
    with Session(engine) as session:
        events = session.exec(select(Event).where(Event.image != None)).all()
        for ev in events:
            if getattr(ev, 'thumbnail', None):
                continue
            raw = load_image_bytes(ev.image)
            if not raw:
                continue
            thumb_bytes = generate_thumb(raw)
            if not thumb_bytes:
                continue
            name = f"event_{ev.id}_backfill_thumb.jpg"
            tpath = os.path.join(thumb_dir, name)
            with open(tpath, 'wb') as f:
                f.write(thumb_bytes)
            ev.thumbnail = f"{base_url}/static/event_images/thumbs/{name}"
            session.add(ev)
            cnt += 1
        session.commit()
    print(f"Backfilled thumbnails for {cnt} events")


if __name__ == '__main__':
    main()

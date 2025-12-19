import pytest
from datetime import datetime, timedelta

# Uses fixtures from backend/tests/conftest.py

def test_events_hide_past_by_default(client, session, test_event, test_past_event):
    # Default call should exclude past events
    resp = client.get('/api/v1/events')
    assert resp.status_code == 200
    data = resp.json()
    ids = {e['id'] for e in data}
    assert test_event.id in ids
    assert test_past_event.id not in ids


def test_events_include_past_when_flag_set(client, session, test_event, test_past_event):
    # With include_past=true and include_inactive=true, response should include both
    resp = client.get('/api/v1/events?include_past=true&include_inactive=true')
    assert resp.status_code == 200
    data = resp.json()
    ids = {e['id'] for e in data}
    assert test_event.id in ids
    assert test_past_event.id in ids


def test_auto_expire_marks_past_inactive(client, session, test_past_event):
    # Trigger auto-expire logic by calling events without include_past
    resp = client.get('/api/v1/events')
    assert resp.status_code == 200

    # Reload event from DB and ensure it was marked inactive
    from app.models.event import Event
    from sqlmodel import select

    ev = session.exec(select(Event).where(Event.id == test_past_event.id)).first()
    assert ev is not None
    assert ev.is_active is False

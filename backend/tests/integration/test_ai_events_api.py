import pytest
from datetime import datetime, timedelta
from sqlmodel import select

from app.api.api_v1.endpoints import ai_events
from app.models.event import Event


class StubHFService:
    """Deterministic HF stub to avoid external calls in tests."""

    def __init__(self):
        self.counter = 0

    def generate_event_content(self, city: str, category: str) -> dict:
        self.counter += 1
        start = datetime(2025, 1, 1, 10, 0) + timedelta(minutes=self.counter)
        end = start + timedelta(hours=2)
        return {
            "title": f"AI Event {category} #{self.counter}",
            "description": f"Generated {category} event in {city}",
            "category": category,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "location": f"{city} Convention Center",
            "expected_attendees": 120,
        }

    def generate_event_image(self, *args, **kwargs):
        # Skip image generation for tests
        return None


@pytest.fixture
def stub_hf_service(monkeypatch):
    service = StubHFService()
    monkeypatch.setattr(ai_events, "get_hf_service", lambda: service)
    return service


@pytest.mark.integration
def test_generate_event_persists_and_returns_event(client, session, stub_hf_service):
    response = client.post("/api/v1/ai/event", params={"city": "Chicago", "category": "tech"})

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "AI Event tech #1"
    assert data["location"] == "Chicago Convention Center"
    assert data["category"] == "tech"
    assert data["event_start"].startswith("2025-01-01T10:01")

    event = session.exec(select(Event).where(Event.title == data["title"])).first()
    assert event is not None
    assert event.location == "Chicago Convention Center"
    assert event.max_attendees == 120


@pytest.mark.integration
def test_generate_event_invalid_city_returns_400(client, stub_hf_service):
    response = client.post("/api/v1/ai/event", params={"city": "Atlantis", "category": "tech"})
    assert response.status_code == 400


@pytest.mark.integration
def test_generate_events_batch_creates_requested_count(client, session, stub_hf_service):
    response = client.post("/api/v1/ai/events-batch", params={"city": "Chicago", "count": 3})

    assert response.status_code == 200
    data = response.json()
    assert data["generated_count"] == 3
    assert len(data["events"]) == 3

    events = session.exec(select(Event)).all()
    assert len(events) == 3
    assert all(event.location == "Chicago Convention Center" for event in events)

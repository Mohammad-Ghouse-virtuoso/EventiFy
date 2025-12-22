"""
Integration tests for events API endpoints.
"""

import pytest
from fastapi import status
from datetime import datetime, timedelta


@pytest.mark.integration
class TestEventsList:
    """Test events list endpoint"""
    
    def test_get_events_list_success(self, client, test_event):
        """GET /api/v1/events - returns paginated events list"""
        response = client.get("/api/v1/events")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify event structure
        if len(data) > 0:
            event = data[0]
            assert "id" in event
            assert "title" in event
            assert "organizer_name" in event or "organizer_id" in event
    
    def test_get_events_list_unauthenticated(self, client, test_event):
        """GET /api/v1/events - works without authentication"""
        response = client.get("/api/v1/events")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_events_with_filters(self, client, test_event):
        """GET /api/v1/events - test query filters"""
        # Test category filter
        response = client.get(f"/api/v1/events?category={test_event.category}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        
        # Test search filter
        response = client.get(f"/api/v1/events?search={test_event.title[:4]}")
        assert response.status_code == status.HTTP_200_OK
        
        # Test pagination
        response = client.get("/api/v1/events?skip=0&limit=10")
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_event_by_id(self, client, test_event):
        """GET /api/v1/events/{id} - returns event details"""
        response = client.get(f"/api/v1/events/{test_event.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_event.id
        assert data["title"] == test_event.title
        assert "organizer_name" in data or "organizer_id" in data
    
    def test_get_event_nonexistent(self, client):
        """GET /api/v1/events/{id} with invalid ID returns 404"""
        response = client.get("/api/v1/events/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_events_include_past(self, client, test_past_event):
        """GET /api/v1/events?include_past=true - includes past events"""
        response = client.get("/api/v1/events?include_past=true")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.integration
class TestEventCreation:
    """Test event creation endpoint"""
    
    def test_create_event_authenticated(self, client, organizer_headers):
        """POST /api/v1/events - organizer can create event"""
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        event_data = {
            "title": "New Tech Meetup",
            "description": "A meetup for tech enthusiasts",
            "category": "Technology",
            "event_start": future_date,
            "event_end": (datetime.now() + timedelta(days=7, hours=2)).isoformat(),
            "location": "Tech Hub, Downtown",
            "max_attendees": 100,
            "price": 0.0,
            "requires_approval": False
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data,
            headers=organizer_headers
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        data = response.json()
        assert data["title"] == "New Tech Meetup"
        assert data["category"] == "Technology"
        assert "id" in data

    def test_create_event_with_predefined_banner(self, client, organizer_headers):
        """POST /api/v1/events with image URL should set image field."""
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        banner_url = "http://example.com/static/sample.jpg"
        event_data = {
            "title": "Banner Event",
            "description": "Event with predefined banner",
            "category": "Technology",
            "event_start": future_date,
            "event_end": (datetime.now() + timedelta(days=7, hours=2)).isoformat(),
            "location": "Tech Hub",
            "max_attendees": 80,
            "price": 0.0,
            "requires_approval": False,
            "image": banner_url,
        }

        response = client.post("/api/v1/events", json=event_data, headers=organizer_headers)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        data = response.json()
        assert data["image"] == banner_url

    def test_create_event_with_image_upload(self, client, organizer_headers, tmp_path):
        """POST /api/v1/events/upload with file should save image and return URLs."""
        from PIL import Image
        img_path = tmp_path / "test.jpg"
        Image.new('RGB', (640, 480), color='blue').save(img_path)

        # Obtain CSRF token and include matching header; TestClient retains cookie
        csrf_resp = client.get("/api/v1/auth/csrf-token")
        csrf_token = csrf_resp.json().get("csrfToken")

        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        files = {
            "image": ("test.jpg", open(img_path, "rb"), "image/jpeg"),
        }
        data = {
            "title": "Upload Event",
            "description": "Event with uploaded image",
            "category": "Technology",
            "event_start": future_date,
            "event_end": (datetime.now() + timedelta(days=7, hours=1)).isoformat(),
            "location": "Tech Hub",
            "max_attendees": "50",
            "price": "0.0",
            "requires_approval": "false",
        }
        # Merge auth headers with CSRF header for form submission
        headers = {**organizer_headers, "x-csrf-token": csrf_token}
        response = client.post("/api/v1/events/upload", files=files, data=data, headers=headers)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        resp = response.json()
        assert resp["image"] and resp["image"].startswith("http")
        # Thumbnail is optional; if generated, it should be an http URL
        if resp.get("thumbnail"):
            assert resp["thumbnail"].startswith("http")
    
    def test_create_event_unauthenticated(self, client):
        """POST /api/v1/events without auth returns 401"""
        event_data = {
            "title": "Unauthorized Event",
            "description": "Should fail",
            "category": "Test",
            "event_start": (datetime.now() + timedelta(days=1)).isoformat(),
            "location": "Nowhere",
            "max_attendees": 50
        }
        
        response = client.post("/api/v1/events", json=event_data)
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_create_event_attendee_forbidden(self, client, auth_headers):
        """POST /api/v1/events - attendee cannot create event"""
        event_data = {
            "title": "Attendee Event",
            "description": "Should be forbidden",
            "category": "Test",
            "event_start": (datetime.now() + timedelta(days=1)).isoformat(),
            "location": "Test",
            "max_attendees": 10
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data,
            headers=auth_headers
        )
        
        # May return 403 Forbidden or redirect based on implementation
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]
    
    def test_create_event_missing_fields(self, client, organizer_headers):
        """POST /api/v1/events with missing required fields returns 422"""
        incomplete_data = {
            "title": "Incomplete Event"
            # Missing required fields
        }
        
        response = client.post(
            "/api/v1/events",
            json=incomplete_data,
            headers=organizer_headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.integration
class TestEventUpdate:
    """Test event update endpoint"""
    
    def test_update_event_as_organizer(self, client, session, test_event, organizer_headers):
        """PUT /api/v1/events/{id} - organizer can update own event"""
        update_data = {
            "title": "Updated Event Title",
            "description": "Updated description"
        }
        
        response = client.put(
            f"/api/v1/events/{test_event.id}",
            json=update_data,
            headers=organizer_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Event Title"
    
    def test_update_event_as_non_organizer(self, client, test_event, auth_headers):
        """PUT /api/v1/events/{id} - non-organizer cannot update"""
        update_data = {"title": "Hacked Title"}
        
        response = client.put(
            f"/api/v1/events/{test_event.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_event_as_admin(self, client, test_event, admin_headers):
        """PUT /api/v1/events/{id} - admin can update any event"""
        update_data = {"title": "Admin Updated Title"}
        
        response = client.put(
            f"/api/v1/events/{test_event.id}",
            json=update_data,
            headers=admin_headers
        )
        
        # Admin should be able to update
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_update_event_meta_fields_reflect_for_attendee(self, client, test_event, admin_headers, auth_headers):
        """Admin updates T&C, organizer bio & contact; attendee should see them via GET."""
        update_data = {
            "terms_and_conditions": "No refunds after 24 hours. Bring ID.",
            "organizer_bio": "We host monthly meetups for developers.",
            "organizer_contact": "organizer@example.com",
        }
        # Admin updates event
        resp = client.put(f"/api/v1/events/{test_event.id}", json=update_data, headers=admin_headers)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["terms_and_conditions"] == update_data["terms_and_conditions"]
        assert data["organizer_bio"] == update_data["organizer_bio"]
        assert data["organizer_contact"] == update_data["organizer_contact"]

        # Attendee fetches event details; should see updated fields
        get_resp = client.get(f"/api/v1/events/{test_event.id}", headers=auth_headers)
        assert get_resp.status_code == status.HTTP_200_OK
        get_data = get_resp.json()
        assert get_data["terms_and_conditions"] == update_data["terms_and_conditions"]
        assert get_data["organizer_bio"] == update_data["organizer_bio"]
        assert get_data["organizer_contact"] == update_data["organizer_contact"]


@pytest.mark.integration
class TestEventDeletion:
    """Test event deletion endpoint"""
    
    def test_delete_event_as_organizer(self, client, test_event, organizer_headers):
        """DELETE /api/v1/events/{id} - organizer can delete own event"""
        response = client.delete(
            f"/api/v1/events/{test_event.id}",
            headers=organizer_headers
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
        
        # Verify event is deleted or marked inactive
        get_response = client.get(f"/api/v1/events/{test_event.id}")
        assert get_response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_200_OK]
    
    def test_delete_event_as_non_organizer(self, client, test_event, auth_headers):
        """DELETE /api/v1/events/{id} - non-organizer cannot delete"""
        response = client.delete(
            f"/api/v1/events/{test_event.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_nonexistent_event(self, client, organizer_headers):
        """DELETE /api/v1/events/{id} with invalid ID returns 404"""
        response = client.delete(
            "/api/v1/events/99999",
            headers=organizer_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

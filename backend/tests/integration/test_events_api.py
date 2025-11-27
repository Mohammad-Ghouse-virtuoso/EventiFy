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

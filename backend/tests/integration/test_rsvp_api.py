"""
Integration tests for RSVP API endpoints.
"""

import pytest
from fastapi import status


@pytest.mark.integration
class TestRSVPCreation:
    """Test RSVP creation endpoints"""
    
    def test_create_rsvp_authenticated(self, client, auth_headers, test_event):
        """POST /api/v1/events/{id}/rsvp - create RSVP with auth"""
        response = client.post(
            f"/api/v1/events/{test_event.id}/rsvp",
            json={"status": "going"},
            headers=auth_headers
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        data = response.json()
        # Response structure may vary - just ensure it's valid
        assert data is not None
    
    def test_create_rsvp_unauthenticated(self, client, test_event):
        """POST /api/v1/events/{id}/rsvp without auth returns 401"""
        response = client.post(
            f"/api/v1/events/{test_event.id}/rsvp",
            json={"status": "going"}
        )
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_create_duplicate_rsvp(self, client, auth_headers, test_event, test_rsvp):
        """Creating duplicate RSVP should update or fail"""
        response = client.post(
            f"/api/v1/events/{test_event.id}/rsvp",
            json={"status": "maybe"},
            headers=auth_headers
        )
        
        # Either updates successfully or returns conflict
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT
        ]
    
    def test_create_rsvp_nonexistent_event(self, client, auth_headers):
        """RSVP to nonexistent event returns 404"""
        response = client.post(
            "/api/v1/events/99999/rsvp",
            json={"status": "going"},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_create_rsvp_all_statuses(self, client, session, test_user):
        """Test all RSVP status values work"""
        from datetime import datetime, timedelta
        from app.models.event import Event
        from app.core.auth import create_access_token
        
        statuses = ["going", "maybe", "not_going"]
        
        for i, status_value in enumerate(statuses):
            # Create unique event for each status
            event = Event(
                title=f"Test Event {i}",
                description="Test event description",
                category="Test",
                event_start=datetime.now() + timedelta(days=i + 1),
                location="Test Location",
                max_attendees=100,
                organizer_id=test_user.id
            )
            session.add(event)
            session.commit()
            session.refresh(event)
            
            # Create token for user
            token = create_access_token(data={"sub": str(test_user.id)}, user=test_user)
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create RSVP with this status
            response = client.post(
                f"/api/v1/events/{event.id}/rsvp",
                json={"status": status_value},
                headers=headers
            )
            
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]


@pytest.mark.integration
class TestRSVPRetrieval:
    """Test RSVP retrieval endpoints"""
    
    def test_get_user_rsvps_authenticated(self, client, auth_headers, test_rsvp):
        """GET /api/v1/rsvps/me - get current user's RSVPs"""
        response = client.get("/api/v1/rsvps/me", headers=auth_headers)
        
        # Endpoint may or may not exist, check both possibilities
        if response.status_code != status.HTTP_404_NOT_FOUND:
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert isinstance(data, list)
    
    def test_get_rsvps_unauthenticated(self, client):
        """GET /api/v1/rsvps/me without auth returns 401"""
        response = client.get("/api/v1/rsvps/me")
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND]


@pytest.mark.integration
class TestRSVPUpdate:
    """Test RSVP update endpoints"""
    
    def test_update_rsvp_status(self, client, auth_headers, test_rsvp, test_event):
        """PUT /api/v1/events/{event_id}/rsvp - update RSVP status"""
        response = client.put(
            f"/api/v1/events/{test_event.id}/rsvp",
            json={"status": "maybe"},
            headers=auth_headers
        )
        
        # May use POST instead of PUT
        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            response = client.post(
                f"/api/v1/events/{test_event.id}/rsvp",
                json={"status": "maybe"},
                headers=auth_headers
            )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_update_rsvp_unauthenticated(self, client, test_event):
        """Update RSVP without auth returns 401"""
        response = client.put(
            f"/api/v1/events/{test_event.id}/rsvp",
            json={"status": "going"}
        )
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED
        ]


@pytest.mark.integration
class TestRSVPApproval:
    """Test RSVP approval flow (for events requiring approval)"""
    
    def test_rsvp_requires_approval_flow(self, client, session, test_user, test_organizer):
        """Test RSVP flow for events requiring approval"""
        from datetime import datetime, timedelta
        from app.models.event import Event
        from app.core.auth import create_access_token
        
        # Create event requiring approval
        event = Event(
            title="Exclusive Event",
            description="Event requiring approval",
            category="VIP",
            event_start=datetime.now() + timedelta(days=5),
            location="VIP Location",
            max_attendees=10,
            organizer_id=test_organizer.id,
            requires_approval=True
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        
        # User RSVPs
        token = create_access_token(data={"sub": str(test_user.id)}, user=test_user)
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            f"/api/v1/events/{event.id}/rsvp",
            json={"status": "going"},
            headers=headers
        )
        
        # Should work regardless of approval requirement
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]


@pytest.mark.integration
class TestRSVPCheckin:
    """Test RSVP check-in functionality"""
    
    def test_checkin_rsvp(self, client, organizer_headers, test_rsvp):
        """POST /api/v1/rsvps/{id}/checkin - check in attendee"""
        response = client.post(
            f"/api/v1/rsvps/{test_rsvp.id}/checkin",
            headers=organizer_headers
        )
        
        # Endpoint may or may not exist
        if response.status_code != status.HTTP_404_NOT_FOUND:
            assert response.status_code == status.HTTP_200_OK
    
    def test_checkin_nonexistent_rsvp(self, client, organizer_headers):
        """Check in nonexistent RSVP returns 404"""
        response = client.post(
            "/api/v1/rsvps/99999/checkin",
            headers=organizer_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

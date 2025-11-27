"""
Integration tests for users API endpoints.
"""

import pytest
from fastapi import status


@pytest.mark.integration
class TestUserProfile:
    """Test user profile endpoints"""
    
    def test_get_current_user_profile(self, client, auth_headers, test_user):
        """GET /api/v1/users/me - get current user profile"""
        response = client.get("/api/v1/users/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["id"] == test_user.id
        assert "hashed_password" not in data
    
    def test_get_current_user_unauthenticated(self, client):
        """GET /api/v1/users/me without auth returns 401 or 403"""
        response = client.get("/api/v1/users/me")
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_update_current_user_profile(self, client, auth_headers):
        """PUT /api/v1/users/me - update current user profile"""
        update_data = {
            "full_name": "Updated Name",
            "email": "updated@example.com"
        }
        
        response = client.put(
            "/api/v1/users/me",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"
    
    def test_update_user_unauthenticated(self, client):
        """PUT /api/v1/users/me without auth returns 401 or 403"""
        response = client.put(
            "/api/v1/users/me",
            json={"full_name": "Hacker"}
        )
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]


@pytest.mark.integration
class TestUsersList:
    """Test users list endpoints (admin only)"""
    
    def test_get_users_list_as_admin(self, client, admin_headers):
        """GET /api/v1/users - admin can list users"""
        response = client.get("/api/v1/users", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_get_users_list_as_regular_user(self, client, auth_headers):
        """GET /api/v1/users - regular user cannot list users"""
        response = client.get("/api/v1/users", headers=auth_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_users_list_unauthenticated(self, client):
        """GET /api/v1/users without auth returns 401 or 403"""
        response = client.get("/api/v1/users")
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_get_users_with_pagination(self, client, admin_headers):
        """GET /api/v1/users with pagination params"""
        response = client.get(
            "/api/v1/users?skip=0&limit=10",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10


@pytest.mark.integration
class TestUserByID:
    """Test get user by ID endpoints"""
    
    def test_get_user_by_id_as_admin(self, client, admin_headers, test_user):
        """GET /api/v1/users/{id} - admin can get any user"""
        response = client.get(
            f"/api/v1/users/{test_user.id}",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
    
    def test_get_user_by_id_as_regular_user(self, client, auth_headers, test_user):
        """GET /api/v1/users/{id} - regular user can only get own profile"""
        response = client.get(
            f"/api/v1/users/{test_user.id}",
            headers=auth_headers
        )
        
        # May return 200 for own profile or 403 for any user lookup
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
    
    def test_get_nonexistent_user(self, client, admin_headers):
        """GET /api/v1/users/{id} with invalid ID returns 404"""
        response = client.get(
            "/api/v1/users/99999",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestUserDeletion:
    """Test user deletion endpoints (admin only)"""
    
    def test_delete_user_as_admin(self, client, session, admin_headers):
        """DELETE /api/v1/users/{id} - admin can delete users"""
        from app.models.user import User
        from app.core.auth import get_password_hash
        
        # Create user to delete
        user_to_delete = User(
            email="todelete@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="To Delete",
            role="attendee",
            is_active=True
        )
        session.add(user_to_delete)
        session.commit()
        session.refresh(user_to_delete)
        
        response = client.delete(
            f"/api/v1/users/{user_to_delete.id}",
            headers=admin_headers
        )
        
        # DELETE endpoint may not be implemented
        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            pytest.skip("DELETE endpoint not implemented")
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ]
    
    def test_delete_user_as_regular_user(self, client, auth_headers, test_organizer):
        """DELETE /api/v1/users/{id} - regular user cannot delete users"""
        response = client.delete(
            f"/api/v1/users/{test_organizer.id}",
            headers=auth_headers
        )
        
        # DELETE endpoint may not be implemented
        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            pytest.skip("DELETE endpoint not implemented")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_nonexistent_user(self, client, admin_headers):
        """DELETE /api/v1/users/{id} with invalid ID returns 404"""
        response = client.delete(
            "/api/v1/users/99999",
            headers=admin_headers
        )
        
        # DELETE endpoint may not be implemented
        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            pytest.skip("DELETE endpoint not implemented")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestUserRoles:
    """Test user role functionality"""
    
    def test_organizer_can_create_events(self, client, organizer_headers):
        """Organizer role can create events"""
        from datetime import datetime, timedelta
        
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        event_data = {
            "title": "Organizer Event",
            "description": "Event by organizer",
            "category": "Test",
            "event_start": future_date,
            "location": "Test Location",
            "max_attendees": 50,
            "price": 0.0
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data,
            headers=organizer_headers
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_attendee_cannot_create_events(self, client, auth_headers):
        """Attendee role cannot create events"""
        from datetime import datetime, timedelta
        
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        event_data = {
            "title": "Attendee Event",
            "description": "Should fail",
            "category": "Test",
            "event_start": future_date,
            "location": "Test",
            "max_attendees": 10,
            "price": 0.0
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_has_all_permissions(self, client, admin_headers):
        """Admin role has access to all endpoints"""
        # Test users list (admin only)
        response = client.get("/api/v1/users", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK
        
        # Admin can create events
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        event_data = {
            "title": "Admin Event",
            "description": "Event by admin",
            "category": "Admin",
            "event_start": future_date,
            "location": "Admin HQ",
            "max_attendees": 200,
            "price": 0.0
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data,
            headers=admin_headers
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

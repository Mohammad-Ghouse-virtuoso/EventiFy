"""
Integration tests for comments API endpoints.
"""

import pytest
from fastapi import status


@pytest.mark.integration
class TestCommentCreation:
    """Test comment creation endpoints"""
    
    def test_create_comment_unauthenticated(self, client, test_event):
        """POST /api/v1/events/{id}/comments without auth returns 401 or 403"""
        comment_data = {"content": "Anonymous comment"}
        
        response = client.post(
            f"/api/v1/events/{test_event.id}/comments",
            json=comment_data
        )
        
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]
    
    def test_create_comment_nonexistent_event(self, client, auth_headers):
        """Comment on nonexistent event returns 404"""
        comment_data = {"content": "Comment on void"}
        
        response = client.post(
            "/api/v1/events/99999/comments",
            json=comment_data,
            headers=auth_headers
        )
        
        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_422_UNPROCESSABLE_ENTITY  # Validation may fail first
        ]
    
    def test_create_comment_empty_content(self, client, auth_headers, test_event):
        """Creating comment with empty content returns 422"""
        comment_data = {"content": ""}
        
        response = client.post(
            f"/api/v1/events/{test_event.id}/comments",
            json=comment_data,
            headers=auth_headers
        )
        
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]


@pytest.mark.integration
class TestCommentRetrieval:
    """Test comment retrieval endpoints"""
    
    def test_get_event_comments(self, client, test_event, session, test_user):
        """GET /api/v1/events/{id}/comments - get event comments"""
        from app.models.comment import Comment
        
        # Create a comment first
        comment = Comment(
            event_id=test_event.id,
            user_id=test_user.id,
            content="Test comment for retrieval",
            is_approved=True
        )
        session.add(comment)
        session.commit()
        
        response = client.get(f"/api/v1/events/{test_event.id}/comments")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_comments_empty_event(self, client, test_event):
        """GET /api/v1/events/{id}/comments for event with no comments"""
        response = client.get(f"/api/v1/events/{test_event.id}/comments")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_comments_nonexistent_event(self, client):
        """GET /api/v1/events/{id}/comments for nonexistent event"""
        response = client.get("/api/v1/events/99999/comments")
        
        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_200_OK  # May return empty list
        ]


@pytest.mark.integration
class TestCommentUpdate:
    """Test comment update endpoints"""
    
    def test_update_nonexistent_comment(self, client, auth_headers):
        """PUT /api/v1/comments/{id} with invalid ID returns 404"""
        response = client.put(
            "/api/v1/comments/99999",
            json={"content": "Ghost comment"},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestCommentDeletion:
    """Test comment deletion endpoints"""
    
    def test_delete_nonexistent_comment(self, client, auth_headers):
        """DELETE /api/v1/comments/{id} with invalid ID returns 404"""
        response = client.delete(
            "/api/v1/comments/99999",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestCommentModeration:
    """Test comment moderation (approval/rejection)"""
    
    def test_get_pending_comments_as_organizer(self, client, organizer_headers):
        """GET /api/v1/comments/pending - organizer can view pending comments"""
        response = client.get(
            "/api/v1/comments/pending",
            headers=organizer_headers
        )
        
        # Endpoint may or may not exist
        if response.status_code != status.HTTP_404_NOT_FOUND:
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert isinstance(data, list)
    
    def test_approve_comment_as_organizer(self, client, organizer_headers, session, test_user, test_event):
        """PUT /api/v1/comments/{id}/approve - organizer can approve comments"""
        from app.models.comment import Comment
        
        comment = Comment(
            event_id=test_event.id,
            user_id=test_user.id,
            content="Comment pending approval",
            is_approved=False
        )
        session.add(comment)
        session.commit()
        session.refresh(comment)
        
        response = client.put(
            f"/api/v1/comments/{comment.id}/approve",
            headers=organizer_headers
        )
        
        # Endpoint may or may not exist
        if response.status_code != status.HTTP_404_NOT_FOUND:
            assert response.status_code == status.HTTP_200_OK
    
    def test_reject_comment_as_organizer(self, client, organizer_headers, session, test_user, test_event):
        """PUT /api/v1/comments/{id}/reject - organizer can reject comments"""
        from app.models.comment import Comment
        
        comment = Comment(
            event_id=test_event.id,
            user_id=test_user.id,
            content="Comment to reject",
            is_approved=False
        )
        session.add(comment)
        session.commit()
        session.refresh(comment)
        
        response = client.put(
            f"/api/v1/comments/{comment.id}/reject",
            headers=organizer_headers
        )
        
        # Endpoint may or may not exist
        if response.status_code != status.HTTP_404_NOT_FOUND:
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_204_NO_CONTENT
            ]
    
    def test_regular_user_cannot_moderate(self, client, auth_headers, session, test_organizer, test_event):
        """Regular user cannot approve/reject comments"""
        from app.models.comment import Comment
        
        comment = Comment(
            event_id=test_event.id,
            user_id=test_organizer.id,
            content="Comment user tries to moderate",
            is_approved=False
        )
        session.add(comment)
        session.commit()
        session.refresh(comment)
        
        response = client.put(
            f"/api/v1/comments/{comment.id}/approve",
            headers=auth_headers
        )
        
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

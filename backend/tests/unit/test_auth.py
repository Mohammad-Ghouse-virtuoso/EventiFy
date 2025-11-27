"""
Unit tests for authentication and security utilities.
"""

import pytest
from datetime import datetime, timedelta
from app.core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_refresh_token
)
from app.core.config import settings


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password_creates_hash(self):
        """Password hashing should create a non-empty hash"""
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        
        assert hashed is not None
        assert len(hashed) > 0
        assert hashed != password
        assert hashed.startswith("$argon2")  # Argon2id format
    
    def test_hash_password_is_unique(self):
        """Same password should generate different hashes (due to salt)"""
        password = "SamePassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
    
    def test_verify_password_correct(self):
        """Correct password should verify successfully"""
        password = "CorrectPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Incorrect password should fail verification"""
        password = "CorrectPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password("WrongPassword", hashed) is False
    
    def test_verify_password_empty(self):
        """Empty password should fail verification"""
        password = "ValidPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password("", hashed) is False


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self):
        """Access token should be created with correct payload"""
        user_id = "123"
        token = create_access_token({"sub": user_id})
        
        assert token is not None
        assert len(token) > 0
        
        # Verify token
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert "exp" in payload
    
    def test_create_access_token_with_custom_expiry(self):
        """Access token with custom expiry should be created"""
        user_id = "123"
        expires_delta = timedelta(minutes=30)
        token = create_access_token({"sub": user_id}, expires_delta=expires_delta)
        
        payload = verify_token(token)
        assert payload is not None
        
        # Check expiry is approximately correct (within 5 seconds tolerance)
        exp_time = datetime.utcfromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + expires_delta
        assert abs((exp_time - expected_exp).total_seconds()) < 5
    
    def test_verify_token_valid(self):
        """Valid token should verify successfully"""
        token = create_access_token({"sub": "456"})
        payload = verify_token(token)
        
        assert payload is not None
        assert payload["sub"] == "456"
    
    def test_verify_token_invalid(self):
        """Invalid token should return None"""
        invalid_token = "invalid.token.string"
        payload = verify_token(invalid_token)
        
        assert payload is None
    
    def test_verify_token_expired(self):
        """Expired token should return None"""
        # Create token that expired 1 minute ago
        expires_delta = timedelta(minutes=-1)
        token = create_access_token({"sub": "789"}, expires_delta=expires_delta)
        
        payload = verify_token(token)
        assert payload is None
    
    def test_create_refresh_token(self):
        """Refresh token should be created with correct payload"""
        user_id = "321"
        token = create_refresh_token({"sub": user_id})
        
        assert token is not None
        assert len(token) > 0
        
        # Verify refresh token
        payload = verify_refresh_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
    
    def test_refresh_token_different_from_access(self):
        """Refresh token should be different from access token"""
        user_id = "999"
        access_token = create_access_token({"sub": user_id})
        refresh_token = create_refresh_token({"sub": user_id})
        
        assert access_token != refresh_token
    
    def test_verify_refresh_token_valid(self):
        """Valid refresh token should verify successfully"""
        token = create_refresh_token({"sub": "111"})
        payload = verify_refresh_token(token)
        
        assert payload is not None
        assert payload["sub"] == "111"
        assert payload["type"] == "refresh"
    
    def test_verify_refresh_token_invalid_type(self):
        """Access token used as refresh token should fail"""
        access_token = create_access_token({"sub": "222"})
        payload = verify_refresh_token(access_token)
        
        # Should return None because type != "refresh"
        assert payload is None
    
    def test_token_contains_user_claims(self):
        """Token with user should include role and is_active claims"""
        from unittest.mock import Mock
        
        mock_user = Mock()
        mock_user.role = "attendee"
        mock_user.is_active = True
        
        token = create_access_token({"sub": "123"}, user=mock_user)
        payload = verify_token(token)
        
        assert payload is not None
        assert payload["role"] == "attendee"
        assert payload["is_active"] is True

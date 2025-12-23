from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from app.db.database import get_session
from app.models.user import User, UserCreate, UserRole
from app.core.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_active_user
)
from app.core.config import settings

router = APIRouter()

# --- Simple in-memory rate limiter for login ---
from collections import defaultdict, deque
from time import time

_login_attempts = defaultdict(lambda: deque(maxlen=100))  # ip -> timestamps (seconds)

def _rate_limited(ip: str, limit_per_minute: int) -> bool:
    now = time()
    window_start = now - 60
    dq = _login_attempts[ip]
    # remove old timestamps
    while dq and dq[0] < window_start:
        dq.popleft()
    if len(dq) >= limit_per_minute:
        return True
    dq.append(now)
    return False

@router.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    # Warn if running in prod mode and likely to hit rate limiting during load tests
    if settings.ENVIRONMENT == "prod":
        import warnings
        warnings.warn("[EventiFy] WARNING: Running in prod mode. Login rate limiting is strict per-IP. For local load testing, use ENVIRONMENT=dev to avoid 429s.")
    # Rate limit key strategy:
    # - In production: strict per-IP limiting to mitigate abuse.
    # - In non-prod (dev/test): scope by (IP + username) to allow load tests
    #   from a single IP without tripping global 429s.
    client_ip = request.client.host if request.client else "unknown"
    if settings.ENVIRONMENT == "prod":
        rate_key = client_ip
    else:
        rate_key = f"{client_ip}:{form_data.username}"
    if _rate_limited(rate_key, settings.LOGIN_RATE_LIMIT_PER_MINUTE):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts, try later."
        )
    # Find user by email
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Rehash legacy bcrypt hashes into argon2id on successful login
    try:
        from passlib.hash import bcrypt as passlib_bcrypt
        if user.hashed_password and passlib_bcrypt.identify(user.hashed_password):
            user.hashed_password = get_password_hash(form_data.password)
            session.add(user)
            session.commit()
    except Exception:
        # Non-fatal; continue login
        pass

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, user=user, expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            # Normalize role to plain lowercase string (e.g., "admin|organizer|attendee")
            "role": str(getattr(user.role, "value", user.role)).lower(),
            "is_active": user.is_active
        }
    }

@router.post("/register")
async def register(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user - always as attendee (unified account model)
    # Users become "organizers" contextually when they create events
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=UserRole.ATTENDEE,  # Always attendee - role is contextual
        hashed_password=hashed_password
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            # Normalize role to plain lowercase string (e.g., "admin|organizer|attendee")
            "role": str(getattr(db_user.role, "value", db_user.role)).lower(),
            "is_active": db_user.is_active
        }
    }

@router.post("/refresh")
async def refresh_token_endpoint(payload: dict):
    """Accepts JSON { refresh_token } and returns a new access token if valid."""
    token = payload.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing refresh_token")
    payload = verify_refresh_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # We don't fetch the user here; claims will be minimal and verified later
    new_access = create_access_token(data={"sub": str(user_id)}, user=None, expires_delta=access_token_expires)
    return {"access_token": new_access, "token_type": "bearer"}

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        # Normalize role to plain lowercase string (e.g., "admin|organizer|attendee")
        "role": str(getattr(current_user.role, "value", current_user.role)).lower(),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }
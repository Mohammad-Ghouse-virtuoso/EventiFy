"""
AI-powered event generation endpoint using Hugging Face models.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session
from app.db.database import get_session
from app.services.huggingface_service import get_hf_service
from app.models import Event, User
from app.models.user import UserRole
from app.core.auth import get_password_hash
from datetime import datetime
import logging
from typing import List
import io
from PIL import Image
import os
from sqlmodel import select

router = APIRouter(prefix="/generate", tags=["ai"])
logger = logging.getLogger(__name__)

# List of supported cities for event generation
SUPPORTED_CITIES = [
    "New York", "Los Angeles", "Chicago", "San Francisco", "Austin",
    "Seattle", "Boston", "Denver", "Miami", "Dallas", "London", "Paris",
    "Tokyo", "Berlin", "Toronto", "Sydney", "Singapore", "Dubai"
]

CATEGORIES = [
    "music", "sports", "tech", "food", "art", "business",
    "education", "wellness", "entertainment", "networking"
]


def _parse_datetime(value: str) -> datetime:
    """Parse ISO string to datetime with safe fallback."""
    if not value:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return datetime.utcnow()


def _build_event_model(event_data: dict, city: str, category: str, organizer_id: int) -> Event:
    """Create an Event model instance from generated data with sane defaults."""
    start_dt = _parse_datetime(event_data.get("start_time"))
    end_dt_raw = event_data.get("end_time")
    end_dt = _parse_datetime(end_dt_raw) if end_dt_raw else None

    return Event(
        title=event_data.get("title", "Unnamed Event"),
        description=event_data.get(
            "description",
            f"AI-generated {category} event in {city}."
        ),
        category=event_data.get("category", category),
        location=event_data.get("location", city),
        event_start=start_dt,
        event_end=end_dt,
        max_attendees=int(event_data.get("expected_attendees", 100)),
        price=float(event_data.get("price", 0.0) or 0.0),
        organizer_id=organizer_id,
        requires_approval=bool(event_data.get("requires_approval", False)),
        is_active=True,
    )


def _resolve_organizer_id(session: Session) -> int:
    """Pick an existing organizer or fallback to any user for FK integrity."""
    organizer = session.exec(select(User.id).where(User.role == UserRole.ORGANIZER)).first()
    if organizer:
        return organizer
    fallback_user = session.exec(select(User.id)).first()
    if fallback_user:
        return fallback_user

    # Create a placeholder organizer to satisfy FK constraints in test or empty DB setups
    temp_user = User(
        email="ai-generator@example.com",
        full_name="AI Generator",
        role=UserRole.ORGANIZER,
        hashed_password=get_password_hash("ai-generator-temp"),
        is_active=True,
    )
    session.add(temp_user)
    session.commit()
    session.refresh(temp_user)
    return temp_user.id


@router.post("/event")
async def generate_event(
    city: str = Query(..., description="City for event generation"),
    category: str = Query(..., description="Event category"),
    session: Session = Depends(get_session)
):
    """
    Generate a new event using Hugging Face AI.
    
    Args:
        city: City where event will take place
        category: Event category (music, sports, tech, etc.)
    
    Returns:
        Generated event with details
    """
    # Validate inputs
    if city not in SUPPORTED_CITIES:
        raise HTTPException(
            status_code=400,
            detail=f"City '{city}' not supported. Supported cities: {', '.join(SUPPORTED_CITIES)}"
        )
    
    if category not in CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category}' not supported. Supported categories: {', '.join(CATEGORIES)}"
        )
    
    hf_service = get_hf_service()
    if not hf_service:
        raise HTTPException(
            status_code=500,
            detail="HF service not initialized"
        )
    
    try:
        # Generate event content using Mistral
        logger.info(f"Generating event for {city} in {category}")
        event_data = hf_service.generate_event_content(city, category)
        
        organizer_id = _resolve_organizer_id(session)

        # Create event in database
        event = _build_event_model(event_data, city, category, organizer_id)
        
        # Generate event image using Stable Diffusion
        logger.info(f"Generating image for event: {event.title}")
        image_bytes = hf_service.generate_event_image(event.title, city)
        
        if image_bytes:
            try:
                # Save image
                image = Image.open(io.BytesIO(image_bytes))
                image_filename = f"event_ai_{int(datetime.now().timestamp())}.png"
                image_path = os.path.join("backend/static/event_images", image_filename)
                
                os.makedirs(os.path.dirname(image_path), exist_ok=True)
                image.save(image_path)
                event.image = f"/static/event_images/{image_filename}"
                
                logger.info(f"Image saved: {image_path}")
            except Exception as e:
                logger.warning(f"Could not save image: {str(e)}")
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "location": event.location,
            "event_start": event.event_start.isoformat(),
            "event_end": event.event_end.isoformat() if event.event_end else None,
            "image": event.image,
            "city": city,
            "status": "created"
        }
        
    except Exception as e:
        logger.error(f"Error generating event: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating event: {str(e)}"
        )

@router.get("/events-batch")
async def generate_events_batch(
    city: str = Query(..., description="City for event generation"),
    count: int = Query(5, ge=1, le=20, description="Number of events to generate"),
    session: Session = Depends(get_session)
):
    """
    Generate multiple events at once.
    
    Args:
        city: City where events will take place
        count: Number of events to generate (1-20)
    
    Returns:
        List of generated events
    """
    if city not in SUPPORTED_CITIES:
        raise HTTPException(
            status_code=400,
            detail=f"City '{city}' not supported."
        )
    
    generated_events = []
    organizer_id = _resolve_organizer_id(session)
    
    for i in range(count):
        # Cycle through categories
        category = CATEGORIES[i % len(CATEGORIES)]
        
        try:
            hf_service = get_hf_service()
            if not hf_service:
                raise HTTPException(status_code=500, detail="HF service not initialized")
            
            event_data = hf_service.generate_event_content(city, category)
            
            event = _build_event_model(event_data, city, category, organizer_id)
            
            session.add(event)
            generated_events.append({
                "title": event.title,
                "category": event.category,
                "location": event.location,
                "event_start": event.event_start.isoformat(),
            })
            
        except Exception as e:
            logger.error(f"Error generating event {i}: {str(e)}")
            continue
    
    session.commit()
    
    return {
        "city": city,
        "generated_count": len(generated_events),
        "events": generated_events
    }

@router.get("/cities")
async def get_supported_cities():
    """Get list of supported cities for event generation."""
    return {
        "cities": SUPPORTED_CITIES,
        "count": len(SUPPORTED_CITIES)
    }

@router.get("/categories")
async def get_supported_categories():
    """Get list of supported event categories."""
    return {
        "categories": CATEGORIES,
        "count": len(CATEGORIES)
    }

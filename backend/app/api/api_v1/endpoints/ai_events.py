"""
AI-powered event generation endpoints using HuggingFace models.
Generates realistic events with organizer banners and uses fallback data.
"""
import io
import os
import random
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from PIL import Image

from app.db.database import get_session
from app.models.event import Event
from app.models.user import User
from app.services.huggingface_service import get_hf_service, HFService

logger = logging.getLogger(__name__)
router = APIRouter()

# Organizer banner images (from "Organizers That Trust Us" section)
ORGANIZER_BANNERS = [
    "/static/event_images/Drink_clap_updated.png",
    "/static/event_images/University.png",
    "/static/event_images/Crawlers_updated.png",
    "/static/event_images/Art.png",
    "/static/event_images/Fitness_club.png",
    "/static/event_images/Counsel.png",
    "/static/event_images/Photography_updated.png",
    "/static/event_images/Cooking_club.png",
]

SUPPORTED_CITIES = [
    "New York", "Los Angeles", "Chicago", "San Francisco", "Austin",
    "Seattle", "Boston", "Denver", "Miami", "Dallas",
    "Portland", "Atlanta", "Phoenix", "San Diego", "Las Vegas",
    "Nashville", "Detroit", "Philadelphia"
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
    """
    Create an Event model instance from generated data with sane defaults.
    Assigns random organizer banner from trusted partners.
    """
    start_dt = _parse_datetime(event_data.get("start_time"))
    end_dt_raw = event_data.get("end_time")
    end_dt = _parse_datetime(end_dt_raw) if end_dt_raw else None

    return Event(
        title=event_data.get("title", "Unnamed Event"),
        description=event_data.get(
            "description",
            f"Join us for an unforgettable {category} experience in {city}!"
        ),
        category=event_data.get("category", category),
        location=event_data.get("location", city),
        event_start=start_dt,
        event_end=end_dt,
        max_attendees=int(event_data.get("expected_attendees", random.randint(100, 500))),
        price=float(event_data.get("price", 0.0) or 0.0),
        organizer_id=organizer_id,
        image=random.choice(ORGANIZER_BANNERS),  # Assign random organizer banner
    )


def _resolve_organizer_id(session: Session) -> int:
    """
    Get or create a default organizer user for AI-generated events.
    
    Returns:
        User ID of the organizer
    """
    organizer_email = "ai_organizer@eventify.system"
    organizer = session.query(User).filter(User.email == organizer_email).first()
    
    if not organizer:
        organizer = User(
            email=organizer_email,
            hashed_password="no_login",  # This account cannot be logged into
            full_name="EventiFy Event Team",
            role="organizer"
        )
        session.add(organizer)
        session.commit()
        session.refresh(organizer)
    
    return organizer.id


@router.post("/event")
async def generate_event(
    city: str = Query(..., description="City for event generation"),
    category: str = Query(..., description="Event category (music, sports, tech, etc.)"),
    session: Session = Depends(get_session)
):
    """
    Generate a single AI-powered event using HuggingFace models.
    
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
    # Graceful fallback: if HF service isn't initialized, use local fallback generator
    if not hf_service:
        hf_service = HFService(
            hf_token="",
            text_model=os.getenv("HF_TEXT_MODEL", "mistralai/Mistral-7B-Instruct-v0.3"),
            image_model=os.getenv("HF_IMAGE_MODEL", "stabilityai/stable-diffusion-3-medium"),
        )
    
    try:
        # Generate event content using Mistral
        logger.info(f"Generating event for {city} in {category}")
        event_data = hf_service.generate_event_content(city, category)
        
        organizer_id = _resolve_organizer_id(session)

        # Create event in database with organizer banner
        event = _build_event_model(event_data, city, category, organizer_id)
        
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

@router.post("/events-batch")
async def generate_events_batch(
    city: str = Query(..., description="City for event generation"),
    count: int = Query(5, ge=1, le=20, description="Number of events to generate"),
    session: Session = Depends(get_session)
):
    """
    Generate multiple events at once with organizer banners and bulk NPCs.
    
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
            hf_service = get_hf_service() or HFService(
                hf_token="",
                text_model=os.getenv("HF_TEXT_MODEL", "mistralai/Mistral-7B-Instruct-v0.3"),
                image_model=os.getenv("HF_IMAGE_MODEL", "stabilityai/stable-diffusion-3-medium"),
            )
            
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

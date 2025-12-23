"""
Hugging Face API integration for generating events and images.
Uses Mistral for text generation and Stable Diffusion for images.
"""
import json
import logging
from typing import Optional
import requests
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class HFService:
    def __init__(self, hf_token: str, text_model: str, image_model: str):
        self.hf_token = hf_token
        self.text_model = text_model
        self.image_model = image_model
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {hf_token}"}

    def generate_event_content(self, city: str, category: str) -> dict:
        """
        Generate event title, description, and details using Mistral.
        
        Args:
            city: City name for event context
            category: Event category (music, sports, tech, food, art, etc.)
        
        Returns:
            Dictionary with title, description, and other event details
        """
        prompt = f"""Generate a realistic event for {city}. The event should be in the {category} category.
        
Return ONLY valid JSON with no markdown or extra text, in this exact format:
{{
    "title": "Event Title",
    "description": "Detailed description of the event",
    "category": "{category}",
    "start_time": "2025-12-25T19:00:00",
    "end_time": "2025-12-25T23:00:00",
    "location": "Venue name, {city}",
    "expected_attendees": 150
}}"""

        try:
            response = requests.post(
                f"{self.api_url}/{self.text_model}",
                headers=self.headers,
                json={"inputs": prompt, "parameters": {"max_new_tokens": 500}},
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract generated text
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                # Remove the prompt from the response
                generated_text = generated_text.replace(prompt, "").strip()
            else:
                generated_text = result.get("generated_text", "")
            
            # Parse JSON from generated text
            # Try to find JSON in the response
            start_idx = generated_text.find('{')
            end_idx = generated_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = generated_text[start_idx:end_idx+1]
                event_data = json.loads(json_str)
            else:
                # Fallback if JSON parsing fails
                event_data = self._create_fallback_event(city, category)
            
            return event_data
            
        except Exception as e:
            logger.error(f"Error generating event content: {str(e)}")
            return self._create_fallback_event(city, category)

    def generate_event_image(self, event_title: str, city: str) -> Optional[bytes]:
        """
        Generate event cover image using Stable Diffusion.
        
        Args:
            event_title: Title of the event for image context
            city: City name for additional context
        
        Returns:
            Image bytes or None if generation fails
        """
        prompt = f"Professional event poster for {event_title} in {city}, vibrant, modern, clean design"
        
        try:
            response = requests.post(
                f"{self.api_url}/{self.image_model}",
                headers=self.headers,
                json={"inputs": prompt},
                timeout=60
            )
            response.raise_for_status()
            
            # Response should be image bytes
            if response.headers.get('content-type', '').startswith('image'):
                return response.content
            else:
                logger.warning(f"Unexpected response type: {response.headers.get('content-type')}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating event image: {str(e)}")
            return None

    def _create_fallback_event(self, city: str, category: str) -> dict:
        """Create a realistic fallback event if API generation fails."""
        event_names = {
            "music": ["Live Concert", "DJ Night", "Jazz Jam Session", "Rock Festival", "Indie Music Night"],
            "sports": ["Basketball Tournament", "Soccer Match", "Yoga Session", "Marathon", "Tennis Match"],
            "tech": ["AI Workshop", "Web Dev Bootcamp", "Startup Pitch Night", "Tech Meetup", "Coding Challenge"],
            "food": ["Food Festival", "Cooking Class", "Wine Tasting", "Food Truck Rally", "Culinary Workshop"],
            "art": ["Art Exhibition", "Gallery Opening", "Painting Workshop", "Sculpture Tour", "Photography Show"],
            "business": ["Networking Mixer", "Business Conference", "Leadership Summit", "Investor Pitch", "Industry Talk"],
        }
        
        venues = {
            "New York": ["Central Park", "Madison Square Garden", "Brooklyn Bridge Park"],
            "Los Angeles": ["Hollywood Bowl", "Griffith Park", "Santa Monica Pier"],
            "Chicago": ["Navy Pier", "Grant Park", "Willis Tower"],
            "San Francisco": ["Golden Gate Park", "Ferry Building", "Palace of Fine Arts"],
            "Austin": ["Zilker Park", "6th Street", "Lady Bird Lake"],
        }
        
        names = event_names.get(category, event_names["music"])
        title = random.choice(names)
        venue = random.choice(venues.get(city, [f"{city} Convention Center"]))
        
        # Generate random time
        base_time = datetime.now() + timedelta(days=random.randint(1, 30))
        start_time = base_time.replace(hour=random.randint(10, 20), minute=0, second=0)
        end_time = start_time + timedelta(hours=random.randint(2, 5))
        
        return {
            "title": f"{title} in {city}",
            "description": f"Join us for an exciting {category} event featuring amazing entertainment and networking opportunities.",
            "category": category,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "location": f"{venue}, {city}",
            "expected_attendees": random.randint(50, 500)
        }

# Global service instance
_hf_service: Optional[HFService] = None

def init_hf_service(hf_token: str, text_model: str, image_model: str) -> HFService:
    """Initialize the HF service."""
    global _hf_service
    _hf_service = HFService(hf_token, text_model, image_model)
    return _hf_service

def get_hf_service() -> Optional[HFService]:
    """Get the HF service instance."""
    return _hf_service

"""
Generate Event Banners Using Hugging Face Models
Populates missing event banners with AI-generated images synced to event title & details
"""
import os
import sys
from pathlib import Path
from datetime import datetime
import asyncio

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select, create_engine
from app.models.event import Event
from app.services.huggingface_service import HFService
from app.core.config import settings

# Create engine
DATABASE_URL = "sqlite:///./eventify.db"
engine = create_engine(DATABASE_URL, echo=False)


async def generate_banner_for_event(event: Event, hf_service: HFService, static_dir: Path):
    """Generate and save banner image for an event"""
    if event.image and event.image.startswith('http'):
        print(f"  ✓ Event '{event.title}' already has external image: {event.image}")
        return False
    
    if event.image and event.image.startswith('/static/'):
        # Check if file exists
        file_path = static_dir / event.image.replace('/static/', '')
        if file_path.exists():
            print(f"  ✓ Event '{event.title}' already has local image: {event.image}")
            return False
    
    print(f"  🎨 Generating banner for '{event.title}'...")
    
    # Generate image based on event title and location
    image_bytes = hf_service.generate_event_image(
        event_title=event.title,
        city=event.location or "venue"
    )
    
    if not image_bytes:
        print(f"  ❌ Failed to generate image for '{event.title}'")
        return False
    
    # Save image to static directory
    event_images_dir = static_dir / 'event_images'
    event_images_dir.mkdir(exist_ok=True)
    
    # Create filename from event ID and timestamp
    timestamp = int(datetime.now().timestamp())
    filename = f"event_{event.id}_{timestamp}.jpg"
    file_path = event_images_dir / filename
    
    with open(file_path, 'wb') as f:
        f.write(image_bytes)
    
    # Update event with new image path
    event.image = f"/static/event_images/{filename}"
    print(f"  ✅ Saved banner: /static/event_images/{filename}")
    
    return True


async def main():
    """Main script to generate banners for all events without images"""
    print("=" * 70)
    print("🎨 Event Banner Generation - Hugging Face Integration")
    print("=" * 70)
    
    # Check HF token
    hf_token = settings.HF_TOKEN if hasattr(settings, 'HF_TOKEN') else os.getenv('HF_TOKEN')
    if not hf_token:
        print("\n❌ HF_TOKEN not found in settings or environment variables")
        print("   Please set HF_TOKEN in backend/.env.dev")
        return
    
    # Initialize HF service
    text_model = getattr(settings, 'HF_TEXT_MODEL', 'mistralai/Mistral-7B-Instruct-v0.3')
    image_model = getattr(settings, 'HF_IMAGE_MODEL', 'stabilityai/stable-diffusion-3-medium')
    
    print(f"\n📦 Initializing Hugging Face Service")
    print(f"   Text Model: {text_model}")
    print(f"   Image Model: {image_model}")
    
    hf_service = HFService(
        hf_token=hf_token,
        text_model=text_model,
        image_model=image_model
    )
    
    # Get static directory
    backend_dir = Path(__file__).parent.parent
    static_dir = backend_dir / 'static'
    static_dir.mkdir(exist_ok=True)
    
    print(f"   Static Dir: {static_dir}")
    
    # Query all events
    with Session(engine) as session:
        events = session.exec(select(Event)).all()
        print(f"\n📊 Found {len(events)} total events")
        
        # Filter events without images
        events_without_images = []
        for event in events:
            if not event.image or not event.image.startswith('http'):
                if not event.image or not event.image.startswith('/static/'):
                    events_without_images.append(event)
                else:
                    # Check if file exists
                    file_path = static_dir / event.image.replace('/static/', '')
                    if not file_path.exists():
                        events_without_images.append(event)
        
        print(f"   {len(events_without_images)} events need banner generation")
        
        if not events_without_images:
            print("\n✅ All events already have banners!")
            return
        
        # Generate banners
        print(f"\n🚀 Starting banner generation...")
        generated_count = 0
        
        for i, event in enumerate(events_without_images, 1):
            print(f"\n[{i}/{len(events_without_images)}] Processing Event ID: {event.id}")
            
            success = await generate_banner_for_event(event, hf_service, static_dir)
            if success:
                generated_count += 1
                session.add(event)
                session.commit()
                session.refresh(event)
        
        print(f"\n{'=' * 70}")
        print(f"✅ Banner Generation Complete!")
        print(f"   Generated: {generated_count} new banners")
        print(f"   Skipped: {len(events_without_images) - generated_count} (already had images)")
        print(f"={'=' * 70}\n")


if __name__ == '__main__':
    asyncio.run(main())

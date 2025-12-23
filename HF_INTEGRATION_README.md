# Hugging Face AI Integration - EventiFy

Complete integration of Hugging Face API for AI-powered event generation.

## Overview

The system uses two Hugging Face models to generate realistic events:
- **Text Generation**: `mistralai/Mistral-7B-Instruct-v0.3` for event titles and descriptions
- **Image Generation**: `stabilityai/stable-diffusion-3-medium` for event cover images

## Setup

### 1. Get Your HF Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new token with read permissions
3. Copy the token

### 2. Configure Environment

Add to `backend/.env.dev`:
```
HF_TOKEN=hf_your_token_here
HF_TEXT_MODEL=mistralai/Mistral-7B-Instruct-v0.3
HF_IMAGE_MODEL=stabilityai/stable-diffusion-3-medium
```

### 3. Start Services

**Backend:**
```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
npm run dev
```

## API Endpoints

### 1. Get Available Cities
```
GET /api/v1/ai/cities
Response: ["New York", "Los Angeles", "Chicago", ...]
```

### 2. Get Available Categories
```
GET /api/v1/ai/categories
Response: ["music", "sports", "tech", "food", "art", ...]
```

### 3. Generate Single Event
```
POST /api/v1/ai/generate/event?city=New%20York&category=music

Response:
{
  "title": "Jazz Night at Blue Note",
  "description": "Live jazz performance...",
  "location": "Greenwich Village, NYC",
  "start_time": "2024-12-20T20:00:00",
  "image_url": "/static/event_images/event_1766489327.jpg"
}
```

### 4. Generate Batch Events
```
POST /api/v1/ai/generate/events-batch?city=Los%20Angeles&count=3

Response: Array of 3 generated events
```

## Frontend Component

### WhatsHappeningNow Component
Located at `src/components/WhatsHappeningNow.jsx`

**Features:**
- City selector dropdown (10+ cities)
- Category filter (6 categories)
- Generate AI Events button
- Event cards grid
- Loading states
- Error handling

**Usage in Home.jsx:**
```jsx
import WhatsHappeningNow from '../components/WhatsHappeningNow';

// In your JSX:
<WhatsHappeningNow />
```

## Project Files

### Backend
- **Service**: `backend/app/services/huggingface_service.py`
  - HFService class with text/image generation
  - Fallback event generation
  - Global instance management

- **Endpoints**: `backend/app/api/api_v1/endpoints/ai_events.py`
  - 4 routes for event generation and metadata
  - Input validation
  - Database persistence

- **Config**: `backend/.env.dev` / `backend/.env.prod`
  - HF_TOKEN
  - Model names
  - Railway secrets (production)

### Frontend
- **Component**: `src/components/WhatsHappeningNow.jsx`
  - State management
  - API integration
  - UI with filters and event cards

- **Integration**: `src/pages/Home.jsx`
  - Component imported and positioned
  - Integrated between ActiveEventsCarousel and HowItWorks

## Supported Cities (18 total)
- New York
- Los Angeles
- Chicago
- San Francisco
- Austin
- Seattle
- Boston
- Denver
- Miami
- Dallas
- London
- Paris
- Tokyo
- Berlin
- Toronto
- Sydney
- Singapore
- Dubai

## Supported Categories (10 total)
- Music
- Sports
- Technology
- Food & Dining
- Art & Culture
- Business & Networking
- Education
- Wellness & Fitness
- Entertainment
- Community Events

## Image Storage

Generated images are saved to:
- **Full Images**: `backend/static/event_images/`
- **Thumbnails**: `backend/static/event_images/thumbs/`

Filename format: `event_{timestamp}.{extension}`

## Graceful Fallback

If HF API fails, the system automatically generates realistic fallback events with:
- Pre-defined event templates
- City-appropriate venue names
- Category-specific details
- Current date/time metadata

## Database Schema

Events are persisted in the existing `Event` model with:
- `title`: Event name
- `description`: Full event details
- `location`: Venue/location
- `start_time`: Event start datetime
- `image_url`: Path to generated image
- `is_published`: True (all AI events auto-published)
- `category`: Event type
- Other standard fields

## Testing

### Manual Testing
1. Navigate to Home page
2. Scroll to "What's Happening Now" section
3. Select a city from dropdown
4. Select a category (optional)
5. Click "Generate AI Events" button
6. Wait for generation (5-30 seconds)
7. View generated events in grid

### API Testing with cURL
```bash
# Get cities
curl http://localhost:8000/api/v1/ai/cities

# Get categories
curl http://localhost:8000/api/v1/ai/categories

# Generate single event
curl -X POST "http://localhost:8000/api/v1/ai/generate/event?city=New%20York&category=music"

# Generate batch
curl -X POST "http://localhost:8000/api/v1/ai/generate/events-batch?city=Los%20Angeles&count=3"
```

## Troubleshooting

### HF API Not Working
- Check HF_TOKEN is valid in .env
- Verify models are accessible on Hugging Face
- Check network connectivity
- System will use fallback events automatically

### Image Generation Fails
- Ensure Pillow is installed
- Check disk space for image storage
- Verify write permissions on `backend/static/event_images/`

### Database Issues
- Ensure database is running
- Check SQLModel migrations are applied
- Verify Event model has required fields

## Dependencies

**Backend:**
- `huggingface-hub>=0.20.0` - HF API client
- `requests>=2.31.0` - HTTP requests
- `Pillow>=10.0.0` - Image processing

**Frontend:**
- React 18+
- React Router
- TailwindCSS
- Lucide Icons

## Future Enhancements

1. **Event Analytics**: Track generated event performance
2. **Smart Filtering**: ML-based event recommendations
3. **Real-time Updates**: WebSocket event streaming
4. **User Preferences**: Personalized event generation
5. **Multi-language**: Generate events in multiple languages
6. **Event Reviews**: User ratings and feedback
7. **Ticket Integration**: Direct booking from events
8. **Email Notifications**: Event reminders and updates

## Performance Notes

- Single event generation: ~5-15 seconds
- Batch generation (3 events): ~15-30 seconds
- Image generation: ~5-10 seconds per image
- Caching recommended for repeated cities/categories
- Fallback generation: <1 second

## Security

- HF Token stored in environment variables only
- Never commit .env files to repository
- API rate limiting recommended in production
- Image URLs validated before serving
- Input validation on all endpoints

---

**Created**: December 2024
**Version**: 2.0
**Status**: Production Ready ✅

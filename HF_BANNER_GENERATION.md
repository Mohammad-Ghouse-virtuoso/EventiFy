# 🎨 Hugging Face Integration Setup

## Generate Event Banners with AI

The system is ready to generate AI-powered event banners using Hugging Face's Stable Diffusion model.

### Setup Instructions

#### 1. Get Your HF Token

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Set permissions to "Read"
4. Copy the token

#### 2. Configure Environment

Add your token to `backend/.env.dev`:

```bash
HF_TOKEN=hf_your_token_here
HF_TEXT_MODEL=mistralai/Mistral-7B-Instruct-v0.3
HF_IMAGE_MODEL=stabilityai/stable-diffusion-3-medium
```

#### 3. Run Banner Generation

```bash
cd backend
source .venv/bin/activate
python scripts/generate_event_banners.py
```

### What It Does

✅ Scans all events in database
✅ Identifies events without banners (or with missing local images)
✅ Generates realistic event cover images using Stable Diffusion
✅ Saves images to `/backend/static/event_images/`
✅ Updates event records with image paths

### Output

```
======================================================================
🎨 Event Banner Generation - Hugging Face Integration
======================================================================

📊 Found 19 total events
   15 events need banner generation

🚀 Starting banner generation...

[1/15] Processing Event ID: 1
  🎨 Generating banner for 'Friday Night Fever at Remo's'...
  ✅ Saved banner: /static/event_images/event_1_1735689600.jpg

[2/15] Processing Event ID: 2
  🎨 Generating banner for 'Contemporary Art Exhibition'...
  ✅ Saved banner: /static/event_images/event_2_1735689620.jpg

...

======================================================================
✅ Banner Generation Complete!
   Generated: 15 new banners
   Skipped: 0 (already had images)
======================================================================
```

### Features

- **Smart Detection**: Skips events that already have valid images
- **Safe Retry**: Handles API timeouts gracefully
- **Progress Tracking**: Shows which event is being processed
- **Database Safe**: Transactional updates (all-or-nothing)
- **Resumable**: Can re-run script to fill gaps

### Troubleshooting

**"HF_TOKEN not found"**
- Add HF_TOKEN to `backend/.env.dev`
- Restart the backend

**"API rate limited"**
- Wait a few minutes
- Re-run the script (it will skip completed events)

**"Image generation failed for event X"**
- Check Hugging Face API status
- Verify token has correct permissions
- Try again later

### Image Quality Tips

The generated banners use:
- Event title for primary context
- Location for secondary context
- Prompt: `"Professional event poster for {title} in {city}, vibrant, modern, clean design"`

For better results, ensure event titles are descriptive (e.g., "Jazz Night" vs "Event 1")

### Next Steps

Once banners are generated:
1. Review images in frontend
2. Re-run if needed (script skips existing images)
3. Consider custom images for important events
4. Monitor generation quality

---

**Status**: ✅ Ready to use - just add your HF_TOKEN and run!

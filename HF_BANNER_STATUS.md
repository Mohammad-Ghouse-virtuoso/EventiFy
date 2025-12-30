# Hugging Face Banner Generation - Status Update

## Issue: HF Free Inference API Deprecated

As of December 2024, Hugging Face has deprecated most free serverless inference models. All tested models return `410 Gone`:

- ❌ `stabilityai/stable-diffusion-3-medium` 
- ❌ `stabilityai/stable-diffusion-xl-base-1.0`
- ❌ `black-forest-labs/FLUX.1-schnell`
- ❌ `stabilityai/sdxl-turbo`
- ❌ `runwayml/stable-diffusion-v1-5`
- ❌ `CompVis/stable-diffusion-v1-4`

## Alternative Solutions

### Option 1: Use Unsplash API (Current Approach) ✅
**Status: Already implemented and working**

Events currently use Unsplash images which provide:
- High-quality, professional photography
- Free tier: 50 requests/hour
- No generation time
- Real event imagery

**No changes needed** - this is the recommended approach for production.

### Option 2: Replicate API (Paid)
- Access to Stable Diffusion, FLUX, and other models
- Pay-per-use pricing (~$0.001-0.01 per image)
- Reliable and fast
- Setup: https://replicate.com/

### Option 3: HuggingFace Dedicated Endpoints (Paid)
- Deploy your own inference endpoint
- Starting at $0.60/hour
- Full control over model
- Setup: https://huggingface.co/inference-endpoints

### Option 4: Local Generation (Free, Slower)
- Run Stable Diffusion locally using `diffusers` library
- Requires GPU (CUDA/ROCm) or runs on CPU (slow)
- One-time setup, no API costs

## Current System Status

✅ **Events have banner images** (Unsplash URLs)  
✅ **Banner generation script infrastructure ready**  
❌ **HF inference API unavailable**  

## Recommendation

**Keep using Unsplash** for event banners. The current implementation provides:
- Professional quality images
- Zero generation time
- No API costs for < 50 events/hour
- Proven reliability

If custom AI-generated banners are required later, integrate Replicate API (Option 2).

## Code Status

All banner generation code is functional and ready - only needs a working image model endpoint:
- `backend/app/services/huggingface_service.py` - Service layer
- `backend/scripts/generate_event_banners.py` - CLI tool with `--force` flag
- Error handling for deprecated models implemented

To test banner generation if/when HF models become available again:
```bash
cd backend
source .venv/bin/activate
python scripts/generate_event_banners.py --force
```

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.db.database import engine
from app.services.huggingface_service import init_hf_service
from app.services.event_scheduler import start_scheduler, stop_scheduler
import os
import secrets
from fastapi.responses import JSONResponse
import time
from sqlalchemy import text
import logging
import uuid

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redirect_slashes=False  # Disable automatic redirects on trailing slashes
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    
    # Run database migrations for scheduler fields
    try:
        from scripts.migrate_event_scheduler_fields import migrate
        logging.info("🔄 Running database migrations...")
        migrate()
        logging.info("✅ Database migrations completed")
    except Exception as e:
        logging.error(f"⚠️ Migration warning (may already be applied): {str(e)}")
    
    # Initialize Hugging Face service if token is available
    hf_token = os.getenv("HF_TOKEN")
    hf_text_model = os.getenv("HF_TEXT_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")
    hf_image_model = os.getenv("HF_IMAGE_MODEL", "stabilityai/stable-diffusion-3-medium")
    
    if hf_token:
        try:
            init_hf_service(hf_token, hf_text_model, hf_image_model)
            logging.info("✅ Hugging Face service initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize Hugging Face service: {str(e)}")
    
    # Start event repopulation scheduler
    try:
        start_scheduler()
    except Exception as e:
        logging.error(f"❌ Failed to start event scheduler: {str(e)}")
        # Don't let scheduler failure crash the app
        pass


# Graceful shutdown
@app.on_event("shutdown")
def shutdown_event():
    try:
        stop_scheduler()
    except Exception as e:
        logging.error(f"❌ Error stopping scheduler: {str(e)}")

# Set all CORS enabled origins via settings
# Ensure origins are plain strings (not AnyHttpUrl objects) so Starlette matches correctly
_cors_origins = [str(o) for o in settings.BACKEND_CORS_ORIGINS]
# In dev, be permissive for localhost/127.0.0.1 to avoid origin mismatches
_cors_regex = r"https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?" if settings.ENVIRONMENT == "dev" else None
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist (from settings)
static_dir = os.path.abspath(settings.STATIC_DIR)
os.makedirs(static_dir, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to EventiFy API"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
    }

@app.get("/health/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})

# --- Minimal CSRF protection for form endpoints ---
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "x-csrf-token"

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # In development, disable CSRF validation to simplify local cross-origin flows
    if settings.ENVIRONMENT == "dev":
        return await call_next(request)
    # Protect only form submissions to sensitive endpoints (e.g., /auth/login, /auth/register)
    path = request.url.path
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and \
       (path.startswith("/api/v1/auth/") or path.startswith("/api/v1/events/upload")):
        # Read tokens
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
        header_token = request.headers.get(CSRF_HEADER_NAME)
        # Allow JSON refresh endpoint without CSRF (token-based)
        if path.endswith("/refresh"):
            return await call_next(request)
        # For multipart/form-data or form-urlencoded, require matching header & cookie
        content_type = request.headers.get("content-type", "")
        if ("application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type):
            if not cookie_token or not header_token or cookie_token != header_token:
                return JSONResponse(status_code=403, content={"detail": "CSRF validation failed"})
    response = await call_next(request)
    return response

# --- Request timing middleware (enabled in dev or when REQUEST_TIMING_LOG=true) ---
REQUEST_TIMING_LOG = os.getenv("REQUEST_TIMING_LOG", "false").lower() == "true"

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    if not (REQUEST_TIMING_LOG or settings.ENVIRONMENT == "dev"):
        # Fast-path: no timing log in production by default
        return await call_next(request)

    start = time.perf_counter()
    try:
        response = await call_next(request)
        return response
    finally:
        duration_ms = (time.perf_counter() - start) * 1000.0
        # Avoid logging static files loudly; keep concise format for grepping
        path = request.url.path
        if not path.startswith("/static"):
            # Format: METHOD PATH -> STATUS in X.XXms
            try:
                status = response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = "-"
            print(f"{request.method} {path} -> {status} in {duration_ms:.2f}ms")

@app.get("/api/v1/auth/csrf-token")
def get_csrf_token():
    token = secrets.token_urlsafe(32)
    resp = JSONResponse({"csrfToken": token})
    resp.set_cookie(CSRF_COOKIE_NAME, token, httponly=False, samesite="lax")
    return resp

# --- Dev-only CORS fallback (to avoid tricky regex/origin mismatches) ---
@app.middleware("http")
async def dev_cors_fallback(request: Request, call_next):
    if settings.ENVIRONMENT == "dev":
        origin = request.headers.get("origin")
        if origin and (origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1")):
            # Handle preflight explicitly in dev
            if request.method == "OPTIONS":
                allow_headers_req = request.headers.get("access-control-request-headers", "*")
                headers = {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
                    "Access-Control-Allow-Headers": allow_headers_req,
                    "Vary": "Origin",
                }
                return JSONResponse(status_code=204, content=None, headers=headers)

            response = await call_next(request)
            # If upstream middlewares didn't set ACAO, add it for localhost
            if "access-control-allow-origin" not in (k.lower() for k in response.headers.keys()):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Vary"] = "Origin"
            return response
    return await call_next(request)

# --- Global error handlers ---
logger = logging.getLogger("eventify")

def _request_id() -> str:
    return uuid.uuid4().hex

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    err_id = _request_id()
    # Log full details server-side
    logger.exception(f"[error_id={err_id}] Unhandled error at {request.url.path}")
    # Return minimal safe message to clients
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error_id": err_id,
        },
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Preserve original detail but enrich with error_id for traceability
    err_id = _request_id()
    try:
        logger.warning(f"[error_id={err_id}] HTTP {exc.status_code} at {request.url.path}: {exc.detail}")
    except Exception:
        pass
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_id": err_id,
        },
    )
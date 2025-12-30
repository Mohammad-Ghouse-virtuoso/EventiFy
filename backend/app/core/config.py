from typing import List, ClassVar
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from decouple import Config as DecoupleConfig, RepositoryEnv

# Determine which .env file to load based on ENVIRONMENT/ENV
_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_ENV_NAME = os.getenv("ENVIRONMENT") or os.getenv("ENV") or "dev"

def _select_env_file(env_name: str) -> str | None:
    """Return absolute path to the env file to use, or None if not found.
    Resolution order:
    - dev: .env.dev -> .env
    - prod: .env.prod -> .env
    - others: .env.{name} -> .env
    """
    candidates = []
    if env_name == "dev":
        candidates = [".env.dev", ".env"]
    elif env_name == "prod":
        # Prefer a dedicated prod file; fall back to example, then generic .env
        candidates = [".env.prod", ".env.prod.example", ".env"]
    else:
        candidates = [f".env.{env_name}", ".env"]
    for fname in candidates:
        path = os.path.join(_BASE_DIR, fname)
        if os.path.exists(path):
            return path
    return None

_ENV_FILE = _select_env_file(_ENV_NAME)
if _ENV_FILE:
    _env = DecoupleConfig(RepositoryEnv(_ENV_FILE))
else:
    # Fall back to OS environment only; values without defaults must be provided
    _env = DecoupleConfig(RepositoryEnv("/dev/null"))  # empty repo

def _bool_env(name: str, default: str = "0") -> bool:
    v = _env(name, default=default)
    return str(v).strip().lower() in {"1", "true", "yes", "on"}

def _parse_cors_origins(raw: str) -> List[str]:
    """Parse CORS origins from comma-separated string or JSON array."""
    if not raw:
        return []
    raw = raw.strip()
    # Handle JSON array format: ["http://...", "https://..."]
    if raw.startswith("["):
        import json
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
    # Handle comma-separated format: http://...,https://...
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

# Read CORS origins directly to avoid pydantic-settings JSON parsing issues
_DEFAULT_CORS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
_CORS_ORIGINS = _parse_cors_origins(_env("BACKEND_CORS_ORIGINS", default=_DEFAULT_CORS))

def _normalize_base_url(url: str) -> str:
    """Ensure BASE_URL has a proper scheme (https:// in prod, http:// in dev)."""
    url = url.strip().rstrip("/")
    if not url:
        return "http://localhost:8000"
    # If no scheme, add https:// for production domains, http:// for localhost
    if not url.startswith(("http://", "https://")):
        if "localhost" in url or "127.0.0.1" in url:
            url = f"http://{url}"
        else:
            url = f"https://{url}"
    return url

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
    )
    
    PROJECT_NAME: str = "EventiFy"
    API_V1_STR: str = "/api/v1"
    # Selected environment (dev, prod, etc.)
    ENVIRONMENT: str = _env("ENVIRONMENT", default=_ENV_NAME)
    
    # Database
    DATABASE_URL: str = _env("DATABASE_URL", default="sqlite:///./eventify.db")
    # Echo SQL (debug) - enabled by default in dev
    ECHO_SQL: bool = _bool_env("ECHO_SQL", default=("1" if _ENV_NAME == "dev" else "0"))
    
    # CORS - ClassVar excludes it from pydantic field processing, avoiding JSON parse issues
    BACKEND_CORS_ORIGINS: ClassVar[List[str]] = _CORS_ORIGINS
    
    # JWT
    # Secrets: MUST be provided via env in production.
    # Provide safe defaults in dev/test to avoid CI/test failures when secrets are absent.
    if _ENV_NAME in ("dev", "test"):
        _DEFAULT_SECRET = "dev-secret-key"
        _DEFAULT_REFRESH = "dev-refresh-secret"
        SECRET_KEY: str = _env("SECRET_KEY", default=_DEFAULT_SECRET)
        REFRESH_SECRET_KEY: str = _env("REFRESH_SECRET_KEY", default=_DEFAULT_REFRESH)
    else:
        # In prod, require explicit values (no defaults)
        SECRET_KEY: str = _env("SECRET_KEY")
        REFRESH_SECRET_KEY: str = _env("REFRESH_SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour default
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Argon2id hashing defaults (env-specific). These can be overridden via env vars.
    # Dev/Test aim for faster runs suitable for k6 load testing; Prod keeps stronger defaults.
    _ARGON2_DEFAULT_TIME = "3" if _ENV_NAME == "prod" else "2"
    _ARGON2_DEFAULT_MEMORY = "65536" if _ENV_NAME == "prod" else "51200"  # KiB
    _ARGON2_DEFAULT_PARALLELISM = "2"  # consistent across envs

    ARGON2_TIME_COST: int = int(_env("ARGON2_TIME_COST", default=_ARGON2_DEFAULT_TIME))
    ARGON2_MEMORY_COST: int = int(_env("ARGON2_MEMORY_COST", default=_ARGON2_DEFAULT_MEMORY))
    ARGON2_PARALLELISM: int = int(_env("ARGON2_PARALLELISM", default=_ARGON2_DEFAULT_PARALLELISM))

    # Login rate limiting
    LOGIN_RATE_LIMIT_PER_MINUTE: int = int(_env("LOGIN_RATE_LIMIT_PER_MINUTE", default=5))

    # Base URL for building absolute links (e.g., http://localhost:8000)
    # Read raw value first, will be normalized
    _BASE_URL_RAW: str = _env("BASE_URL", default="http://localhost:8000")

    @property
    def BASE_URL(self) -> str:
        """Normalized BASE_URL with proper scheme."""
        return _normalize_base_url(self._BASE_URL_RAW)

    # Static directory (absolute); defaults to backend/app/../static
    STATIC_DIR: str = _env(
        "STATIC_DIR",
        # Default to backend/static (two levels up from core/)
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static"))
    )

    # Hugging Face API configuration
    HF_TOKEN: str | None = _env("HF_TOKEN", default=None)
    HF_TEXT_MODEL: str = _env("HF_TEXT_MODEL", default="mistralai/Mistral-7B-Instruct-v0.3")
    HF_IMAGE_MODEL: str = _env("HF_IMAGE_MODEL", default="stabilityai/stable-diffusion-xl-base-1.0")


settings = Settings()
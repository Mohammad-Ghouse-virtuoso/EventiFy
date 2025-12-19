from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings
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

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventiFy"
    API_V1_STR: str = "/api/v1"
    # Selected environment (dev, prod, etc.)
    ENVIRONMENT: str = _env("ENVIRONMENT", default=_ENV_NAME)
    
    # Database
    DATABASE_URL: str = _env("DATABASE_URL", default="sqlite:///./eventify.db")
    # Echo SQL (debug) - enabled by default in dev
    ECHO_SQL: bool = _bool_env("ECHO_SQL", default=("1" if _ENV_NAME == "dev" else "0"))
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
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
    BASE_URL: str = _env("BASE_URL", default="http://localhost:8000")

    # Static directory (absolute); defaults to backend/app/../static
    STATIC_DIR: str = _env(
        "STATIC_DIR",
        # Default to backend/static (two levels up from core/)
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static"))
    )

    class Config:
        case_sensitive = True

settings = Settings()
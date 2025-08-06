from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings
from decouple import config

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventiFy"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = config("DATABASE_URL", default="sqlite:///./eventify.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # JWT
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-here-change-in-production-very-long-secret-key-for-jwt-tokens")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for development

    class Config:
        case_sensitive = True

settings = Settings()
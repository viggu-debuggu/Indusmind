import os
from typing import Literal, Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "INDUSMIND AI"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    PORT: int = 8000
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://indusmind_user:indusmind_password@localhost:5432/indusmind_db"

    # Security
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if not self.SECRET_KEY:
            if self.ENVIRONMENT == "production":
                raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY environment variable is not configured for production mode!")
            else:
                self.SECRET_KEY = "insecure-development-fallback-key-should-be-replaced-in-env"
        return self

    # Storage Settings
    STORAGE_PROVIDER: Literal["local", "s3", "azure", "minio"] = "local"
    LOCAL_STORAGE_PATH: str = "/app/storage"

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Azure Blob Storage Settings
    AZURE_CONNECTION_STRING: Optional[str] = None
    AZURE_CONTAINER_NAME: Optional[str] = None

    # MinIO Settings
    MINIO_ENDPOINT: Optional[str] = None
    MINIO_ACCESS_KEY: Optional[str] = None
    MINIO_SECRET_KEY: Optional[str] = None
    MINIO_BUCKET: Optional[str] = None


settings = Settings()

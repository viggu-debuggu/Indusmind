import time
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db, verify_db_connection, engine
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def get_health():
    """Returns database and overall system connectivity status with response time metrics."""
    # Database latency check
    db_start = time.time()
    db_connected = verify_db_connection()
    db_latency_ms = round((time.time() - db_start) * 1000, 1)

    # AI service status
    llm_provider = os.getenv("LLM_PROVIDER", "mock")
    ai_status = "online"
    if llm_provider == "mock":
        ai_status = "offline_mock"
    elif llm_provider == "groq" and os.getenv("GROQ_API_KEY"):
        ai_status = "online"
    elif llm_provider == "gemini" and os.getenv("GEMINI_API_KEY"):
        ai_status = "online"

    # Storage status
    storage_provider = settings.STORAGE_PROVIDER
    storage_status = "connected"
    if storage_provider == "local":
        local_path = settings.LOCAL_STORAGE_PATH
        storage_status = "connected" if os.path.isdir(local_path) else "disconnected"

    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "database_latency_ms": db_latency_ms if db_connected else None,
        "ai_service": ai_status,
        "ai_provider": llm_provider,
        "storage": storage_status,
        "storage_provider": storage_provider,
        "service": "INDUSMIND AI API"
    }


@router.get("/version")
def get_version():
    """Returns project title and current running version."""
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0-beta",
        "api_spec": "OpenAPI v3.1"
    }


@router.get("/status")
def get_status():
    """Returns detailed status information about execution environment."""
    return {
        "status": "operational",
        "environment": settings.ENVIRONMENT,
        "storage_provider": settings.STORAGE_PROVIDER,
        "features": {
            "ocr": "active",
            "rag": "active",
            "knowledge_graph": "active",
            "compliance": "active",
            "predictive_maintenance": "active"
        }
    }

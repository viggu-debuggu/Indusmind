from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.logging import logger


class AppException(Exception):
    """Base exception for all custom application errors."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseConnectionException(AppException):
    def __init__(self, message: str = "Database connection error occurred", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=503,
            error_code="DATABASE_CONNECTION_ERROR",
            details=details
        )


class AuthenticationException(AppException):
    def __init__(self, message: str = "Could not validate credentials", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_FAILED",
            details=details
        )


class StorageException(AppException):
    def __init__(self, message: str = "Storage operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="STORAGE_OPERATION_FAILED",
            details=details
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Catches and handles custom AppExceptions, returning structured JSON."""
    logger.error(
        "app_exception_raised",
        path=request.url.path,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for unhandled exceptions."""
    logger.exception(
        "unhandled_exception_raised",
        path=request.url.path,
        exception=str(exc)
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server.",
                "details": {}
            }
        }
    )

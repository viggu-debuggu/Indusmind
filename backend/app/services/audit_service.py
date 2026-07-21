from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.core.logging import logger


class AuditService:
    """Centralized audit logging service for tracking all platform actions."""

    @staticmethod
    def log(
        db: Session,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """Creates an immutable audit log entry."""
        try:
            entry = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else None,
                details=details,
                ip_address=ip_address
            )
            db.add(entry)
            db.commit()
            db.refresh(entry)
            logger.info(
                "audit_log_created",
                action=action,
                user_id=user_id,
                resource_type=resource_type,
                resource_id=resource_id
            )
            return entry
        except Exception as e:
            logger.error("audit_log_failed", error=str(e), action=action)
            db.rollback()
            return None

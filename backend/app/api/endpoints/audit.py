from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse, AuditUserRef
from app.core.exceptions import AppException

router = APIRouter(prefix="/audit", tags=["Enterprise Audit Logs"])

@router.get("/logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves list of platform actions. Admin/Super Admin only."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrators can view system audit logs.", status_code=403, error_code="UNAUTHORIZED")
    
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
        
    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    
    response = []
    for log in logs:
        user_ref = None
        if log.user:
            user_ref = AuditUserRef(
                id=log.user.id,
                full_name=log.user.full_name,
                email=log.user.email
            )
        response.append(
            AuditLogResponse(
                id=log.id,
                uuid=log.uuid,
                user_id=log.user_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at,
                user=user_ref
            )
        )
    return response

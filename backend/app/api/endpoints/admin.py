from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.dependencies.auth import RoleChecker
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, AdminUserRoleUpdate
from app.core.exceptions import AppException
from app.core.logging import logger

router = APIRouter()

# Restrict the entire router context to Super Admin and Admin roles
admin_dependency = Depends(RoleChecker(allowed_roles=["Super Admin", "Admin"]))


@router.get("/users", response_model=List[UserResponse], dependencies=[admin_dependency])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lists registered portal accounts with filters and pagination."""
    query = db.query(User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_filter),
                User.email.ilike(search_filter),
                User.company.ilike(search_filter)
            )
        )
        
    if role:
        query = query.filter(User.role == role)
        
    return query.offset(skip).limit(limit).all()


@router.put("/users/{user_id}/activate", response_model=UserResponse, dependencies=[admin_dependency])
def activate_user(user_id: int, db: Session = Depends(get_db)):
    """Restores active status configuration to an account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(message="Target account not found.", status_code=404, error_code="USER_NOT_FOUND")
        
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    logger.info("user_activated_by_admin", user_id=user.id, email=user.email)
    return user


@router.put("/users/{user_id}/deactivate", response_model=UserResponse, dependencies=[admin_dependency])
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    """Deactivates account credentials preventing session logins."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(message="Target account not found.", status_code=404, error_code="USER_NOT_FOUND")
        
    # Prevent self-deactivation
    # In actual integration, we could check if user_id == current_user.id
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    logger.info("user_deactivated_by_admin", user_id=user.id, email=user.email)
    return user


@router.put("/users/{user_id}/role", response_model=UserResponse, dependencies=[admin_dependency])
def update_user_role(user_id: int, schema: AdminUserRoleUpdate, db: Session = Depends(get_db)):
    """Reconfigures user role, updating active permission mappings."""
    # Ensure role is from allowed spec list
    allowed_roles = ["Super Admin", "Admin", "Engineer", "Technician", "Viewer"]
    if schema.role not in allowed_roles:
        raise AppException(
            message=f"Invalid role category. Must be one of: {', '.join(allowed_roles)}",
            status_code=400,
            error_code="INVALID_ROLE"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(message="Target account not found.", status_code=404, error_code="USER_NOT_FOUND")
        
    user.role = schema.role
    db.commit()
    db.refresh(user)
    
    logger.info("user_role_modified_by_admin", user_id=user.id, email=user.email, new_role=user.role)
    return user

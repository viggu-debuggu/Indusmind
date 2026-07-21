from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_user
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import AppException
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserChangePassword
from app.core.logging import logger

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile context for currently authenticated session user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    schema: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user corporate contact information."""
    update_data = schema.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    
    logger.info("user_profile_updated", user_id=current_user.id, email=current_user.email)
    return current_user


@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    schema: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Safely updates security credentials verifying former password context."""
    if not verify_password(schema.old_password, current_user.password_hash):
        raise AppException(
            message="Former password verification context failed.",
            status_code=400,
            error_code="INVALID_OLD_PASSWORD"
        )
        
    current_user.password_hash = get_password_hash(schema.new_password)
    db.commit()
    
    logger.info("user_password_changed", user_id=current_user.id, email=current_user.email)
    return {"message": "Credentials updated successfully."}

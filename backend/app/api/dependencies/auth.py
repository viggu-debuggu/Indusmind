from typing import List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_jwt_token
from app.core.exceptions import AppException, AuthenticationException
from app.database.session import get_db
from app.models.user import User

# Standard OAuth2 scheme pointing to token path
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login",
    auto_error=False
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency injector checking header JWT and fetching user from DB."""
    if not token:
        raise AuthenticationException("Credentials token parameter missing.")

    try:
        payload = decode_jwt_token(token)
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if not user_id_str or token_type != "access":
            raise AuthenticationException("Access token signature is invalid.")
            
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise AuthenticationException("Failed to decrypt authorization signature.")

    # Fetch user metadata
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationException("User matching authentication key not found.")
        
    if not user.is_active:
        raise AppException(
            message="User session is currently deactivated.",
            status_code=401,
            error_code="USER_DEACTIVATED"
        )
        
    return user


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Dependency injector that returns user if authenticated, or None if token missing/invalid."""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except Exception:
        return None



async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency requiring user email verification state."""
    if not current_user.is_verified:
        raise AppException(
            message="Please verify your email address to unlock permissions.",
            status_code=403,
            error_code="EMAIL_NOT_VERIFIED"
        )
    return current_user


class RoleChecker:
    """FastAPI dependency factory enforcing Role-Based Access Control."""
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise AppException(
                message="Insufficient security access credentials.",
                status_code=403,
                error_code="INSUFFICIENT_PERMISSIONS"
            )
        return current_user

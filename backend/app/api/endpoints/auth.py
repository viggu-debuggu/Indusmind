import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_jwt_token
)
from app.core.exceptions import AppException, AuthenticationException
from app.database.session import get_db
from app.models.user import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest
)
from app.utils.email import email_service
from app.core.logging import logger

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(schema: UserRegister, db: Session = Depends(get_db)):
    """Creates a new user account, registers a verification node, and issues JWT session tokens."""
    # Check duplicate
    existing_user = db.query(User).filter(User.email == schema.email).first()
    if existing_user:
        raise AppException(
            message="An account with this email address already exists.",
            status_code=400,
            error_code="EMAIL_ALREADY_REGISTERED"
        )

    user_count = db.query(User).count()
    if user_count == 0:
        assigned_role = "Super Admin"
    else:
        assigned_role = schema.role or "Viewer"

    # Create user
    db_user = User(
        full_name=schema.full_name,
        email=schema.email,
        password_hash=get_password_hash(schema.password),
        company=schema.company,
        department=schema.department,
        job_title=schema.job_title,
        role=assigned_role,
        is_active=True,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create verification token
    verification_token = str(uuid.uuid4())
    db_ver = EmailVerificationToken(
        user_id=db_user.id,
        token=verification_token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(db_ver)
    db.commit()

    # Dispatch welcome & verification emails
    email_service.send_welcome_email(db_user.email, db_user.full_name)
    email_service.send_verification_email(db_user.email, verification_token)

    # Generate session tokens
    access = create_access_token(db_user.id)
    refresh = create_refresh_token(db_user.id)

    # Log token in database
    db_refresh = RefreshToken(
        user_id=db_user.id,
        token_hash=refresh,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(db_refresh)
    db.commit()

    logger.info("user_registered_successfully", email=db_user.email, user_id=db_user.id, role=db_user.role)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=TokenResponse)
def login_user(schema: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns secure token payload."""
    db_user = db.query(User).filter(User.email == schema.email).first()
    if not db_user or not verify_password(schema.password, db_user.password_hash):
        raise AuthenticationException("Invalid email credentials or password.")

    if not db_user.is_active:
        raise AppException(
            message="Your account is deactivated.",
            status_code=401,
            error_code="ACCOUNT_DEACTIVATED"
        )

    # Update last login
    db_user.last_login = datetime.utcnow()
    db.commit()

    # Generate tokens
    access = create_access_token(db_user.id)
    refresh = create_refresh_token(db_user.id)

    # Record refresh token
    db_refresh = RefreshToken(
        user_id=db_user.id,
        token_hash=refresh,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(db_refresh)
    db.commit()

    # Audit log the login
    from app.services.audit_service import AuditService
    AuditService.log(db, db_user.id, "LOGIN", "User", db_user.id, {"email": db_user.email})

    logger.info("user_logged_in", email=db_user.email, user_id=db_user.id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout_user(schema: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Terminates session and invalidates refresh tokens."""
    token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == schema.refresh_token).first()
    if token_record:
        from app.services.audit_service import AuditService
        AuditService.log(db, token_record.user_id, "LOGOUT", "User", token_record.user_id)
        db.delete(token_record)
        db.commit()
    return {"message": "Session invalidated successfully."}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(schema: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Performs token rotation to issue fresh access tokens."""
    try:
        payload = decode_jwt_token(schema.refresh_token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id_str or token_type != "refresh":
            raise AuthenticationException("Invalid token type signature.")
            
        user_id = int(user_id_str)
    except Exception:
        raise AuthenticationException("Invalid refresh token signature.")

    # Check database presence
    stored_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == schema.refresh_token,
        RefreshToken.user_id == user_id,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()

    if not stored_token:
        raise AuthenticationException("Refresh token was invalidated or expired.")

    # Remove used refresh token
    db.delete(stored_token)

    # Fetch user
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user or not db_user.is_active:
        db.commit()
        raise AuthenticationException("User is inactive or not found.")

    # Generate new tokens
    access = create_access_token(db_user.id)
    refresh = create_refresh_token(db_user.id)

    # Save new refresh token
    new_refresh = RefreshToken(
        user_id=db_user.id,
        token_hash=refresh,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(new_refresh)
    db.commit()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(schema: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates password recovery email link."""
    db_user = db.query(User).filter(User.email == schema.email).first()
    if not db_user:
        # Avoid user enum: return success even if user not found for security.
        return {"message": "Recovery token generated successfully."}

    # Clean old reset tokens
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == db_user.id).delete()

    reset_token = str(uuid.uuid4())
    db_reset = PasswordResetToken(
        user_id=db_user.id,
        token=reset_token,
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(db_reset)
    db.commit()

    email_service.send_password_reset_email(db_user.email, reset_token)
    return {"message": "Recovery token generated successfully."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(schema: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Applies recovery token to establish new password credentials."""
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == schema.token,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_record:
        raise AppException(
            message="Recovery token is invalid or expired.",
            status_code=400,
            error_code="INVALID_RESET_TOKEN"
        )

    # Fetch user & update hash
    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise AppException(message="User not found", status_code=404)

    user.password_hash = get_password_hash(schema.new_password)
    
    # Delete reset token and all active refresh tokens (force relogin)
    db.delete(reset_record)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
    db.commit()

    logger.info("password_reset_successfully", email=user.email, user_id=user.id)
    return {"message": "Credentials updated successfully."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(schema: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Checks verification token parameters to unlock account status."""
    ver_record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == schema.token,
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()

    if not ver_record:
        raise AppException(
            message="Verification link is invalid or has expired.",
            status_code=400,
            error_code="INVALID_VERIFICATION_TOKEN"
        )

    user = db.query(User).filter(User.id == ver_record.user_id).first()
    if not user:
        raise AppException(message="User not found", status_code=404)

    user.is_verified = True
    db.delete(ver_record)
    db.commit()

    logger.info("email_verified_successfully", email=user.email, user_id=user.id)
    return {"message": "Account verified successfully."}

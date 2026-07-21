import pytest
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token, decode_jwt_token
from app.api.dependencies.auth import RoleChecker
from app.core.exceptions import AppException

# Setup testing in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db")
def db_fixture():
    """Provides a fresh database session for each test case."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_password_hashing():
    """Tests password hashing and verification."""
    password = "SuperSecretPassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_jwt_token_operations():
    """Tests JWT creation, payload signature, and decoding."""
    user_id = 42
    access_token = create_access_token(user_id, expires_delta=timedelta(minutes=5))
    
    payload = decode_jwt_token(access_token)
    assert payload.get("sub") == str(user_id)
    assert payload.get("type") == "access"
    assert "exp" in payload


def test_user_registration_model(db):
    """Tests User record creation and database defaults."""
    hashed_pwd = get_password_hash("password123")
    user = User(
        full_name="Technician User",
        email="tech@indusmind.ai",
        password_hash=hashed_pwd,
        company="Indusmind",
        role="Technician",
        is_active=True,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.role == "Technician"
    assert user.is_verified is False
    assert user.is_active is True


def test_role_checker_dependency():
    """Tests RoleChecker Enforcements."""
    mock_engineer = User(full_name="Engineer User", email="eng@indusmind.ai", role="Engineer", is_active=True)
    mock_viewer = User(full_name="Viewer User", email="view@indusmind.ai", role="Viewer", is_active=True)
    
    checker = RoleChecker(allowed_roles=["Admin", "Engineer"])
    
    # 1. Allowed role passes
    checked_user = checker(current_user=mock_engineer)
    assert checked_user == mock_engineer
    
    # 2. Denied role raises insufficiency AppException
    with pytest.raises(AppException) as exc_info:
        checker(current_user=mock_viewer)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.error_code == "INSUFFICIENT_PERMISSIONS"

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


def to_camel(string: str) -> str:
    """Helper to convert snake_case strings to camelCase."""
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CustomBaseModel(BaseModel):
    """Base Pydantic model configuring camelCase serialization compatibility."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class UserRegister(CustomBaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=3, max_length=100)
    company: str = Field(..., min_length=2, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field(None, max_length=50)
    password: str = Field(..., min_length=6, max_length=50)

    @field_validator("email")
    @classmethod
    def validate_email_pattern(cls, v: str) -> str:
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class UserLogin(CustomBaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_pattern(cls, v: str) -> str:
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", v):
            raise ValueError("Invalid email format")
        return v



class UserUpdate(CustomBaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    company: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)


class UserChangePassword(CustomBaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=50)


class UserResponse(CustomBaseModel):
    id: int
    uuid: str
    email: str
    full_name: str
    company: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenResponse(CustomBaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefreshRequest(CustomBaseModel):
    refresh_token: str


class ForgotPasswordRequest(CustomBaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_pattern(cls, v: str) -> str:
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", v):
            raise ValueError("Invalid email format")
        return v


class ResetPasswordRequest(CustomBaseModel):

    token: str
    new_password: str = Field(..., min_length=6, max_length=50)


class VerifyEmailRequest(CustomBaseModel):
    token: str


class AdminUserRoleUpdate(CustomBaseModel):
    role: str  # "Super Admin", "Admin", "Engineer", "Technician", "Viewer"

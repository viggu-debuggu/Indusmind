import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Organization(Base):
    """Represents a tenant organization (e.g. ABC Chemicals) in the industrial platform."""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    plants = relationship("Plant", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")
    grants = relationship("UserOrganizationGrant", back_populates="organization", cascade="all, delete-orphan")


class Plant(Base):
    """Represents a specific industrial facility (e.g. Visakhapatnam Plant)."""
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="plants")
    departments = relationship("Department", back_populates="plant", cascade="all, delete-orphan")


class Department(Base):
    """Represents a department/division within a plant (e.g. Utilities Department)."""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    plant = relationship("Plant", back_populates="departments")
    workspaces = relationship("Workspace", back_populates="department", cascade="all, delete-orphan")
    users = relationship("User", back_populates="department_rel")


class UserOrganizationGrant(Base):
    """Enables Super Admins to gain access permission to specific customer organizations."""
    __tablename__ = "user_organization_grants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="grants")
    user = relationship("User")

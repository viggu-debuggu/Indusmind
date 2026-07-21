import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base


class AuditLog(Base):
    """Immutable audit trail tracking all user actions across the platform."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    action = Column(String(100), nullable=False, index=True)
    # Actions: LOGIN, LOGOUT, REGISTER, UPLOAD_DOCUMENT, DELETE_DOCUMENT, UPDATE_DOCUMENT,
    #          CREATE_EQUIPMENT, UPDATE_EQUIPMENT, AI_QUERY, ROLE_CHANGE, ACTIVATE_USER,
    #          DEACTIVATE_USER, CREATE_INCIDENT, UPDATE_INCIDENT, DELETE_INCIDENT,
    #          CREATE_WORKSPACE, DELETE_WORKSPACE, COMPLIANCE_SCAN

    resource_type = Column(String(100), nullable=True)  # User, Document, Equipment, Incident, Workspace, etc.
    resource_id = Column(String(100), nullable=True)     # ID of the affected resource
    details = Column(JSON, nullable=True)                # Additional context (JSON)
    ip_address = Column(String(45), nullable=True)       # IPv4 or IPv6

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User")

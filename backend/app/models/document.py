import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class DocumentModel(Base):
    """SQLAlchemy model representing industrial document assets and versioned metadata."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    document_name = Column(String(255), index=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), unique=True, nullable=False)
    file_extension = Column(String(20), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    # Storage details
    storage_provider = Column(String(50), default="local", nullable=False)
    storage_path = Column(String(512), nullable=False)
    
    # Audit & Location metadata
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(100), index=True, nullable=True)      # e.g., SOP, Manual, Drawing
    department = Column(String(100), index=True, nullable=True)    # e.g., Operations, Maintenance
    plant_location = Column(String(100), index=True, nullable=True) # e.g., Plant A, Room 2B
    description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)                      # Comma-separated tags
    
    # AI Extracted Metadata
    asset_id = Column(Integer, ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True)
    asset_tag = Column(String(100), index=True, nullable=True)
    equipment_name = Column(String(255), nullable=True)
    equipment_type = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model_number = Column(String(100), nullable=True)
    plant = Column(String(100), nullable=True)
    revision = Column(String(50), nullable=True)
    document_type = Column(String(100), nullable=True)
    date = Column(String(50), nullable=True)
    criticality = Column(String(50), nullable=True)
    keywords = Column(String(512), nullable=True)
    
    # Statuses
    # Status values: "Draft", "Uploaded", "Archived", "Deleted"
    status = Column(String(50), default="Uploaded", nullable=False)
    # Processing status values: "Pending", "Ready", "Processing", "Completed", "Failed"
    processing_status = Column(String(50), default="Pending", nullable=False)
    
    # Versioning & Approval Workflows
    version_group_id = Column(String(36), index=True, nullable=True)
    is_current = Column(Boolean, default=True, nullable=False)
    approval_status = Column(String(50), default="Uploaded", nullable=False) # Uploaded, Pending Review, Engineer Approved, Manager Approved, Published
    
    # Version history (Logical versions: 1, 2, 3, etc.)
    version = Column(Integer, default=1, nullable=False)
    checksum = Column(String(64), nullable=True)                   # SHA-256 hash for duplicate check
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    uploader = relationship("User")
    asset = relationship("Equipment", back_populates="documents")

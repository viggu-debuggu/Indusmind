import uuid
from datetime import datetime
from sqlalchemy import Table, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

# Association table for Workspace <-> DocumentModel (many-to-many)
workspace_documents = Table(
    "workspace_documents",
    Base.metadata,
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True),
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
)

class Workspace(Base):
    """SQLAlchemy model representing isolated user document partitions (Workspaces)."""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User")
    department = relationship("Department", back_populates="workspaces")
    documents = relationship("DocumentModel", secondary=workspace_documents, backref="workspaces")

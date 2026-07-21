import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Regulation(Base):
    """Represents a regulatory framework standard (e.g. Factory Act, OISD, PESO, ISO)."""
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    name = Column(String(255), unique=True, index=True, nullable=False) # e.g. "Factory Act Section 21"
    authority = Column(String(100), nullable=False) # e.g. "PESO", "OISD", "ISO"
    description = Column(Text, nullable=True)
    clause_text = Column(Text, nullable=False) # Full description of legal requirements
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ComplianceAudit(Base):
    """Tracks audits comparing internal SOP documents against state regulations."""
    __tablename__ = "compliance_audits"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    regulation_id = Column(Integer, ForeignKey("regulations.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String(50), default="Pending", nullable=False) # Compliant, Non-Compliant, Warnings, Pending
    findings = Column(Text, nullable=True) # AI analysis detail
    gaps_detected = Column(Text, nullable=True)
    audit_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("DocumentModel")
    regulation = relationship("Regulation")

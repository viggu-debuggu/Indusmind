import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class KnowledgeTwin(Base):
    """
    SQLAlchemy model representing the 360-degree Digital Knowledge Twin for an asset.
    Aggregates operational summaries, top risks, action protocols, AI readiness ratings,
    and spare parts data.
    """
    __tablename__ = "knowledge_twin"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    operational_summary = Column(Text, nullable=False)
    top_risks = Column(Text, nullable=False)
    recommended_actions = Column(Text, nullable=False)
    missing_knowledge = Column(Text, nullable=False)
    
    compliance_readiness = Column(String(50), default="Compliant", nullable=False)
    maintenance_readiness = Column(String(50), default="Optimal", nullable=False)
    operational_confidence = Column(Float, default=92.5, nullable=False)
    business_impact = Column(Text, nullable=False)
    spare_parts = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment")
    health = relationship("KnowledgeHealth", back_populates="twin", uselist=False, cascade="all, delete-orphan")


class KnowledgeHealth(Base):
    """
    SQLAlchemy model storing the 7 documentation/intelligence coverage metrics 
    and the calculated Overall Knowledge Health Score for an asset twin.
    """
    __tablename__ = "knowledge_health"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    twin_id = Column(Integer, ForeignKey("knowledge_twin.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    documentation_coverage = Column(Float, default=80.0, nullable=False)
    inspection_coverage = Column(Float, default=85.0, nullable=False)
    maintenance_coverage = Column(Float, default=90.0, nullable=False)
    expert_knowledge_coverage = Column(Float, default=70.0, nullable=False)
    compliance_coverage = Column(Float, default=95.0, nullable=False)
    incident_coverage = Column(Float, default=85.0, nullable=False)
    recommendation_coverage = Column(Float, default=90.0, nullable=False)
    
    overall_health_score = Column(Float, default=85.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    twin = relationship("KnowledgeTwin", back_populates="health")


class AssetComparison(Base):
    """
    SQLAlchemy model storing saved side-by-side comparative matrices between two Digital Twins.
    """
    __tablename__ = "asset_comparison"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    asset1_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    asset2_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    
    comparison_metrics = Column(Text, nullable=False) # Serialized JSON payload
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    asset1 = relationship("Equipment", foreign_keys=[asset1_id])
    asset2 = relationship("Equipment", foreign_keys=[asset2_id])


class TwinSnapshot(Base):
    """
    SQLAlchemy model storing historical performance & AI readiness snapshots for an asset twin.
    """
    __tablename__ = "twin_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    health_score = Column(Float, default=100.0, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    knowledge_score = Column(Float, default=85.0, nullable=False)
    snapshot_data = Column(Text, nullable=False) # JSON payload
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment")

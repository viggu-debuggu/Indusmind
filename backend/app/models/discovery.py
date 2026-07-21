import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.session import Base

class DiscoveryFinding(Base):
    """
    SQLAlchemy model representing general AI-discovered insights across the industrial plant.
    Includes business impact, confidence score, affected assets, evidence, recommended actions,
    and priority ratings as required by Phase 11 specs.
    """
    __tablename__ = "discovery_findings"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=False)
    confidence_score = Column(Float, default=90.0, nullable=False)
    affected_assets = Column(Text, nullable=False) # Comma-separated list of asset tags (e.g. "PUMP-P102, TURBINE-T203")
    evidence = Column(Text, nullable=False)
    priority = Column(String(50), default="Medium", nullable=False) # Critical, High, Medium, Low
    recommended_actions = Column(Text, nullable=False)
    expected_savings = Column(Float, default=0.0, nullable=False)
    
    finding_type = Column(String(100), nullable=False) # Hidden Pattern, Knowledge Gap, Compliance Risk, Optimization, Emerging Risk
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PatternRelationship(Base):
    """
    SQLAlchemy model tracking failure pattern associations, clusters, and sequences.
    """
    __tablename__ = "pattern_relationships"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    pattern_type = Column(String(100), nullable=False) # e.g. Repeated Failure, Seasonal Failure, Equipment Cluster, Failure Sequence
    description = Column(Text, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    correlated_equipment_ids = Column(Text, nullable=True) # Comma-separated list of equipment IDs or tags
    
    failure_count = Column(Integer, default=0, nullable=False)
    correlation_coefficient = Column(Float, default=1.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    equipment = relationship("Equipment")


class KnowledgeGapRecord(Base):
    """
    SQLAlchemy model representing specific missing documentation, manuals, SOPs, RCAs or tribal knowledge.
    """
    __tablename__ = "knowledge_gap_records"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    gap_type = Column(String(100), nullable=False) # No SOP, Missing Inspection, Missing RCA, Missing Expert Memory, Missing Manual
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="Medium", nullable=False) # Critical, High, Medium, Low
    completeness_score = Column(Float, default=100.0, nullable=False) # Health metric for equipment (0-100)
    recommended_action = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    equipment = relationship("Equipment")


class OptimizationOpportunity(Base):
    """
    SQLAlchemy model tracking proposed operational or maintenance adjustments to save downtime or costs.
    """
    __tablename__ = "optimization_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    opportunity_type = Column(String(100), nullable=False) # Maintenance, Inspection, Downtime Reduction, Resource, Spare Inventory, Shutdown
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    estimated_savings = Column(Float, default=0.0, nullable=False)
    priority = Column(String(50), default="Medium", nullable=False)
    confidence = Column(Float, default=90.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    equipment = relationship("Equipment")


class RiskDiscovery(Base):
    """
    SQLAlchemy model tracking emerging telemetry risks, critical wear and compliance anomalies.
    """
    __tablename__ = "risk_discovery"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    risk_type = Column(String(100), nullable=False) # Compliance, Telemetry Anomaly, Near Miss, Asset Degradation, Audit Risk
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    confidence_score = Column(Float, default=90.0, nullable=False)
    priority = Column(String(50), default="Medium", nullable=False)
    business_impact = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    equipment = relationship("Equipment")

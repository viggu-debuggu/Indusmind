import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class DecisionRecommendation(Base):
    """SQLAlchemy model representing AI decision recommendations generated from sensors, logs, and manuals."""
    __tablename__ = "decision_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    recommendation_type = Column(String(100), nullable=False) # e.g. Preventive Maintenance, Calibration, Safety Action
    severity = Column(String(50), nullable=False) # Critical, High, Medium, Low
    risk_score = Column(Float, default=0.0, nullable=False)
    priority = Column(String(50), nullable=False) # Critical, High, Medium, Low
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    expected_benefit = Column(Text, nullable=False)
    
    estimated_cost = Column(Float, default=0.0, nullable=False)
    estimated_downtime = Column(Float, default=0.0, nullable=False)
    failure_probability = Column(Float, default=0.0, nullable=False)
    confidence_score = Column(Float, default=100.0, nullable=False)
    
    generated_by = Column(String(100), default="AI Reasoner", nullable=False)
    status = Column(String(50), default="Pending", nullable=False) # Pending, Approved, Rejected, Implemented
    approved_by = Column(String(105), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment")
    plant = relationship("Plant")
    department = relationship("Department")
    evidence = relationship("DecisionEvidence", back_populates="recommendation", cascade="all, delete-orphan")


class DecisionEvidence(Base):
    """SQLAlchemy model representing granular supporting telemetry, manual context, or incidents links."""
    __tablename__ = "decision_evidence"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("decision_recommendations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    evidence_type = Column(String(100), nullable=False) # Telemetry, Incident, Expert Knowledge, Document, Knowledge Graph
    reference_id = Column(String(100), nullable=True)
    source_name = Column(String(255), nullable=False) # e.g. "OEM Section 4.2", "Incident #451"
    confidence = Column(Float, default=100.0, nullable=False)
    summary = Column(Text, nullable=False)
    
    # Relationships
    recommendation = relationship("DecisionRecommendation", back_populates="evidence")

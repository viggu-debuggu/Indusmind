import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database.session import Base

class ExpertKnowledge(Base):
    """SQLAlchemy model representing tribal expert experiences, recommendations and dynamic mappings."""
    __tablename__ = "expert_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    author = Column(String(255), nullable=False)
    author_role = Column(String(100), nullable=False)
    
    # Hierarchy references
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)

    category = Column(String(100), nullable=False) # Mechanical, Electrical, Process, Operational, Safety
    failure_mode = Column(String(255), nullable=True)
    root_cause = Column(Text, nullable=True)
    maintenance_type = Column(String(100), nullable=True)
    safety_risk = Column(String(100), nullable=True)
    process_stage = Column(String(100), nullable=True)
    weather_condition = Column(String(100), nullable=True)

    confidence_score = Column(Float, default=100.0, nullable=False)
    ai_summary = Column(Text, nullable=True)
    ai_keywords = Column(Text, nullable=True) # Comma-separated
    ai_entities = Column(Text, nullable=True) # Comma-separated

    # pgvector embedding
    embedding = Column(Vector(384), nullable=True)

    verification_status = Column(String(50), default="Pending", nullable=False) # Pending, Approved, Rejected
    verified_by = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    plant = relationship("Plant")
    department = relationship("Department")
    equipment = relationship("Equipment")

import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database.session import Base

class IncidentRecord(Base):
    """Stores lessons learned from past operational failures, incidents, and maintenance work orders."""
    __tablename__ = "incident_records"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    incident_name = Column(String(255), nullable=False)
    severity = Column(String(50), default="Medium", nullable=False)  # Critical, High, Medium, Low
    status = Column(String(50), default="Open", nullable=False)  # Open, Investigating, Resolved, Closed
    category = Column(String(100), default="Mechanical", nullable=False)  # Safety, Mechanical, Electrical, Process, Environmental
    incident_date = Column(Date, default=datetime.utcnow, nullable=False)

    cause = Column(Text, nullable=False)
    resolution = Column(Text, nullable=False)
    prevention = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment")
    reporter = relationship("User", foreign_keys=[reported_by])

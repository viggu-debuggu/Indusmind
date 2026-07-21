import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class Equipment(Base):
    """SQLAlchemy model representing industrial machinery assets and operating scores."""
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String(255), nullable=False)
    asset_tag = Column(String(100), unique=True, index=True, nullable=False)
    plant = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    installation_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="Operational", nullable=False) # Operational, Degraded, Maintenance
    running_hours = Column(Float, default=0.0, nullable=False)
    last_maintenance_date = Column(DateTime, nullable=True)
    next_maintenance_date = Column(DateTime, nullable=True)
    remaining_useful_life = Column(Float, default=20000.0, nullable=False)
    health_score = Column(Float, default=100.0, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    
    # Hierarchy and Incident logs
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True)
    failure_history = Column(Text, nullable=True)
    inspection_reports = Column(Text, nullable=True)
    open_work_orders = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace")
    documents = relationship("DocumentModel", back_populates="asset")
    sensor_readings = relationship("SensorReading", back_populates="equipment", cascade="all, delete-orphan")
    predictions = relationship("MaintenancePrediction", back_populates="equipment", cascade="all, delete-orphan")


class SensorReading(Base):
    """SQLAlchemy model representing historical telemetry readings for equipment."""
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    rpm = Column(Float, nullable=False)
    voltage = Column(Float, nullable=False)
    current = Column(Float, nullable=False)
    oil_level = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    runtime_hours = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment", back_populates="sensor_readings")


class MaintenancePrediction(Base):
    """SQLAlchemy model representing AI generated failure predictions and RUL calculations."""
    __tablename__ = "maintenance_predictions"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_failure = Column(String(255), nullable=False)
    failure_probability = Column(Float, nullable=False)
    remaining_useful_life = Column(Float, nullable=False)
    maintenance_priority = Column(String(50), nullable=False)
    suggested_maintenance_date = Column(DateTime, nullable=False)
    confidence_score = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment", back_populates="predictions")

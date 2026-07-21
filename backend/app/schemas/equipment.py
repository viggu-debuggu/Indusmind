from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import CustomBaseModel

class SensorReadingBase(CustomBaseModel):
    temperature: float
    pressure: float
    vibration: float
    rpm: float
    voltage: float
    current: float
    oil_level: float
    humidity: float
    runtime_hours: float

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    equipment_id: int
    timestamp: datetime


class MaintenancePredictionBase(CustomBaseModel):
    predicted_failure: str
    failure_probability: float
    remaining_useful_life: float
    maintenance_priority: str
    suggested_maintenance_date: datetime
    confidence_score: float

class MaintenancePredictionResponse(MaintenancePredictionBase):
    id: int
    equipment_id: int
    timestamp: datetime


class EquipmentBase(CustomBaseModel):
    asset_name: str
    asset_tag: str
    plant: str
    department: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    installation_date: datetime
    status: str = "Operational"
    running_hours: float = 0.0
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    remaining_useful_life: float = 20000.0
    health_score: float = 100.0
    risk_score: float = 0.0

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(CustomBaseModel):
    asset_name: Optional[str] = None
    plant: Optional[str] = None
    department: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    running_hours: Optional[float] = None
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    remaining_useful_life: Optional[float] = None
    health_score: Optional[float] = None
    risk_score: Optional[float] = None

class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    latest_reading: Optional[SensorReadingResponse] = None


class EquipmentHealthResponse(CustomBaseModel):
    id: int
    asset_name: str
    asset_tag: str
    status: str
    health_score: float
    risk_score: float
    remaining_useful_life: float
    running_hours: float
    latest_reading: Optional[SensorReadingResponse] = None
    predictions_history: List[MaintenancePredictionResponse] = []


class RCACitation(BaseModel):
    source_document: str
    page: int
    section: Optional[str] = None


class RCAResponse(BaseModel):
    possible_cause: str
    confidence: float
    evidence: str
    similar_failures: str
    recommended_actions: str
    citations: List[RCACitation] = []

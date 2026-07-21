from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class IncidentCreate(BaseModel):
    equipment_id: int
    incident_name: str = Field(min_length=3, max_length=255)
    severity: str = Field(default="Medium", pattern="^(Critical|High|Medium|Low)$")
    status: str = Field(default="Open", pattern="^(Open|Investigating|Resolved|Closed)$")
    category: str = Field(default="Mechanical", pattern="^(Safety|Mechanical|Electrical|Process|Environmental)$")
    incident_date: Optional[date] = None
    cause: str = Field(min_length=5)
    resolution: str = Field(min_length=5)
    prevention: str = Field(min_length=5)
    recommendations: str = Field(min_length=5)


class IncidentUpdate(BaseModel):
    incident_name: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    incident_date: Optional[date] = None
    cause: Optional[str] = None
    resolution: Optional[str] = None
    prevention: Optional[str] = None
    recommendations: Optional[str] = None


class EquipmentRef(BaseModel):
    id: int
    asset_name: str
    asset_tag: str


class ReporterRef(BaseModel):
    id: int
    full_name: str
    email: str


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    equipment_id: int
    reported_by: Optional[int]
    incident_name: str
    severity: str
    status: str
    category: str
    incident_date: Optional[date]
    cause: str
    resolution: str
    prevention: str
    recommendations: str
    created_at: datetime
    updated_at: datetime
    equipment: Optional[EquipmentRef] = None
    reporter: Optional[ReporterRef] = None


class IncidentStatsResponse(BaseModel):
    total: int
    open: int
    investigating: int
    resolved: int
    closed: int
    critical: int
    high: int
    medium: int
    low: int

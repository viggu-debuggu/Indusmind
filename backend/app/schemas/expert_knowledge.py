from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RefPlant(BaseModel):
    id: int
    name: str
    location: Optional[str] = None


class RefDepartment(BaseModel):
    id: int
    name: str


class RefEquipment(BaseModel):
    id: int
    asset_name: str
    asset_tag: str
    status: str
    health_score: float


class ExpertKnowledgeCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    author: str = Field(min_length=2, max_length=255)
    author_role: str = Field(min_length=2, max_length=100)
    plant_id: Optional[int] = None
    department_id: Optional[int] = None
    equipment_id: Optional[int] = None
    category: str = Field(default="Mechanical", pattern="^(Mechanical|Electrical|Process|Operational|Safety)$")
    failure_mode: Optional[str] = None
    root_cause: Optional[str] = None
    maintenance_type: Optional[str] = None
    safety_risk: Optional[str] = None
    process_stage: Optional[str] = None
    weather_condition: Optional[str] = None
    verification_status: Optional[str] = "Pending"
    verified_by: Optional[str] = None


class ExpertKnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    author_role: Optional[str] = None
    plant_id: Optional[int] = None
    department_id: Optional[int] = None
    equipment_id: Optional[int] = None
    category: Optional[str] = None
    failure_mode: Optional[str] = None
    root_cause: Optional[str] = None
    maintenance_type: Optional[str] = None
    safety_risk: Optional[str] = None
    process_stage: Optional[str] = None
    weather_condition: Optional[str] = None
    verification_status: Optional[str] = None
    verified_by: Optional[str] = None


class ExpertKnowledgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    title: str
    description: str
    author: str
    author_role: str
    plant_id: Optional[int]
    department_id: Optional[int]
    equipment_id: Optional[int]
    category: str
    failure_mode: Optional[str]
    root_cause: Optional[str]
    maintenance_type: Optional[str]
    safety_risk: Optional[str]
    process_stage: Optional[str]
    weather_condition: Optional[str]
    confidence_score: float
    ai_summary: Optional[str]
    ai_keywords: Optional[str]
    ai_entities: Optional[str]
    verification_status: str
    verified_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    plant: Optional[RefPlant] = None
    department: Optional[RefDepartment] = None
    equipment: Optional[RefEquipment] = None


class KnowledgeGapArea(BaseModel):
    topic: str
    entries_count: int
    gap_priority: str # High, Medium, Low


class ExpertKnowledgeStatsResponse(BaseModel):
    total_entries: int
    verified_entries: int
    pending_entries: int
    growth_rate_pct: float
    reuse_rate_pct: float
    categories_breakdown: Dict[str, int]
    top_contributors: List[Dict[str, Any]]
    knowledge_gap_areas: List[KnowledgeGapArea]
    top_failure_topics: List[Dict[str, Any]]

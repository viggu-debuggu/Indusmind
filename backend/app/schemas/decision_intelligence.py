from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.expert_knowledge import RefPlant, RefDepartment, RefEquipment


class DecisionEvidenceResponse(BaseModel):
    id: int
    recommendation_id: int
    evidence_type: str
    reference_id: Optional[str] = None
    source_name: str
    confidence: float
    summary: str

    class Config:
        from_attributes = True


class DecisionRecommendationResponse(BaseModel):
    id: int
    uuid: str
    equipment_id: Optional[int] = None
    plant_id: Optional[int] = None
    department_id: Optional[int] = None
    recommendation_type: str
    severity: str
    risk_score: float
    priority: str
    title: str
    description: str
    recommended_action: str
    expected_benefit: str
    estimated_cost: float
    estimated_downtime: float
    failure_probability: float
    confidence_score: float
    generated_by: str
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    plant: Optional[RefPlant] = None
    department: Optional[RefDepartment] = None
    equipment: Optional[RefEquipment] = None
    evidence: List[DecisionEvidenceResponse] = []

    class Config:
        from_attributes = True


class DecisionRecommendationUpdate(BaseModel):
    status: str = Field(pattern="^(Pending|Approved|Rejected|Implemented)$")


class DecisionStatsResponse(BaseModel):
    total_recommendations: int
    critical_assets_count: int
    highest_risk_score: float
    recommendations_accepted: int
    recommendations_pending: int
    savings_generated_usd: float
    downtime_avoided_hrs: float
    acceptance_rate_pct: float
    average_confidence_pct: float
    risk_heatmap_data: List[Dict[str, Any]]

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import CustomBaseModel

class KnowledgeHealthResponse(CustomBaseModel):
    id: int
    uuid: str
    twin_id: int
    documentation_coverage: float
    inspection_coverage: float
    maintenance_coverage: float
    expert_knowledge_coverage: float
    compliance_coverage: float
    incident_coverage: float
    recommendation_coverage: float
    overall_health_score: float
    created_at: datetime
    updated_at: datetime


class KnowledgeTwinResponse(CustomBaseModel):
    id: int
    uuid: str
    equipment_id: int
    operational_summary: str
    top_risks: str
    recommended_actions: str
    missing_knowledge: str
    compliance_readiness: str
    maintenance_readiness: str
    operational_confidence: float
    business_impact: str
    spare_parts: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    health: Optional[KnowledgeHealthResponse] = None


class AssetComparisonResponse(CustomBaseModel):
    id: int
    uuid: str
    asset1_id: int
    asset2_id: int
    comparison_metrics: str
    created_at: datetime


class TwinSnapshotResponse(CustomBaseModel):
    id: int
    uuid: str
    equipment_id: int
    health_score: float
    risk_score: float
    knowledge_score: float
    snapshot_data: str
    created_at: datetime


class TwinAnalyticsResponse(CustomBaseModel):
    twin_coverage_pct: float
    knowledge_completeness: float
    twin_accuracy: float
    knowledge_growth_pct: float
    documentation_quality: float
    operational_readiness: float
    ai_confidence: float
    readiness_trend: List[float] = []


class TwinDetailResponse(CustomBaseModel):
    equipment: Dict[str, Any]
    twin: Optional[KnowledgeTwinResponse] = None
    health: Optional[KnowledgeHealthResponse] = None
    documents: List[Dict[str, Any]] = []
    telemetry_summary: Dict[str, Any] = {}
    maintenance_history: List[Dict[str, Any]] = []
    incidents: List[Dict[str, Any]] = []
    compliance: List[Dict[str, Any]] = []
    expert_knowledge: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []
    discovery_findings: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []
    spare_parts: List[Dict[str, Any]] = []
    related_assets: List[Dict[str, Any]] = []

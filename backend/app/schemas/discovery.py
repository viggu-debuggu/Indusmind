from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import CustomBaseModel

class DiscoveryFindingBase(CustomBaseModel):
    title: str
    summary: str
    business_impact: str
    confidence_score: float
    affected_assets: str
    evidence: str
    priority: str
    recommended_actions: str
    expected_savings: float
    finding_type: str

class DiscoveryFindingCreate(DiscoveryFindingBase):
    pass

class DiscoveryFindingResponse(DiscoveryFindingBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime


class PatternRelationshipBase(CustomBaseModel):
    title: str
    pattern_type: str
    description: str
    equipment_id: Optional[int] = None
    correlated_equipment_ids: Optional[str] = None
    failure_count: int
    correlation_coefficient: float

class PatternRelationshipResponse(PatternRelationshipBase):
    id: int
    uuid: str
    created_at: datetime


class KnowledgeGapRecordBase(CustomBaseModel):
    equipment_id: Optional[int] = None
    gap_type: str
    description: str
    severity: str
    completeness_score: float
    recommended_action: str

class KnowledgeGapRecordResponse(KnowledgeGapRecordBase):
    id: int
    uuid: str
    created_at: datetime


class OptimizationOpportunityBase(CustomBaseModel):
    equipment_id: Optional[int] = None
    opportunity_type: str
    title: str
    description: str
    estimated_savings: float
    priority: str
    confidence: float

class OptimizationOpportunityResponse(OptimizationOpportunityBase):
    id: int
    uuid: str
    created_at: datetime


class RiskDiscoveryBase(CustomBaseModel):
    equipment_id: Optional[int] = None
    risk_type: str
    title: str
    description: str
    confidence_score: float
    priority: str
    business_impact: str
    evidence: str

class RiskDiscoveryResponse(RiskDiscoveryBase):
    id: int
    uuid: str
    created_at: datetime


class DiscoveryAnalyticsResponse(CustomBaseModel):
    discovery_accuracy: float
    patterns_identified: int
    knowledge_growth_pct: float
    risk_reduction_pct: float
    optimization_savings: float
    compliance_improvements: int
    ai_discovery_confidence: float
    confidence_trend: List[float] = []

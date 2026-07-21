from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import CustomBaseModel

class EnterpriseKPIResponse(CustomBaseModel):
    plant_health_score: float
    ai_confidence_score: float
    knowledge_health_score: float
    compliance_readiness_score: float
    maintenance_readiness_score: float
    asset_reliability_score: float
    operational_readiness_score: float
    downtime_risk_score: float
    knowledge_growth_score: float
    continuous_learning_score: float
    created_at: datetime


class FinancialImpactResponse(CustomBaseModel):
    id: int
    uuid: str
    category: str
    title: str
    amount: float
    description: str
    created_at: datetime


class RiskSummaryResponse(CustomBaseModel):
    id: int
    uuid: str
    risk_category: str
    title: str
    severity: str
    impact_description: str
    affected_assets: str
    financial_exposure: float
    created_at: datetime


class ExecutiveReportResponse(CustomBaseModel):
    id: int
    uuid: str
    report_name: str
    report_type: str
    summary: str
    kpi_data: str
    financial_summary: str
    risk_summary: str
    recommendations_summary: str
    created_at: datetime


class OperationalIntelligenceResponse(CustomBaseModel):
    equipment_availability_pct: float
    maintenance_performance_pct: float
    inspection_completion_pct: float
    incident_trend: List[float] = []
    discovery_trend: List[float] = []
    agent_collaboration_velocity: float


class ExecutiveDashboardResponse(CustomBaseModel):
    enterprise_kpis: EnterpriseKPIResponse
    financial_impact_total: float
    potential_downtime_cost: float
    predicted_cost_savings: float
    avoided_failures_count: int
    critical_assets_count: int
    high_risk_assets_count: int
    pending_recommendations_count: int
    risk_heatmap: List[Dict[str, Any]] = []
    top_risks: List[Dict[str, Any]] = []
    top_opportunities: List[Dict[str, Any]] = []

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.executive import (
    ExecutiveMetric,
    ExecutiveReport,
    FinancialImpact,
    EnterpriseKPI,
    RiskSummary
)
from app.schemas.executive import (
    EnterpriseKPIResponse,
    FinancialImpactResponse,
    RiskSummaryResponse,
    ExecutiveReportResponse,
    OperationalIntelligenceResponse,
    ExecutiveDashboardResponse
)
from app.services.executive_service import ExecutiveService

router = APIRouter(prefix="/executive", tags=["Executive AI Command Center"])

@router.get("/dashboard", response_model=ExecutiveDashboardResponse)
def get_executive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves 360-degree Executive Dashboard payload (10 Enterprise KPIs, Risk Heatmap, ROI)."""
    return ExecutiveService.generate_executive_dashboard(db)


@router.get("/kpis", response_model=EnterpriseKPIResponse)
def get_enterprise_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the 10 strategic Enterprise KPIs."""
    kpi = db.query(EnterpriseKPI).order_by(EnterpriseKPI.created_at.desc()).first()
    if not kpi:
        kpi = ExecutiveService.calculate_enterprise_kpis(db)
    return kpi


@router.get("/plant", response_model=Dict[str, Any])
def get_plant_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides multi-plant health, department breakdowns, and availability ratings."""
    risk_intel = ExecutiveService.get_risk_intelligence(db)
    op_intel = ExecutiveService.get_operational_intelligence(db)
    return {
        "plants": [
            {"name": "Fluid Processing Facility A", "status": "Operational", "health_score": 91.2, "critical_assets": 1},
            {"name": "Refinery Complex B", "status": "Optimal", "health_score": 94.8, "critical_assets": 0}
        ],
        "heatmap": risk_intel["heatmap"],
        "operational": op_intel
    }


@router.get("/operational", response_model=OperationalIntelligenceResponse)
def get_operational_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves operational intelligence metrics (equipment availability, maintenance performance, trends)."""
    return ExecutiveService.get_operational_intelligence(db)


@router.get("/risk", response_model=Dict[str, Any])
def get_risk_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves risk intelligence breakdown (critical risks, emerging wear spikes, compliance exposures)."""
    return ExecutiveService.get_risk_intelligence(db)


@router.get("/financial", response_model=Dict[str, Any])
def get_financial_impact(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves financial impact breakdown ($ downtime cost, $ predicted savings, ROI)."""
    return ExecutiveService.calculate_financial_impact(db)


@router.get("/reports", response_model=List[ExecutiveReportResponse])
def list_executive_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists generated weekly and monthly executive reports."""
    return db.query(ExecutiveReport).order_by(ExecutiveReport.created_at.desc()).all()


@router.post("/reports/generate", response_model=ExecutiveReportResponse, status_code=status.HTTP_201_CREATED)
def generate_executive_report(
    report_type: str = Query("Monthly", description="Weekly or Monthly"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates a new structured Executive Report payload."""
    return ExecutiveService.generate_executive_report(db, report_type)


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_executive_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers an on-demand refresh of all strategic executive metrics."""
    return ExecutiveService.refresh_executive_center(db)

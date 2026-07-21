from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.equipment import Equipment
from app.models.twin import KnowledgeTwin
from app.schemas.twin import (
    KnowledgeTwinResponse,
    AssetComparisonResponse,
    TwinAnalyticsResponse,
    TwinDetailResponse
)
from app.services.twin_service import TwinService

router = APIRouter(prefix="/twin", tags=["Industrial Digital Knowledge Twin"])

@router.get("", response_model=List[Dict[str, Any]])
def list_asset_twins(
    q: Optional[str] = Query(None),
    plant: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists summary cards for all registered Digital Knowledge Twins."""
    equipment_query = db.query(Equipment)
    if plant:
        equipment_query = equipment_query.filter(Equipment.plant == plant)
    if department:
        equipment_query = equipment_query.filter(Equipment.department == department)
    if q:
        equipment_query = equipment_query.filter(
            Equipment.asset_name.ilike(f"%{q}%") |
            Equipment.asset_tag.ilike(f"%{q}%")
        )

    eq_list = equipment_query.all()
    twins_summary = []
    for eq in eq_list:
        try:
            twin_data = TwinService.build_360_twin(db, eq.id)
            twins_summary.append({
                "id": eq.id,
                "assetTag": eq.asset_tag,
                "assetName": eq.asset_name,
                "plant": eq.plant,
                "department": eq.department,
                "status": eq.status,
                "healthScore": eq.health_score,
                "riskScore": eq.risk_score,
                "knowledgeHealthScore": twin_data["health"]["overall_health_score"],
                "complianceReadiness": twin_data["twin"]["compliance_readiness"],
                "maintenanceReadiness": twin_data["twin"]["maintenance_readiness"],
                "operationalConfidence": twin_data["twin"]["operational_confidence"],
                "documentsCount": len(twin_data["documents"]),
                "incidentsCount": len(twin_data["incidents"])
            })
        except Exception as e:
            continue

    return twins_summary


@router.get("/analytics", response_model=TwinAnalyticsResponse)
def get_twin_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides platform-wide Digital Knowledge Twin readiness and coverage analytics."""
    return TwinService.get_twin_analytics(db)


@router.get("/compare", response_model=Dict[str, Any])
def compare_twins(
    asset1: str = Query(..., description="First equipment asset tag (e.g. PUMP-P102)"),
    asset2: str = Query(..., description="Second equipment asset tag (e.g. TURBINE-T203)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates side-by-side comparative matrices between two Digital Knowledge Twins."""
    try:
        return TwinService.compare_twins(db, asset1, asset2)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_all_twins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers an on-demand re-scan and aggregation of all Digital Knowledge Twins."""
    count = TwinService.refresh_all_twins(db)
    return {
        "status": "Success",
        "message": f"Successfully re-scanned and synchronized {count} Digital Knowledge Twins.",
        "count": count
    }


@router.get("/{asset_tag_or_id}", response_model=TwinDetailResponse)
def get_twin_detail(
    asset_tag_or_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full 360-degree Digital Knowledge Twin payload for a specific asset by ID or tag."""
    eq = None
    if asset_tag_or_id.isdigit():
        eq = db.query(Equipment).filter(Equipment.id == int(asset_tag_or_id)).first()
    else:
        eq = db.query(Equipment).filter(Equipment.asset_tag == asset_tag_or_id.upper()).first()

    if not eq:
        raise HTTPException(status_code=404, detail=f"Asset twin '{asset_tag_or_id}' not found.")

    return TwinService.build_360_twin(db, eq.id)


@router.get("/{asset_tag_or_id}/timeline", response_model=List[Dict[str, Any]])
def get_twin_timeline(
    asset_tag_or_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves unified chronological timeline of all operational events for a specific asset twin."""
    eq = None
    if asset_tag_or_id.isdigit():
        eq = db.query(Equipment).filter(Equipment.id == int(asset_tag_or_id)).first()
    else:
        eq = db.query(Equipment).filter(Equipment.asset_tag == asset_tag_or_id.upper()).first()

    if not eq:
        raise HTTPException(status_code=404, detail=f"Asset twin '{asset_tag_or_id}' not found.")

    return TwinService.get_knowledge_timeline(db, eq.id)

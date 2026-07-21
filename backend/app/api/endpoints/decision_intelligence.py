from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.hierarchy import Plant, Department
from app.models.equipment import Equipment
from app.models.decision_intelligence import DecisionRecommendation, DecisionEvidence
from app.schemas.decision_intelligence import (
    DecisionRecommendationResponse,
    DecisionRecommendationUpdate,
    DecisionStatsResponse,
    DecisionEvidenceResponse
)
from app.schemas.expert_knowledge import RefPlant, RefDepartment, RefEquipment
from app.services.decision_pipeline import DecisionPipeline
from app.services.audit_service import AuditService
from app.core.exceptions import AppException

router = APIRouter(prefix="/decision-recommendations", tags=["AI Decision Intelligence Engine"])


def _build_response(item: DecisionRecommendation) -> DecisionRecommendationResponse:
    """Helper to convert ORM model to response schema format."""
    plant_ref = None
    if item.plant:
        plant_ref = RefPlant(
            id=item.plant.id,
            name=item.plant.name,
            location=item.plant.location
        )
        
    dept_ref = None
    if item.department:
        dept_ref = RefDepartment(
            id=item.department.id,
            name=item.department.name
        )
        
    eq_ref = None
    if item.equipment:
        eq_ref = RefEquipment(
            id=item.equipment.id,
            asset_name=item.equipment.asset_name,
            asset_tag=item.equipment.asset_tag,
            status=item.equipment.status,
            health_score=item.equipment.health_score
        )
        
    evidence_schemas = []
    for ev in item.evidence:
        evidence_schemas.append(
            DecisionEvidenceResponse(
                id=ev.id,
                recommendation_id=ev.recommendation_id,
                evidence_type=ev.evidence_type,
                reference_id=ev.reference_id,
                source_name=ev.source_name,
                confidence=ev.confidence,
                summary=ev.summary
            )
        )
        
    return DecisionRecommendationResponse(
        id=item.id,
        uuid=item.uuid,
        equipment_id=item.equipment_id,
        plant_id=item.plant_id,
        department_id=item.department_id,
        recommendation_type=item.recommendation_type,
        severity=item.severity,
        risk_score=item.risk_score,
        priority=item.priority,
        title=item.title,
        description=item.description,
        recommended_action=item.recommended_action,
        expected_benefit=item.expected_benefit,
        estimated_cost=item.estimated_cost,
        estimated_downtime=item.estimated_downtime,
        failure_probability=item.failure_probability,
        confidence_score=item.confidence_score,
        generated_by=item.generated_by,
        status=item.status,
        approved_by=item.approved_by,
        approved_at=item.approved_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
        plant=plant_ref,
        department=dept_ref,
        equipment=eq_ref,
        evidence=evidence_schemas
    )


@router.get("", response_model=List[DecisionRecommendationResponse])
def list_recommendations(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    equipment_id: Optional[int] = Query(None),
    plant_id: Optional[int] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists, filters, and searches AI decision recommendations."""
    query = db.query(DecisionRecommendation)

    if severity:
        query = query.filter(DecisionRecommendation.severity == severity)
    if status_filter:
        query = query.filter(DecisionRecommendation.status == status_filter)
    if equipment_id:
        query = query.filter(DecisionRecommendation.equipment_id == equipment_id)
    if plant_id:
        query = query.filter(DecisionRecommendation.plant_id == plant_id)

    items = query.order_by(DecisionRecommendation.created_at.desc()).limit(limit).all()
    return [_build_response(i) for i in items]


@router.get("/stats", response_model=DecisionStatsResponse)
def get_decision_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregates metrics for the AI Decision Intelligence dashboard."""
    all_items = db.query(DecisionRecommendation).all()
    total = len(all_items)
    
    accepted = len([i for i in all_items if i.status == "Approved"])
    pending = len([i for i in all_items if i.status == "Pending"])
    
    # Calculate downtime avoided and repair cost saved
    savings = 0.0
    downtime_avoided = 0.0
    for i in all_items:
        if i.status in ("Approved", "Implemented"):
            # Assume avoiding failure saves a fixed value multiplier over repair cost
            savings += (i.estimated_cost * 1.5)
            downtime_avoided += i.estimated_downtime

    # Find highest risk score
    highest_risk = 0.0
    critical_count = 0
    risk_heatmap = []
    
    all_eq = db.query(Equipment).all()
    for eq in all_eq:
        if eq.risk_score > highest_risk:
            highest_risk = eq.risk_score
        if eq.status in ("Degraded", "Maintenance") or eq.risk_score > 70:
            critical_count += 1
            
        risk_heatmap.append({
            "asset_tag": eq.asset_tag,
            "asset_name": eq.asset_name,
            "risk_score": eq.risk_score,
            "health_score": eq.health_score,
            "status": eq.status
        })

    # Sort heatmap descending by risk
    risk_heatmap.sort(key=lambda x: -x["risk_score"])

    # Average confidence
    confs = [i.confidence_score for i in all_items]
    avg_conf = sum(confs) / len(confs) if confs else 90.0

    # Acceptance Rate
    closed = len([i for i in all_items if i.status in ("Approved", "Rejected")])
    acc_rate = (accepted / closed * 100) if closed > 0 else 80.0

    return DecisionStatsResponse(
        total_recommendations=total,
        critical_assets_count=critical_count,
        highest_risk_score=highest_risk,
        recommendations_accepted=accepted,
        recommendations_pending=pending,
        savings_generated_usd=savings,
        downtime_avoided_hrs=downtime_avoided,
        acceptance_rate_pct=acc_rate,
        average_confidence_pct=avg_conf,
        risk_heatmap_data=risk_heatmap[:8]
    )


@router.get("/{uuid}", response_model=DecisionRecommendationResponse)
def get_recommendation_detail(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full details of a decision recommendation by UUID."""
    item = db.query(DecisionRecommendation).filter(DecisionRecommendation.uuid == uuid).first()
    if not item:
        raise AppException("Decision recommendation card not found.", status_code=404, error_code="NOT_FOUND")
    return _build_response(item)


@router.post("/{uuid}/approve", response_model=DecisionRecommendationResponse)
def approve_recommendation(
    uuid: str,
    payload: DecisionRecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approves or rejects a decision recommendation card. Saves author attributes and audit log."""
    item = db.query(DecisionRecommendation).filter(DecisionRecommendation.uuid == uuid).first()
    if not item:
        raise AppException("Decision recommendation card not found.", status_code=404, error_code="NOT_FOUND")

    item.status = payload.status
    if payload.status == "Approved":
        item.approved_by = current_user.full_name or current_user.email
        item.approved_at = datetime.utcnow()
    else:
        item.approved_by = None
        item.approved_at = None
        
    db.commit()
    db.refresh(item)
    
    # Audit log
    AuditService.log(
        db,
        current_user.id,
        "APPROVE_DECISION_RECOMMENDATION",
        "DecisionRecommendation",
        item.id,
        {"status": item.status, "approved_by": item.approved_by}
    )
    
    return _build_response(item)


@router.post("/evaluate", status_code=status.HTTP_200_OK)
def trigger_pipeline_evaluation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually triggers the decision intelligence reasoning pipeline evaluation."""
    if current_user.role not in ("Super Admin", "Admin", "Engineer"):
        raise AppException("Unauthorized to run manual pipeline evaluations.", status_code=403, error_code="UNAUTHORIZED")
        
    count = DecisionPipeline.evaluate_all(db)
    return {"message": f"Successfully evaluated assets. Generated {count} new decision recommendations."}

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.equipment import Equipment
from app.models.lessons_learned import IncidentRecord
from app.schemas.lessons_learned import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    IncidentStatsResponse,
    EquipmentRef,
    ReporterRef
)
from app.core.exceptions import AppException

router = APIRouter(prefix="/incidents", tags=["Incident Tracker & Lessons Learned"])


def _build_response(incident: IncidentRecord) -> dict:
    """Converts an IncidentRecord ORM object to a response-compatible dict."""
    eq_ref = None
    if incident.equipment:
        eq_ref = EquipmentRef(
            id=incident.equipment.id,
            asset_name=incident.equipment.asset_name,
            asset_tag=incident.equipment.asset_tag
        )

    reporter_ref = None
    if incident.reporter:
        reporter_ref = ReporterRef(
            id=incident.reporter.id,
            full_name=incident.reporter.full_name,
            email=incident.reporter.email
        )

    return IncidentResponse(
        id=incident.id,
        uuid=incident.uuid,
        equipment_id=incident.equipment_id,
        reported_by=incident.reported_by,
        incident_name=incident.incident_name,
        severity=incident.severity,
        status=incident.status,
        category=incident.category,
        incident_date=incident.incident_date,
        cause=incident.cause,
        resolution=incident.resolution,
        prevention=incident.prevention,
        recommendations=incident.recommendations,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        equipment=eq_ref,
        reporter=reporter_ref
    )


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    search: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    equipment_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all incident records with optional search and filters."""
    query = db.query(IncidentRecord)

    if search:
        query = query.filter(IncidentRecord.incident_name.ilike(f"%{search}%"))
    if severity:
        query = query.filter(IncidentRecord.severity == severity)
    if status_filter:
        query = query.filter(IncidentRecord.status == status_filter)
    if category:
        query = query.filter(IncidentRecord.category == category)
    if equipment_id:
        query = query.filter(IncidentRecord.equipment_id == equipment_id)

    incidents = query.order_by(IncidentRecord.created_at.desc()).all()
    return [_build_response(i) for i in incidents]


@router.get("/stats", response_model=IncidentStatsResponse)
def get_incident_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns aggregated incident statistics."""
    all_incidents = db.query(IncidentRecord).all()
    return IncidentStatsResponse(
        total=len(all_incidents),
        open=len([i for i in all_incidents if i.status == "Open"]),
        investigating=len([i for i in all_incidents if i.status == "Investigating"]),
        resolved=len([i for i in all_incidents if i.status == "Resolved"]),
        closed=len([i for i in all_incidents if i.status == "Closed"]),
        critical=len([i for i in all_incidents if i.severity == "Critical"]),
        high=len([i for i in all_incidents if i.severity == "High"]),
        medium=len([i for i in all_incidents if i.severity == "Medium"]),
        low=len([i for i in all_incidents if i.severity == "Low"])
    )


@router.get("/{incident_uuid}", response_model=IncidentResponse)
def get_incident_detail(
    incident_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves a single incident record by UUID."""
    incident = db.query(IncidentRecord).filter(IncidentRecord.uuid == incident_uuid).first()
    if not incident:
        raise AppException("Incident record not found.", status_code=404, error_code="INCIDENT_NOT_FOUND")
    return _build_response(incident)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new incident record. Requires Engineer+ role."""
    allowed_roles = ["Super Admin", "Admin", "Engineer", "Department Manager"]
    if current_user.role not in allowed_roles:
        raise AppException("Insufficient permissions to report incidents.", status_code=403, error_code="UNAUTHORIZED")

    # Validate equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == payload.equipment_id).first()
    if not equipment:
        raise AppException("Equipment not found.", status_code=404, error_code="EQUIPMENT_NOT_FOUND")

    incident = IncidentRecord(
        equipment_id=payload.equipment_id,
        reported_by=current_user.id,
        incident_name=payload.incident_name,
        severity=payload.severity,
        status=payload.status,
        category=payload.category,
        incident_date=payload.incident_date or datetime.utcnow().date(),
        cause=payload.cause,
        resolution=payload.resolution,
        prevention=payload.prevention,
        recommendations=payload.recommendations
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return _build_response(incident)


@router.put("/{incident_uuid}", response_model=IncidentResponse)
def update_incident(
    incident_uuid: str,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing incident record. Requires Engineer+ role."""
    allowed_roles = ["Super Admin", "Admin", "Engineer", "Department Manager"]
    if current_user.role not in allowed_roles:
        raise AppException("Insufficient permissions to update incidents.", status_code=403, error_code="UNAUTHORIZED")

    incident = db.query(IncidentRecord).filter(IncidentRecord.uuid == incident_uuid).first()
    if not incident:
        raise AppException("Incident record not found.", status_code=404, error_code="INCIDENT_NOT_FOUND")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)
    return _build_response(incident)


@router.delete("/{incident_uuid}", status_code=status.HTTP_200_OK)
def delete_incident(
    incident_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an incident record. Admin only."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrators can delete incident records.", status_code=403, error_code="UNAUTHORIZED")

    incident = db.query(IncidentRecord).filter(IncidentRecord.uuid == incident_uuid).first()
    if not incident:
        raise AppException("Incident record not found.", status_code=404, error_code="INCIDENT_NOT_FOUND")

    db.delete(incident)
    db.commit()
    return {"message": "Incident record deleted successfully."}

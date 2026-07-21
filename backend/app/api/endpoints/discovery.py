from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.discovery import (
    DiscoveryFinding,
    PatternRelationship,
    KnowledgeGapRecord,
    OptimizationOpportunity,
    RiskDiscovery
)
from app.schemas.discovery import (
    DiscoveryFindingResponse,
    PatternRelationshipResponse,
    KnowledgeGapRecordResponse,
    OptimizationOpportunityResponse,
    RiskDiscoveryResponse,
    DiscoveryAnalyticsResponse
)
from app.services.discovery_engine import DiscoveryEngine

router = APIRouter(prefix="/discovery", tags=["Industrial Intelligence Discovery"])

@router.get("/findings", response_model=List[DiscoveryFindingResponse])
def list_findings(
    finding_type: Optional[str] = Query(None, alias="findingType"),
    priority: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all AI discovery findings with type, priority, and text search filters."""
    query = db.query(DiscoveryFinding)
    
    if finding_type:
        query = query.filter(DiscoveryFinding.finding_type == finding_type)
    if priority:
        query = query.filter(DiscoveryFinding.priority == priority)
    if q:
        query = query.filter(
            DiscoveryFinding.title.ilike(f"%{q}%") | 
            DiscoveryFinding.summary.ilike(f"%{q}%") |
            DiscoveryFinding.affected_assets.ilike(f"%{q}%")
        )
        
    return query.order_by(DiscoveryFinding.priority == "Critical", DiscoveryFinding.priority == "High", DiscoveryFinding.priority == "Medium", DiscoveryFinding.created_at.desc()).all()


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_discoveries(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers an on-demand rerun of all 6 discovery engines."""
    # Run synchronously to return fresh stats immediately for manual verification
    counts = DiscoveryEngine.run_discovery(db)
    return {
        "status": "Success",
        "message": "Industrial Intelligence Discovery Engine ran successfully. Mapped entities updated.",
        "counts": counts
    }


@router.get("/patterns", response_model=List[PatternRelationshipResponse])
def get_patterns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all identified failure loop patterns, equipment clusters, and seasonal failure trends."""
    return db.query(PatternRelationship).order_by(PatternRelationship.created_at.desc()).all()


@router.get("/gaps", response_model=List[KnowledgeGapRecordResponse])
def get_knowledge_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists missing manuals, SOPs, RCAs, and computed Knowledge Completeness scores."""
    return db.query(KnowledgeGapRecord).order_by(KnowledgeGapRecord.severity == "Critical", KnowledgeGapRecord.severity == "High", KnowledgeGapRecord.created_at.desc()).all()


@router.get("/optimizations", response_model=List[OptimizationOpportunityResponse])
def get_optimizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists proactive spare inventory, inspection extensions, and downtime optimization opportunities."""
    return db.query(OptimizationOpportunity).order_by(OptimizationOpportunity.priority == "High", OptimizationOpportunity.estimated_savings.desc()).all()


@router.get("/risks", response_model=List[RiskDiscoveryResponse])
def get_risks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists emerging operational risks, high wear indicators, and upcoming compliance warning schedules."""
    return db.query(RiskDiscovery).order_by(RiskDiscovery.priority == "Critical", RiskDiscovery.priority == "High", RiskDiscovery.created_at.desc()).all()


@router.get("/analytics", response_model=DiscoveryAnalyticsResponse)
def get_discovery_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregates multi-dimensional accuracy, patterns count, risk reduction, and expected savings metrics."""
    return DiscoveryEngine.get_discovery_analytics(db)

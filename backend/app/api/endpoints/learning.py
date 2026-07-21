from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.learning import (
    FeedbackRecord,
    LearningEvent,
    RecommendationValidation,
    KnowledgeEvolution,
    ModelEvaluation
)
from app.schemas.learning import (
    FeedbackCreate,
    FeedbackResponse,
    LearningEventResponse,
    RecommendationValidationCreate,
    RecommendationValidationResponse,
    KnowledgeEvolutionResponse,
    ModelEvaluationResponse,
    LearningAnalyticsResponse
)
from app.services.learning_service import LearningService

router = APIRouter(prefix="/learning", tags=["Continuous Learning & Feedback Intelligence"])

@router.get("/feedback", response_model=List[FeedbackResponse])
def list_feedback(
    entity_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves logged engineer feedback records."""
    query = db.query(FeedbackRecord)
    if entity_type:
        query = query.filter(FeedbackRecord.entity_type == entity_type)
    return query.order_by(FeedbackRecord.created_at.desc()).all()


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits engineer validation (Accept / Reject / Modify), answer ratings, or corrections."""
    return LearningService.record_feedback(
        db=db,
        user_id=current_user.id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        feedback_type=payload.feedback_type,
        rating=payload.rating,
        comment=payload.comment,
        correction_text=payload.correction_text,
        evidence_url=payload.evidence_url
    )


@router.get("/events", response_model=List[LearningEventResponse])
def list_learning_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves chronological milestone learning events."""
    return db.query(LearningEvent).order_by(LearningEvent.created_at.desc()).all()


@router.get("/evolution", response_model=List[KnowledgeEvolutionResponse])
def get_knowledge_evolution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists detected outdated SOPs, OEM manuals, conflicting documents, and knowledge decay records."""
    return db.query(KnowledgeEvolution).order_by(KnowledgeEvolution.created_at.desc()).all()


@router.get("/evaluation", response_model=ModelEvaluationResponse)
def get_model_evaluation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides model quality evaluation metrics (precision, citation quality, decision success rates)."""
    latest = db.query(ModelEvaluation).order_by(ModelEvaluation.evaluation_date.desc()).first()
    if not latest:
        latest = LearningService.calculate_model_evaluation(db)
    return latest


@router.get("/analytics", response_model=LearningAnalyticsResponse)
def get_learning_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides aggregate continuous learning analytics and performance KPIs."""
    return LearningService.get_learning_analytics(db)


@router.post("/refresh", status_code=status.HTTP_200_OK)
def trigger_learning_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers an on-demand re-evaluation scan for continuous learning."""
    res = LearningService.run_learning_pipeline(db)
    return res

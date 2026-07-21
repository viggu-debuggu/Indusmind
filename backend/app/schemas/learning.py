from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import CustomBaseModel

class FeedbackCreate(CustomBaseModel):
    entity_type: str
    entity_id: Optional[int] = None
    feedback_type: str # Accept, Reject, Modify, Rating
    rating: Optional[int] = None
    comment: Optional[str] = None
    correction_text: Optional[str] = None
    evidence_url: Optional[str] = None


class FeedbackResponse(CustomBaseModel):
    id: int
    uuid: str
    user_id: Optional[int] = None
    entity_type: str
    entity_id: Optional[int] = None
    feedback_type: str
    rating: Optional[int] = None
    comment: Optional[str] = None
    correction_text: Optional[str] = None
    evidence_url: Optional[str] = None
    status: str
    created_at: datetime


class LearningEventResponse(CustomBaseModel):
    id: int
    uuid: str
    event_type: str
    title: str
    description: str
    impact: str
    confidence_delta: float
    created_at: datetime


class RecommendationValidationCreate(CustomBaseModel):
    recommendation_id: int
    validation_status: str # Accepted, Rejected, Modified
    modified_action_text: Optional[str] = None
    comments: Optional[str] = None


class RecommendationValidationResponse(CustomBaseModel):
    id: int
    uuid: str
    recommendation_id: int
    engineer_id: Optional[int] = None
    validation_status: str
    modified_action_text: Optional[str] = None
    comments: Optional[str] = None
    confidence_delta: float
    created_at: datetime


class KnowledgeEvolutionResponse(CustomBaseModel):
    id: int
    uuid: str
    document_id: Optional[int] = None
    evolution_type: str
    title: str
    description: str
    freshness_score: float
    recommended_update: str
    status: str
    created_at: datetime


class ModelEvaluationResponse(CustomBaseModel):
    id: int
    uuid: str
    recommendation_accuracy: float
    answer_quality: float
    citation_quality: float
    knowledge_graph_quality: float
    agent_collaboration_quality: float
    discovery_quality: float
    decision_success_rate: float
    evaluation_date: datetime


class LearningAnalyticsResponse(CustomBaseModel):
    acceptance_rate: float
    recommendation_accuracy: float
    knowledge_freshness: float
    ai_confidence: float
    knowledge_evolution_score: float
    engineer_satisfaction: float
    learning_progress_pct: float
    learning_trend: List[float] = []
    feedback_counts: Dict[str, int] = {}
    most_corrected_topics: List[Dict[str, Any]] = []

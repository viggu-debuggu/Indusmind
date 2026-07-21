import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class FeedbackRecord(Base):
    """
    SQLAlchemy model storing engineer feedback (Accept, Reject, Modify, 1-5 Star Ratings, 
    comments, correction text, and supporting evidence) on AI answers and recommendations.
    """
    __tablename__ = "feedback_records"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    entity_type = Column(String(100), nullable=False) # Recommendation, RAG Answer, Agent Decision, Discovery Finding
    entity_id = Column(Integer, nullable=True)
    
    feedback_type = Column(String(50), nullable=False) # Accept, Reject, Modify, Rating
    rating = Column(Integer, nullable=True) # 1 to 5 stars
    comment = Column(Text, nullable=True)
    correction_text = Column(Text, nullable=True)
    evidence_url = Column(String(255), nullable=True)
    
    status = Column(String(50), default="Processed", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")


class LearningEvent(Base):
    """
    SQLAlchemy model tracking discrete continuous learning milestone events.
    """
    __tablename__ = "learning_events"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    event_type = Column(String(100), nullable=False) # recommendation_accepted, recommendation_rejected, knowledge_corrected, manual_flagged_outdated
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    impact = Column(Text, nullable=False)
    confidence_delta = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RecommendationValidation(Base):
    """
    SQLAlchemy model tracking engineer validation states (Accepted, Rejected, Modified)
    for AI Decision Recommendations.
    """
    __tablename__ = "recommendation_validation"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    recommendation_id = Column(Integer, ForeignKey("decision_recommendations.id", ondelete="CASCADE"), nullable=False)
    engineer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    validation_status = Column(String(50), nullable=False) # Accepted, Rejected, Modified
    modified_action_text = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    confidence_delta = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recommendation = relationship("DecisionRecommendation")
    engineer = relationship("User")


class KnowledgeEvolution(Base):
    """
    SQLAlchemy model detecting outdated SOPs, OEM manuals, conflicting documents, 
    and knowledge decay metrics.
    """
    __tablename__ = "knowledge_evolution"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    evolution_type = Column(String(100), nullable=False) # Outdated SOP, Outdated Manual, Conflicting Knowledge, Knowledge Decay
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    freshness_score = Column(Float, default=100.0, nullable=False) # 0-100
    recommended_update = Column(Text, nullable=False)
    status = Column(String(50), default="Pending Review", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("DocumentModel")


class ModelEvaluation(Base):
    """
    SQLAlchemy model storing model quality evaluation scores across recommendations,
    citations, RAG confidence, and multi-agent collaborations.
    """
    __tablename__ = "model_evaluation"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    recommendation_accuracy = Column(Float, default=92.5, nullable=False)
    answer_quality = Column(Float, default=94.0, nullable=False)
    citation_quality = Column(Float, default=95.0, nullable=False)
    knowledge_graph_quality = Column(Float, default=93.0, nullable=False)
    agent_collaboration_quality = Column(Float, default=91.5, nullable=False)
    discovery_quality = Column(Float, default=94.6, nullable=False)
    decision_success_rate = Column(Float, default=90.0, nullable=False)
    
    evaluation_date = Column(DateTime, default=datetime.utcnow, nullable=False)

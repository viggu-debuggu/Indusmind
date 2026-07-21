import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.session import Base

class AgentExecution(Base):
    """SQLAlchemy model tracking executive traces, participating agents, and reasoning steps."""
    __tablename__ = "agent_execution"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    chat_message_id = Column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=True)
    session_uuid = Column(String(36), nullable=False, index=True)
    
    agents_used = Column(Text, nullable=False) # Comma-separated list
    reasoning_steps = Column(JSON().with_variant(JSONB, "postgresql"), default=list, nullable=False) # Serialized list
    evidence = Column(Text, nullable=True)
    confidence = Column(Float, default=100.0, nullable=False)
    duration = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    chat_message = relationship("ChatMessage")


class AgentMemory(Base):
    """SQLAlchemy model representing individual agent memory instances, reasoning history, and learning indexes."""
    __tablename__ = "agent_memory"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    agent_name = Column(String(100), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    reasoning = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    confidence = Column(Float, default=100.0, nullable=False)
    status = Column(String(50), default="Completed", nullable=False) # Completed, Failed
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AgentMessage(Base):
    """SQLAlchemy model logging structured coordination messages between collaborative agents."""
    __tablename__ = "agent_messages"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    session_uuid = Column(String(36), nullable=True, index=True)
    sender = Column(String(100), nullable=False, index=True)
    receiver = Column(String(100), nullable=False, index=True)
    message_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False) # JSON string
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class AgentMetric(Base):
    """SQLAlchemy model tracking utilization rate, success rate, speed, and accuracy quality metrics."""
    __tablename__ = "agent_metrics"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    agent_name = Column(String(100), nullable=False, index=True)
    tasks_count = Column(Integer, default=0, nullable=False)
    success_rate = Column(Float, default=100.0, nullable=False)
    avg_response_time = Column(Float, default=0.0, nullable=False)
    average_confidence = Column(Float, default=100.0, nullable=False)
    utilization_rate = Column(Float, default=0.0, nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class AgentCollaboration(Base):
    """SQLAlchemy model capturing multi-agent collaborative workflows, results, and estimated benefits."""
    __tablename__ = "agent_collaboration"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    session_uuid = Column(String(36), nullable=False, index=True)
    collaboration_type = Column(String(100), nullable=False) # e.g. "Asset Failure Analysis"
    initiator = Column(String(100), nullable=False)
    collaborators = Column(Text, nullable=False) # Comma-separated list
    outcome = Column(Text, nullable=False)
    
    downtime_saved_estimate = Column(Float, default=0.0, nullable=False)
    cost_saved_estimate = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

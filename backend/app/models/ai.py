import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database.session import Base


class DocumentChunk(Base):
    """SQLAlchemy model representing individual semantically chunked segments of documents with pgvector embeddings."""
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(255), nullable=False, index=True)
    
    # BAAI/bge-small-en-v1.5 produces 384-dimensional embeddings
    embedding = Column(Vector(384), nullable=False)
    
    page = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    
    # Named chunk_metadata to prevent conflict with Base.metadata reserved namespace
    chunk_metadata = Column(JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to the parent document
    document = relationship("DocumentModel")


class ChatSession(Base):
    """SQLAlchemy model representing an AI Copilot chat session thread."""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    workspace = relationship("Workspace")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.timestamp.asc()")


class ChatMessage(Base):
    """SQLAlchemy model representing an individual question or answer inside a ChatSession."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    
    # RAG metadata (mainly for assistant replies)
    confidence_score = Column(Integer, nullable=True)  # Percentage 0-100
    documents_used = Column(JSON().with_variant(JSONB, "postgresql"), default=list, nullable=True)  # List of dicts: {"id", "document_name", "page"}
    citations = Column(JSON().with_variant(JSONB, "postgresql"), default=list, nullable=True)  # List of citations
    related_equipment = Column(JSON().with_variant(JSONB, "postgresql"), default=list, nullable=True)  # List of matching asset tags
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

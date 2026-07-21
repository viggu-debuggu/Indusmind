from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class RAGRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question query to run RAG grounding on")
    session_uuid: Optional[str] = Field(None, description="UUID of existing conversation thread session")
    asset: Optional[str] = Field(None, description="Filter/grounding query on a specific equipment asset tag")
    category: Optional[str] = Field(None, description="Filter by document category (e.g. SOP, Manual)")
    workspace_uuid: Optional[str] = Field(None, description="Filter/scope context search strictly within a workspace")


class DocumentReference(BaseModel):
    id: int
    uuid: str
    document_name: str
    original_filename: str
    page: Optional[int] = None
    category: Optional[str] = None


class CitationItem(BaseModel):
    source_document: str = Field(..., description="Document manual/filename")
    page: Optional[int] = Field(None, description="Page number of citation segment")
    section: Optional[str] = Field(None, description="Heading section name of text segment")
    snippet: str = Field(..., description="Text context snippet backing statement")


class RAGResponse(BaseModel):
    answer: str
    confidence_score: int = Field(..., ge=0, le=100)
    session_uuid: str
    documents_used: List[DocumentReference] = []
    citations: List[CitationItem] = []
    related_equipment: List[str] = []
    participating_agents: Optional[List[str]] = []
    reasoning_steps: Optional[List[str]] = []
    timestamp: datetime


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    asset: Optional[str] = None
    category: Optional[str] = None
    plant_location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    workspace_uuid: Optional[str] = None
    limit: int = Field(5, ge=1, le=50)


class SearchResultChunk(BaseModel):
    chunk_id: str
    text: str
    page: Optional[int] = None
    score: float  # Cosine similarity score
    document: DocumentReference
    section: Optional[str] = None
    equipment_mentioned: List[str] = []


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SearchResultChunk]


class ChatMessageResponse(BaseModel):
    id: int
    role: str  # "user" or "assistant"
    content: str
    confidence_score: Optional[int] = None
    documents_used: List[Dict[str, Any]] = []
    citations: List[Dict[str, Any]] = []
    related_equipment: List[str] = []
    timestamp: datetime


class ChatSessionResponse(BaseModel):
    uuid: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class ChatSessionDetailsResponse(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "Equipment", "Document", "Process", "Alert", "Compliance"
    details: Optional[str] = None
    location: Optional[str] = None
    color: Optional[str] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

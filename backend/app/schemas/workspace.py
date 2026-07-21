from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import CustomBaseModel
from app.schemas.document import DocumentResponse

class WorkspaceCreate(CustomBaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class WorkspaceUpdate(CustomBaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

class WorkspaceResponse(CustomBaseModel):
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0

class WorkspaceDetailsResponse(WorkspaceResponse):
    documents: List[DocumentResponse] = []

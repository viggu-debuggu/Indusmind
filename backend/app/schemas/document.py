from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import CustomBaseModel


class DocumentMetadataBase(CustomBaseModel):
    document_name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    plant_location: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=255)
    status: str = Field("Uploaded", max_length=50)


class DocumentCreate(DocumentMetadataBase):
    original_filename: str
    stored_filename: str
    file_extension: str
    mime_type: str
    file_size: int
    storage_provider: str = "local"
    storage_path: str
    uploaded_by: Optional[int] = None
    checksum: Optional[str] = None


class DocumentUpdate(CustomBaseModel):
    document_name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    plant_location: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)


class UploaderInfo(CustomBaseModel):
    id: int
    full_name: str
    email: str
    role: str


class DocumentResponse(CustomBaseModel):
    id: int
    uuid: str
    document_name: str
    original_filename: str
    file_extension: str
    mime_type: str
    file_size: int
    storage_provider: str
    category: Optional[str] = None
    department: Optional[str] = None
    plant_location: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    status: str
    processing_status: str
    version: int
    version_group_id: Optional[str] = None
    is_current: bool = True
    approval_status: str = "Uploaded"
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    uploaded_by: Optional[int] = None
    uploader: Optional[UploaderInfo] = None


class DocumentListResponse(CustomBaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    pages: int

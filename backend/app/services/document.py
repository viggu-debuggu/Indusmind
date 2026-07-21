from typing import BinaryIO, List, Optional
from sqlalchemy.orm import Session
from app.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from app.utils.storage import get_storage_provider
from app.core.exceptions import AppException


class DocumentService:
    """Orchestrates storage uploads and database updates for documents."""
    
    def __init__(self, db: Session):
        self.repo = DocumentRepository(db)
        self.storage = get_storage_provider()

    def process_upload(self, file_data: BinaryIO, title: str, filename: str, content_type: str, file_size: int) -> DocumentResponse:
        # 1. Upload to active storage provider
        try:
            stored_path = self.storage.upload_file(file_data, filename)
        except Exception as e:
            raise AppException(
                message=f"Storage upload failed: {str(e)}",
                status_code=500,
                error_code="STORAGE_UPLOAD_ERROR"
            )

        # 2. Record metadata in Database
        create_schema = DocumentCreate(
            title=title,
            filename=filename,
            file_path=stored_path,
            file_size=file_size,
            content_type=content_type
        )
        
        db_doc = self.repo.create(create_schema)
        
        # 3. Return serialized data
        return DocumentResponse.model_validate(db_doc)

    def list_documents(self, skip: int = 0, limit: int = 100) -> List[DocumentResponse]:
        docs = self.repo.get_all(skip, limit)
        return [DocumentResponse.model_validate(d) for d in docs]

    def get_document(self, doc_id: int) -> Optional[DocumentResponse]:
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            return None
        return DocumentResponse.model_validate(doc)

    def delete_document(self, doc_id: int) -> bool:
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            return False
        
        # Delete from storage first
        try:
            self.storage.delete_file(doc.file_path)
        except Exception:
            # Continue even if storage delete fails to keep db in sync or log warning
            pass
            
        return self.repo.delete(doc_id)

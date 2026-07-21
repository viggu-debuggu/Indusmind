import os
import hashlib
import uuid
from datetime import datetime
from typing import BinaryIO, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentListResponse
from app.utils.file_storage import get_file_storage
from app.core.exceptions import AppException
from app.core.logging import logger

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt",
    ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".zip"
}
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200 MB in bytes


class DocumentService:
    """Manages file storage uploads, version tracking, metadata indexing, and access policies."""

    def __init__(self, db: Session):
        self.repo = DocumentRepository(db)
        self.storage = get_file_storage()

    def _get_checksum(self, file_data: BinaryIO) -> str:
        """Computes SHA-256 checksum for a file stream."""
        hasher = hashlib.sha256()
        file_data.seek(0)
        # Read in chunks to prevent memory blowup
        for chunk in iter(lambda: file_data.read(4096), b""):
            hasher.update(chunk)
        file_data.seek(0)
        return hasher.hexdigest()

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitizes file names to remove paths, spaces, and unwanted characters."""
        base = os.path.basename(filename)
        # Replace spaces and clean path symbols
        return "".join(c for c in base if c.isalnum() or c in "._-").strip()

    def upload_document(
        self,
        file_data: BinaryIO,
        original_filename: str,
        document_name: str,
        uploaded_by: int,
        category: Optional[str] = None,
        department: Optional[str] = None,
        plant_location: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None
    ) -> DocumentResponse:
        """Validates, hashes, stores, and logs single file uploads with automatic versioning."""
        # 1. Validate File Extension
        _, ext = os.path.splitext(original_filename)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise AppException(
                message=f"File extension '{ext}' is not supported.",
                status_code=400,
                error_code="UNSUPPORTED_FILE_TYPE"
            )

        # 2. Check File Size
        file_data.seek(0, 2)
        size = file_data.tell()
        file_data.seek(0)
        if size > MAX_FILE_SIZE:
            raise AppException(
                message=f"File size exceeds the maximum limit of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
                status_code=400,
                error_code="FILE_TOO_LARGE"
            )

        # 3. Check duplicate uploads by checking SHA-256
        checksum = self._get_checksum(file_data)
        duplicate = self.repo.get_duplicate(original_filename, checksum)
        if duplicate:
            raise AppException(
                message="This document has already been uploaded with the same checksum.",
                status_code=400,
                error_code="DUPLICATE_UPLOAD"
            )

        # 4. Determine MIME Type
        mime_type = "application/octet-stream"
        if ext == ".pdf":
            mime_type = "application/pdf"
        elif ext in (".png", ".jpg", ".jpeg", ".bmp", ".tiff"):
            mime_type = f"image/{ext[1:]}"
        elif ext == ".txt":
            mime_type = "text/plain"
        elif ext == ".csv":
            mime_type = "text/csv"
        elif ext in (".xls", ".xlsx"):
            mime_type = "application/vnd.ms-excel"
        elif ext in (".doc", ".docx"):
            mime_type = "application/msword"
        elif ext == ".zip":
            mime_type = "application/zip"

        # 5. Version checking logic
        # If the same document name exists, increment its version index
        max_v = self.repo.get_max_version(document_name)
        next_version = max_v + 1

        # 6. Generate secure stored UUID filename
        sanitized_orig = self._sanitize_filename(original_filename)
        stored_filename = f"{uuid.uuid4().hex}{ext}"

        # 7. Upload to storage provider
        try:
            storage_path = self.storage.upload_file(file_data, stored_filename)
        except Exception as e:
            logger.error("storage_upload_failed", filename=original_filename, error=str(e))
            raise AppException(
                message=f"Failed to upload document file: {str(e)}",
                status_code=500,
                error_code="STORAGE_ERROR"
            )

        # 8. Insert record in database
        create_schema = DocumentCreate(
            document_name=document_name,
            original_filename=sanitized_orig,
            stored_filename=stored_filename,
            file_extension=ext,
            mime_type=mime_type,
            file_size=size,
            storage_provider=self.storage.__class__.__name__.replace("StorageProvider", "").lower(),
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            category=category,
            department=department,
            plant_location=plant_location,
            description=description,
            tags=tags,
            status="Uploaded",
            checksum=checksum
        )

        db_doc = self.repo.create(create_schema, version=next_version)
        
        logger.info(
            "document_uploaded",
            document_id=db_doc.id,
            document_name=db_doc.document_name,
            filename=db_doc.original_filename,
            version=db_doc.version,
            uploaded_by=uploaded_by
        )
        
        return DocumentResponse.model_validate(db_doc)

    def get_document_by_id(self, doc_id: int) -> DocumentResponse:
        """Retrieves a single active document record."""
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise AppException(
                message="Document not found or has been deleted.",
                status_code=404,
                error_code="DOCUMENT_NOT_FOUND"
            )
        return DocumentResponse.model_validate(doc)

    def update_document_metadata(self, doc_id: int, schema: DocumentUpdate, updated_by: int) -> DocumentResponse:
        """Modifies document metadata descriptors and logs the change."""
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")

        updated_doc = self.repo.update(doc_id, schema)
        logger.info("document_metadata_updated", document_id=doc_id, updated_by=updated_by)
        return DocumentResponse.model_validate(updated_doc)

    def download_document(self, doc_id: int, user_id: int) -> Tuple[bytes, str, str]:
        """Retrieves binary document contents from storage."""
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")

        try:
            content = self.storage.download_file(doc.storage_path)
            logger.info("document_downloaded", document_id=doc_id, downloaded_by=user_id)
            return content, doc.original_filename, doc.mime_type
        except Exception as e:
            logger.error("storage_download_failed", document_id=doc_id, path=doc.storage_path, error=str(e))
            raise AppException("Failed to read file from storage provider.", status_code=500, error_code="DOWNLOAD_ERROR")

    def soft_delete_document(self, doc_id: int, user_id: int) -> bool:
        """Moves active document into soft deleted state."""
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")

        res = self.repo.soft_delete(doc_id)
        logger.info("document_deleted", document_id=doc_id, deleted_by=user_id)
        return res

    def archive_document(self, doc_id: int, user_id: int) -> DocumentResponse:
        """Sets document state to Archived."""
        doc = self.repo.get_by_id(doc_id)
        if not doc:
            raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")

        archived = self.repo.archive(doc_id)
        logger.info("document_archived", document_id=doc_id, archived_by=user_id)
        return DocumentResponse.model_validate(archived)

    def restore_document(self, doc_id: int, user_id: int) -> DocumentResponse:
        """Restores archived/deleted documents to active upload state."""
        restored = self.repo.restore(doc_id)
        if not restored:
            raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")

        logger.info("document_restored", document_id=doc_id, restored_by=user_id)
        return DocumentResponse.model_validate(restored)

    def list_and_search_documents(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None,
        plant_location: Optional[str] = None,
        file_type: Optional[str] = None,
        status: Optional[str] = None,
        uploaded_by: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = "newest",
        page: int = 1,
        limit: int = 20
    ) -> DocumentListResponse:
        """Filters, searches, sorts, and paginates documents."""
        # Convert date strings to datetime objects
        s_date = None
        e_date = None
        if start_date:
            try:
                s_date = datetime.fromisoformat(start_date)
            except ValueError:
                pass
        if end_date:
            try:
                e_date = datetime.fromisoformat(end_date)
            except ValueError:
                pass

        skip = (page - 1) * limit
        items, total = self.repo.get_all_paginated(
            search=search,
            category=category,
            department=department,
            plant_location=plant_location,
            file_type=file_type,
            status=status,
            uploaded_by=uploaded_by,
            start_date=s_date,
            end_date=e_date,
            sort_by=sort_by,
            skip=skip,
            limit=limit
        )

        pages = (total + limit - 1) // limit if total > 0 else 1
        serialized_items = [DocumentResponse.model_validate(x) for x in items]
        
        return DocumentListResponse(
            items=serialized_items,
            total=total,
            page=page,
            pages=pages
        )

    def get_version_history(self, document_name: str) -> List[DocumentResponse]:
        """Returns all versions of a document to display edit histories."""
        history = self.repo.get_version_history(document_name)
        return [DocumentResponse.model_validate(x) for x in history]

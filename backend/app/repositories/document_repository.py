from datetime import datetime
from typing import List, Tuple, Optional
from sqlalchemy import or_, and_, asc, desc
from sqlalchemy.orm import Session, joinedload
from app.models.document import DocumentModel
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentRepository:
    """Handles DB operations for industrial document assets (Search, Filter, Paginate, Versioning)."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, doc_id: int) -> Optional[DocumentModel]:
        """Retrieves a document by its primary key with joined uploader details."""
        return (
            self.db.query(DocumentModel)
            .options(joinedload(DocumentModel.uploader))
            .filter(DocumentModel.id == doc_id, DocumentModel.deleted_at.is_(None))
            .first()
        )

    def get_by_uuid(self, doc_uuid: str) -> Optional[DocumentModel]:
        """Retrieves a document by its unique UUID."""
        return (
            self.db.query(DocumentModel)
            .options(joinedload(DocumentModel.uploader))
            .filter(DocumentModel.uuid == doc_uuid, DocumentModel.deleted_at.is_(None))
            .first()
        )

    def get_any_by_id_including_deleted(self, doc_id: int) -> Optional[DocumentModel]:
        """Retrieves a document by primary key even if soft-deleted/archived."""
        return (
            self.db.query(DocumentModel)
            .options(joinedload(DocumentModel.uploader))
            .filter(DocumentModel.id == doc_id)
            .first()
        )

    def get_duplicate(self, original_filename: str, checksum: str) -> Optional[DocumentModel]:
        """Verifies duplicate uploads based on filename and checksum."""
        if not checksum:
            return None
        return (
            self.db.query(DocumentModel)
            .filter(
                DocumentModel.original_filename == original_filename,
                DocumentModel.checksum == checksum,
                DocumentModel.deleted_at.is_(None)
            )
            .first()
        )

    def get_max_version(self, document_name: str) -> int:
        """Determines the current max version number for a logical document name."""
        res = (
            self.db.query(DocumentModel.version)
            .filter(
                DocumentModel.document_name == document_name,
                DocumentModel.deleted_at.is_(None)
            )
            .order_by(DocumentModel.version.desc())
            .first()
        )
        return res[0] if res else 0

    def get_version_history(self, document_name: str) -> List[DocumentModel]:
        """Fetches all versions of a document sorted by version number."""
        return (
            self.db.query(DocumentModel)
            .options(joinedload(DocumentModel.uploader))
            .filter(
                DocumentModel.document_name == document_name,
                DocumentModel.deleted_at.is_(None)
            )
            .order_by(DocumentModel.version.desc())
            .all()
        )

    def create(self, schema: DocumentCreate, version: int = 1) -> DocumentModel:
        """Inserts a new document record into the database."""
        db_doc = DocumentModel(
            document_name=schema.document_name,
            original_filename=schema.original_filename,
            stored_filename=schema.stored_filename,
            file_extension=schema.file_extension.lower(),
            mime_type=schema.mime_type,
            file_size=schema.file_size,
            storage_provider=schema.storage_provider,
            storage_path=schema.storage_path,
            uploaded_by=schema.uploaded_by,
            category=schema.category,
            department=schema.department,
            plant_location=schema.plant_location,
            description=schema.description,
            tags=schema.tags,
            status=schema.status,
            processing_status="Pending",
            version=version,
            checksum=schema.checksum
        )
        self.db.add(db_doc)
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def update(self, doc_id: int, schema: DocumentUpdate) -> Optional[DocumentModel]:
        """Modifies metadata attributes for an existing document."""
        db_doc = self.get_by_id(doc_id)
        if not db_doc:
            return None

        update_data = schema.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(db_doc, key, val)

        db_doc.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def soft_delete(self, doc_id: int) -> bool:
        """Applies soft deletion, setting deleted_at and status to Deleted."""
        db_doc = self.get_by_id(doc_id)
        if not db_doc:
            return False
        db_doc.deleted_at = datetime.utcnow()
        db_doc.status = "Deleted"
        self.db.commit()
        return True

    def archive(self, doc_id: int) -> Optional[DocumentModel]:
        """Updates document status to Archived."""
        db_doc = self.get_by_id(doc_id)
        if not db_doc:
            return None
        db_doc.status = "Archived"
        db_doc.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def restore(self, doc_id: int) -> Optional[DocumentModel]:
        """Restores an archived or soft-deleted document back to Uploaded status."""
        db_doc = self.get_any_by_id_including_deleted(doc_id)
        if not db_doc:
            return None
        db_doc.deleted_at = None
        db_doc.status = "Uploaded"
        db_doc.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def get_all_paginated(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None,
        plant_location: Optional[str] = None,
        file_type: Optional[str] = None,
        status: Optional[str] = None,
        uploaded_by: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        sort_by: str = "newest",
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[DocumentModel], int]:
        """Queries documents applying search filters, sorting profiles, and page parameters."""
        query = self.db.query(DocumentModel).options(joinedload(DocumentModel.uploader))

        # Core filter: Exclude soft-deleted items unless explicitly looking for deleted status
        if status == "Deleted":
            query = query.filter(DocumentModel.deleted_at.is_not(None))
        else:
            query = query.filter(DocumentModel.deleted_at.is_(None))
            if status:
                query = query.filter(DocumentModel.status == status)
            else:
                # By default, do not return deleted items
                query = query.filter(DocumentModel.status != "Deleted")

        # Full-text query matches
        if search:
            search_clause = or_(
                DocumentModel.document_name.ilike(f"%{search}%"),
                DocumentModel.original_filename.ilike(f"%{search}%"),
                DocumentModel.category.ilike(f"%{search}%"),
                DocumentModel.department.ilike(f"%{search}%"),
                DocumentModel.tags.ilike(f"%{search}%"),
                DocumentModel.description.ilike(f"%{search}%")
            )
            # Joins User model if searching by uploader
            query = query.join(User, DocumentModel.uploaded_by == User.id, isouter=True)
            search_clause = or_(search_clause, User.full_name.ilike(f"%{search}%"))
            query = query.filter(search_clause)

        # Filters
        if category:
            query = query.filter(DocumentModel.category == category)
        if department:
            query = query.filter(DocumentModel.department == department)
        if plant_location:
            query = query.filter(DocumentModel.plant_location == plant_location)
        if file_type:
            query = query.filter(DocumentModel.file_extension == file_type.lower())
        if uploaded_by:
            query = query.filter(DocumentModel.uploaded_by == uploaded_by)
        if start_date:
            query = query.filter(DocumentModel.created_at >= start_date)
        if end_date:
            query = query.filter(DocumentModel.created_at <= end_date)

        # Count total matches before pagination limits
        total = query.count()

        # Sorting
        if sort_by == "oldest":
            query = query.order_by(asc(DocumentModel.created_at))
        elif sort_by == "file_size":
            query = query.order_by(desc(DocumentModel.file_size))
        elif sort_by == "alphabetical":
            query = query.order_by(asc(DocumentModel.document_name))
        else:  # newest
            query = query.order_by(desc(DocumentModel.created_at))

        # Pagination
        items = query.offset(skip).limit(limit).all()
        return items, total

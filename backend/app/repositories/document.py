from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.document import DocumentModel
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentRepository:
    """Encapsulates DB transactions for Industrial Documents."""
    
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, doc_id: int) -> Optional[DocumentModel]:
        return self.db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[DocumentModel]:
        return self.db.query(DocumentModel).offset(skip).limit(limit).all()

    def create(self, schema: DocumentCreate) -> DocumentModel:
        db_doc = DocumentModel(
            title=schema.title,
            filename=schema.filename,
            file_path=schema.file_path,
            file_size=schema.file_size,
            content_type=schema.content_type,
            status="pending"
        )
        self.db.add(db_doc)
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def update(self, doc_id: int, schema: DocumentUpdate) -> Optional[DocumentModel]:
        db_doc = self.get_by_id(doc_id)
        if not db_doc:
            return None
        
        update_data = schema.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_doc, key, value)
            
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def delete(self, doc_id: int) -> bool:
        db_doc = self.get_by_id(doc_id)
        if not db_doc:
            return False
        self.db.delete(db_doc)
        self.db.commit()
        return True

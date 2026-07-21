from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.ai import DocumentChunk
from app.models.document import DocumentModel
from app.models.user import User
from app.ai.embeddings import EmbeddingGenerator
from app.ai.vector_store import VectorStore
from app.core.logging import logger

class Retriever:
    """Retrieves document chunks matching queries, enforcing user security permissions and filtering."""

    @staticmethod
    def get_permitted_document_ids(db: Session, user: User, filter_category: Optional[str] = None) -> List[int]:
        """
        Retrieves IDs of documents the user is authorized to read/search.
        - Enforces organizational boundaries (Super Admins must have explicit UserOrganizationGrant).
        - Active files (status='Uploaded') are readable by all roles.
        - Archived or Draft files can only be accessed by Admin or Department Manager.
        - Soft-deleted documents (status='Deleted') are excluded entirely.
        """
        from app.models.hierarchy import UserOrganizationGrant
        from app.models.user import User as UserModel
        
        if user.role == "Super Admin":
            grants = db.query(UserOrganizationGrant).filter(UserOrganizationGrant.user_id == user.id).all()
            allowed_org_ids = [g.organization_id for g in grants]
        else:
            allowed_org_ids = [user.organization_id] if user.organization_id else []
            
        if not allowed_org_ids:
            return []
            
        allowed_users = db.query(UserModel.id).filter(UserModel.organization_id.in_(allowed_org_ids)).all()
        allowed_user_ids = [r[0] for r in allowed_users]
        
        query = db.query(DocumentModel.id).filter(DocumentModel.uploaded_by.in_(allowed_user_ids))
        
        # Only published documents are searchable by general employees
        if user.role not in ("Super Admin", "Admin", "Department Manager"):
            query = query.filter(DocumentModel.approval_status == "Published")
            
        # Enforce active statuses for regular personnel
        if user.role in ("Super Admin", "Admin", "Department Manager"):
            # Admins & managers can view everything except deleted files
            query = query.filter(DocumentModel.status != "Deleted")
        else:
            # Engineers, Technicians, Viewers, Auditors can only access fully active Uploaded files
            query = query.filter(DocumentModel.status == "Uploaded")

        # Exclude deleted_at
        query = query.filter(DocumentModel.deleted_at.is_(None))
        
        if filter_category:
            query = query.filter(DocumentModel.category == filter_category)
            
        doc_ids = [row[0] for row in query.all()]
        return doc_ids

    @classmethod
    def retrieve_relevant_chunks(
        cls,
        db: Session,
        user: User,
        query_text: str,
        limit: int = 5,
        asset_tag: Optional[str] = None,
        category: Optional[str] = None,
        workspace_uuid: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Embeds query, fetches matching vector chunks, and applies permission & workspace filters.
        """
        logger.info("retrieving_rag_context", query=query_text, user=user.email, role=user.role, asset=asset_tag, workspace=workspace_uuid)

        # 1. Get permitted documents list
        permitted_doc_ids = cls.get_permitted_document_ids(db, user, filter_category=category)
        if not permitted_doc_ids:
            logger.warning("no_authorized_documents_available_for_search", user=user.email)
            return []

        # 2. Scope search strictly within workspace if provided
        if workspace_uuid:
            from app.models.workspace import Workspace
            ws = db.query(Workspace).filter(Workspace.uuid == workspace_uuid).first()
            if ws:
                ws_doc_ids = {doc.id for doc in ws.documents}
                permitted_doc_ids = [did for did in permitted_doc_ids if did in ws_doc_ids]
                if not permitted_doc_ids:
                    logger.warning("no_documents_linked_to_workspace_found_in_permissions", workspace=ws.name)
                    return []
            else:
                logger.warning("workspace_uuid_filter_requested_but_not_found", uuid=workspace_uuid)
                return []

        # 3. Compute embedding vector
        try:
            query_embedding = EmbeddingGenerator.generate_embedding(query_text)
        except Exception as e:
            logger.error("retriever_failed_to_generate_query_embedding", error=str(e))
            return []

        # 4. Perform PGVector similarity search bounded by document permissions and workspace scope
        results = VectorStore.similarity_search(
            db=db,
            query_embedding=query_embedding,
            limit=limit,
            document_ids=permitted_doc_ids,
            asset_tag=asset_tag
        )
        
        return results

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.document import DocumentModel
from app.ai.retriever import Retriever
from app.ai.schemas import SemanticSearchResponse, SearchResultChunk, DocumentReference

class SemanticSearchEngine:
    """Orchestrates multi-filter vector similarity search across permitted database files."""

    @classmethod
    def execute_search(
        cls,
        db: Session,
        user: User,
        query: str,
        asset: Optional[str] = None,
        category: Optional[str] = None,
        plant_location: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        workspace_uuid: Optional[str] = None,
        limit: int = 5
    ) -> SemanticSearchResponse:
        """
        Executes query embedding generation and similarity comparison.
        Applies date, location, category, asset, and workspace filters during search retrieval.
        """
        # 1. Fetch authorized document IDs based on user role (RBAC)
        permitted_doc_ids = Retriever.get_permitted_document_ids(db, user, filter_category=category)
        if not permitted_doc_ids:
            return SemanticSearchResponse(query=query, results=[])

        # 2. Scope search strictly within workspace if provided
        if workspace_uuid:
            from app.models.workspace import Workspace
            ws = db.query(Workspace).filter(Workspace.uuid == workspace_uuid).first()
            if ws:
                ws_doc_ids = {doc.id for doc in ws.documents}
                permitted_doc_ids = [did for did in permitted_doc_ids if did in ws_doc_ids]
                if not permitted_doc_ids:
                    return SemanticSearchResponse(query=query, results=[])
            else:
                return SemanticSearchResponse(query=query, results=[])

        # 3. Filter document IDs further based on location and date if supplied
        filter_query = db.query(DocumentModel.id).filter(DocumentModel.id.in_(permitted_doc_ids))
        
        if plant_location:
            filter_query = filter_query.filter(DocumentModel.plant_location.ilike(f"%{plant_location}%"))
            
        if start_date:
            try:
                from datetime import datetime
                s_dt = datetime.fromisoformat(start_date)
                filter_query = filter_query.filter(DocumentModel.created_at >= s_dt)
            except ValueError:
                pass
                
        if end_date:
            try:
                from datetime import datetime
                e_dt = datetime.fromisoformat(end_date)
                filter_query = filter_query.filter(DocumentModel.created_at <= e_dt)
            except ValueError:
                pass
                
        filtered_doc_ids = [row[0] for row in filter_query.all()]
        if not filtered_doc_ids:
            return SemanticSearchResponse(query=query, results=[])

        # 3. Retrieve relevant vector chunks via Retriever
        # We pass filtered_doc_ids directly or limit the search space
        from app.ai.embeddings import EmbeddingGenerator
        from app.ai.vector_store import VectorStore
        
        try:
            query_embedding = EmbeddingGenerator.generate_embedding(query)
        except Exception:
            return SemanticSearchResponse(query=query, results=[])
            
        raw_results = VectorStore.similarity_search(
            db=db,
            query_embedding=query_embedding,
            limit=limit,
            document_ids=filtered_doc_ids,
            asset_tag=asset
        )

        # 4. Formulate SearchResultChunk list with hybrid multi-criteria ranking
        search_chunks = []
        for chunk, score in raw_results:
            # Fetch document information
            doc = db.query(DocumentModel).filter(DocumentModel.id == chunk.document_id).first()
            if not doc:
                continue
                
            # Base score is vector similarity
            hybrid_score = float(score)

            # 1. Equipment match bonus (+0.15)
            if asset:
                asset_clean = asset.strip().lower()
                equipment_mentioned = [e.lower() for e in chunk.chunk_metadata.get("equipment_mentioned", [])]
                if asset_clean in equipment_mentioned or asset_clean in chunk.text.lower():
                    hybrid_score += 0.15
            elif query:
                # Regex match tags
                import re
                tags = re.findall(r"\b(?:pump-p102|turbine-t203|boiler-b401|comp-c300|substation-e1)\b", query.lower())
                if tags:
                    primary_tag = tags[0].upper()
                    equipment_mentioned = [e.upper() for e in chunk.chunk_metadata.get("equipment_mentioned", [])]
                    if primary_tag in equipment_mentioned or primary_tag.lower() in chunk.text.lower():
                        hybrid_score += 0.15

            # 2. Plant / Location match bonus (+0.10)
            if plant_location and doc.plant or doc.plant_location:
                doc_p = (doc.plant or doc.plant_location or "").lower()
                if plant_location.lower() in doc_p:
                    hybrid_score += 0.10

            # 3. Recency bonus (up to +0.05)
            if doc.created_at:
                from datetime import datetime
                age_days = (datetime.utcnow() - doc.created_at).days
                recency_bonus = max(0.0, 0.05 * (1.0 - (min(365, age_days) / 365.0)))
                hybrid_score += recency_bonus

            # Cap the final score at 1.0 maximum
            final_score = min(1.0, hybrid_score)

            doc_ref = DocumentReference(
                id=doc.id,
                uuid=doc.uuid,
                document_name=doc.document_name,
                original_filename=doc.original_filename,
                page=chunk.page,
                category=doc.category
            )
            
            search_chunk = SearchResultChunk(
                chunk_id=chunk.chunk_id,
                text=chunk.text,
                page=chunk.page,
                score=final_score,
                document=doc_ref,
                section=chunk.chunk_metadata.get("section"),
                equipment_mentioned=chunk.chunk_metadata.get("equipment_mentioned", [])
            )
            search_chunks.append(search_chunk)
            
        # Re-sort chunks by the computed hybrid score descending
        search_chunks.sort(key=lambda x: -x.score)
        return SemanticSearchResponse(query=query, results=search_chunks)

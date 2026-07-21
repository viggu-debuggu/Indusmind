from typing import List, Tuple, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from app.models.ai import DocumentChunk
from app.models.document import DocumentModel
from app.core.logging import logger

class VectorStore:
    """Interacts with PostgreSQL pgvector table to store chunks and execute similarity searches."""

    @staticmethod
    def save_chunks(db: Session, chunks: List[dict]) -> None:
        """Saves a list of parsed document chunks with embeddings into the database."""
        if not chunks:
            return

        db_chunks = []
        for c in chunks:
            db_chunk = DocumentChunk(
                document_id=c["document_id"],
                chunk_id=c["chunk_id"],
                embedding=c["embedding"],
                page=c["page"],
                text=c["text"],
                chunk_metadata=c["chunk_metadata"]
            )
            db_chunks.append(db_chunk)
            
        try:
            db.add_all(db_chunks)
            db.commit()
            logger.info("saved_document_chunks_to_pgvector", count=len(chunks), document_id=chunks[0]["document_id"])
        except Exception as e:
            db.rollback()
            logger.error("failed_to_save_chunks_to_pgvector", error=str(e))
            raise RuntimeError(f"Database vector insertion failed: {str(e)}")

    @staticmethod
    def purge_document_chunks(db: Session, document_id: int) -> int:
        """Deletes all vector chunks associated with a document ID (e.g. for reindexing)."""
        try:
            deleted_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
            db.commit()
            logger.info("purged_document_chunks_from_pgvector", document_id=document_id, count=deleted_count)
            return deleted_count
        except Exception as e:
            db.rollback()
            logger.error("failed_to_purge_document_chunks", document_id=document_id, error=str(e))
            raise RuntimeError(f"Database vector purge failed: {str(e)}")

    @staticmethod
    def purge_all_chunks(db: Session) -> int:
        """Purges all vector embeddings from pgvector database table."""
        try:
            deleted_count = db.query(DocumentChunk).delete()
            db.commit()
            logger.info("purged_all_document_chunks_from_pgvector", count=deleted_count)
            return deleted_count
        except Exception as e:
            db.rollback()
            logger.error("failed_to_purge_all_document_chunks", error=str(e))
            raise RuntimeError(f"Database general vector purge failed: {str(e)}")

    @staticmethod
    def similarity_search(
        db: Session,
        query_embedding: List[float],
        limit: int = 5,
        document_ids: Optional[List[int]] = None,
        asset_tag: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Runs Cosine Similarity vector search on document chunks.
        Applies document ID scopes and machinery tag metadata filters if supplied.
        """
        # Distance operator in pgvector is <=> (cosine distance).
        # Cosine distance = 1 - cosine similarity.
        # We query and order by cosine distance.
        query = db.query(DocumentChunk)
        
        # Apply document scope filtering if specified (e.g. check RBAC or search context)
        if document_ids is not None:
            query = query.filter(DocumentChunk.document_id.in_(document_ids))
            
        # Execute search query
        # Fetch the entities along with their cosine distance
        cosine_dist_expr = DocumentChunk.embedding.cosine_distance(query_embedding)
        
        results = (
            query.order_by(cosine_dist_expr.asc())
            .limit(limit * 2)  # retrieve excess for metadata filtering
            .all()
        )
        
        scored_results = []
        for chunk in results:
            # Re-read distance
            # SQLAlchemy computes distance if we query it, or we can compute manually:
            # Let's compute similarity score percentage:
            # distance ranges from 0.0 to 2.0. Similarity ranges from 1.0 to -1.0.
            # In SQLAlchemy we can compute distance by evaluating column attribute or running math
            # Let's run a simple math function on the DB session if we query it,
            # but we can get it via a raw query or manually compute cosine similarity in Python.
            # Since distance calculation in python is easy and fast, let's just do that or fetch it.
            # Wait, let's let SQL do the distance:
            pass

        # Let's perform a query that returns both the chunk and the distance directly from Postgres:
        # SELECT chunk, distance
        distance_query = (
            db.query(DocumentChunk, cosine_dist_expr.label("distance"))
        )
        
        if document_ids is not None:
            distance_query = distance_query.filter(DocumentChunk.document_id.in_(document_ids))
            
        results = (
            distance_query.order_by(cosine_dist_expr.asc())
            .limit(limit * 3) # fetch a slightly larger window to apply post-filtering
            .all()
        )
        
        filtered_results = []
        for chunk, distance in results:
            # If asset tag is provided, check if it's in the chunk's text or metadata lists
            if asset_tag:
                # Check text or equipment_mentioned tags
                lower_text = chunk.text.lower()
                metadata_spanned = chunk.chunk_metadata.get("equipment_mentioned", [])
                
                # Check case-insensitive match
                if asset_tag.lower() not in lower_text and not any(tag.lower() == asset_tag.lower() for tag in metadata_spanned):
                    continue
            
            # Convert cosine distance to cosine similarity (0 to 1) and then to percentage score (0-100)
            # Distance: 0 = identical, 1 = orthogonal, 2 = opposite.
            # similarity = 1.0 - distance
            similarity = 1.0 - float(distance) if distance is not None else 0.0
            score_pct = max(0, min(100, int(similarity * 100)))
            
            filtered_results.append((chunk, score_pct))
            
            if len(filtered_results) >= limit:
                break
                
        return filtered_results

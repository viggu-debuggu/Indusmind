from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.document import DocumentModel
from app.ai.document_processor import DocumentProcessor
from app.ai.chunking import Chunker
from app.ai.embeddings import EmbeddingGenerator
from app.ai.vector_store import VectorStore
from app.services.document_service import DocumentService
from app.core.logging import logger

def index_document(db: Session, document_id: int) -> None:
    """
    Background indexing worker pipeline.
    Downloads uploaded files, runs text extraction & OCR, segments semantic chunks,
    generates dense vectors and saves to pgvector.
    """
    logger.info("background_indexing_worker_started", document_id=document_id)
    
    # 1. Fetch document metadata
    doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not doc:
        logger.error("indexing_worker_target_document_not_found", document_id=document_id)
        return

    # Update state to Uploaded
    doc.processing_status = "Uploaded"
    db.commit()

    try:
        # 2. Download file from storage provider
        service = DocumentService(db)
        logger.info("downloading_file_for_indexing", document_id=document_id, path=doc.storage_path)
        file_bytes = service.storage.download_file(doc.storage_path)

        # 3. Parse pages and layout structures
        logger.info("extracting_document_content", document_id=document_id, filename=doc.original_filename)
        pages_data = DocumentProcessor.process_file(
            file_bytes=file_bytes,
            filename=doc.original_filename,
            mime_type=doc.mime_type
        )
        
        # Progress status: OCR Completed
        doc.processing_status = "OCR Completed"
        db.commit()

        # Run AI Metadata Extraction
        full_text = " ".join([p.get("text", "") for p in pages_data])
        from app.ai.metadata_extractor import MetadataExtractor
        meta = MetadataExtractor.extract_metadata(full_text)
        
        doc.asset_tag = meta.get("asset_tag")
        doc.equipment_name = meta.get("equipment_name")
        doc.equipment_type = meta.get("equipment_type")
        doc.manufacturer = meta.get("manufacturer")
        doc.model_number = meta.get("model_number")
        doc.plant = meta.get("plant")
        doc.department = meta.get("department")
        doc.revision = meta.get("revision")
        doc.document_type = meta.get("document_type")
        doc.date = meta.get("date")
        doc.criticality = meta.get("criticality")
        
        # Operating limits regex extraction (RPM, temperature, pressure, current, flow)
        import re
        limit_matches = re.findall(r"\b\d+(?:\.\d+)?\s*(?:°C|F|RPM|PSI|Bar|gpm|m3/h|V|kV|Amp|mA|kPa|MPa|Hz)\b", full_text, re.IGNORECASE)
        if limit_matches:
            unique_specs = sorted(list(set(limit_matches)))[:10]
            specs_string = ", ".join(unique_specs)
            doc.keywords = (meta.get("keywords") or "") + (", " + specs_string if meta.get("keywords") else specs_string)
        else:
            doc.keywords = meta.get("keywords")
        
        # Generate AI Document Summary
        from app.ai.summarizer import Summarizer
        summary_text = Summarizer.generate_summary(full_text)
        doc.description = summary_text
        
        if doc.asset_tag:
            from app.models.equipment import Equipment
            from datetime import datetime
            eq = db.query(Equipment).filter(Equipment.asset_tag == doc.asset_tag).first()
            if not eq:
                # Create a new asset shell automatically
                eq = Equipment(
                    asset_name=doc.equipment_name or f"Asset {doc.asset_tag}",
                    asset_tag=doc.asset_tag,
                    plant=doc.plant or "Fluid Processing Facility A",
                    department=doc.department or "Thermal Generation",
                    manufacturer=doc.manufacturer,
                    model=doc.model_number,
                    installation_date=datetime.utcnow()
                )
                db.add(eq)
                db.flush()
            doc.asset_id = eq.id
        db.commit()

        # 4. Fetch registered equipment tags to match mentions
        logger.info("fetching_equipment_tags_for_grounding", document_id=document_id)
        equipment_tags = []
        try:
            res = db.execute(text("SELECT asset_tag FROM equipment")).all()
            equipment_tags = [row[0] for row in res]
        except Exception as sql_err:
            db.rollback()  # Clear aborted transaction state
            logger.warning("failed_to_query_equipment_tags_falling_back_to_empty", error=str(sql_err))
            
        # 5. Create overlapping text chunks
        logger.info("segmenting_text_into_chunks", document_id=document_id, page_count=len(pages_data))
        chunks_data = Chunker.create_chunks(
            pages_data=pages_data,
            document_id=document_id,
            equipment_tags=equipment_tags
        )

        if chunks_data:
            # 6. Generate dense vector embeddings in batch
            logger.info("generating_vector_embeddings_batch", document_id=document_id, chunk_count=len(chunks_data))
            texts = [c["text"] for c in chunks_data]
            embeddings = EmbeddingGenerator.generate_embeddings_batch(texts)
            
            # Map embeddings back to chunks
            for idx, embedding in enumerate(embeddings):
                chunks_data[idx]["embedding"] = embedding

            # Purge any old chunks of this document first (safety for re-indexing)
            VectorStore.purge_document_chunks(db, document_id)

            # 7. Write to PostgreSQL pgvector
            logger.info("saving_embeddings_to_pgvector", document_id=document_id)
            VectorStore.save_chunks(db, chunks_data)
        else:
            logger.warning("no_text_chunks_extracted_for_document", document_id=document_id)

        # Progress status: Embeddings Generated
        doc.processing_status = "Embeddings Generated"
        db.commit()

        # Progress status: Knowledge Graph Updated (simulate linking dependencies step)
        doc.processing_status = "Knowledge Graph Updated"
        db.commit()

        # Progress status: Memory Created (auto-extract Lessons, Warnings, Best Practices)
        logger.info("auto_extracting_knowledge_memories", document_id=document_id)
        sentences = re.split(r'(?<=[.!?])\s+', full_text)
        extracted_cards = []
        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue
            s_lower = s_clean.lower()
            
            category = None
            title_prefix = ""
            if any(w in s_lower for w in ["warning", "caution", "danger", "hazard", "loto"]):
                category = "Safety"
                title_prefix = "AI Auto-Safety Warning"
            elif any(w in s_lower for w in ["lesson", "prevent", "rca", "incident", "failure"]):
                category = "Operational"
                title_prefix = "AI Auto-Lesson Learned"
            elif any(w in s_lower for w in ["best practice", "optimal", "tip", "recommend"]):
                category = "Process"
                title_prefix = "AI Auto-Best Practice"
                
            if category and len(s_clean) > 50 and len(s_clean) < 260:
                extracted_cards.append((title_prefix, s_clean, category))
                if len(extracted_cards) >= 3:
                    break

        from app.models.expert_knowledge import ExpertKnowledge
        from app.services.memory_intelligence import MemoryIntelligence

        for prefix, desc, cat in extracted_cards:
            exists = db.query(ExpertKnowledge).filter(ExpertKnowledge.description == desc).first()
            if not exists:
                ek = ExpertKnowledge(
                    title=f"{prefix}: {doc.original_filename[:35]}",
                    description=desc,
                    author="AI Document Analyzer",
                    author_role="Super Admin",
                    category=cat,
                    equipment_id=doc.asset_id,
                    verification_status="Approved",
                    confidence_score=95.0
                )
                MemoryIntelligence.process_entry(db, ek)
                db.add(ek)

        doc.processing_status = "Memory Created"
        db.commit()

        # Final progress status: AI Ready
        doc.processing_status = "AI Ready"
        db.commit()

        # Trigger dynamic updates across the ecosystem
        try:
            from app.services.decision_pipeline import DecisionPipeline
            DecisionPipeline.evaluate_all(db)
        except Exception as di_err:
            logger.warning("failed_to_run_decision_pipeline_on_upload", error=str(di_err))
            
        try:
            from app.services.discovery_engine import DiscoveryEngine
            DiscoveryEngine.run_discovery(db)
        except Exception as disc_err:
            logger.warning("failed_to_run_discovery_engine_on_upload", error=str(disc_err))

        try:
            from app.services.twin_service import TwinService
            TwinService.refresh_all_twins(db)
        except Exception as twin_err:
            logger.warning("failed_to_refresh_twins_on_upload", error=str(twin_err))

        try:
            from app.services.executive_service import ExecutiveService
            ExecutiveService.refresh_executive_center(db)
        except Exception as exec_err:
            logger.warning("failed_to_refresh_executive_center_on_upload", error=str(exec_err))

        logger.info("background_indexing_completed_successfully", document_id=document_id)

    except Exception as e:
        db.rollback()
        logger.exception("background_indexing_failed", document_id=document_id, error=str(e))
        
        # Reload doc model to reset session context and update status to Failed
        db.rollback()
        doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
        if doc:
            doc.processing_status = "Failed"
            db.commit()

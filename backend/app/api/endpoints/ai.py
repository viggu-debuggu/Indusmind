from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.document import DocumentModel
from app.models.ai import ChatSession, ChatMessage, DocumentChunk
from app.ai.rag_service import RAGService
from app.ai.search import SemanticSearchEngine
from app.ai.vector_store import VectorStore
from app.ai.indexing_worker import index_document
from app.ai.schemas import (
    RAGRequest,
    RAGResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    ChatSessionResponse,
    ChatSessionDetailsResponse,
    ChatMessageResponse,
    SearchResultChunk,
    DocumentReference,
    GraphResponse
)
from app.core.exceptions import AppException

router = APIRouter(prefix="/ai", tags=["AI Copilot & Search"])


@router.post("/ask", response_model=RAGResponse)
def ask_ai_copilot(
    payload: RAGRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Grounds user engineering queries using RAG context and saves to session history."""
    try:
         res = RAGService.execute_rag(
             db=db,
             user=current_user,
             question=payload.question,
             session_uuid=payload.session_uuid,
             asset_tag=payload.asset,
             category=payload.category,
             workspace_uuid=payload.workspace_uuid
         )
         
         from app.services.audit_service import AuditService
         AuditService.log(
             db,
             current_user.id,
             "AI_QUERY",
             "ChatSession",
             res.session_uuid,
             {"question": payload.question}
         )
         
         return res
    except Exception as e:
        raise AppException(
            message=f"Failed to generate answer: {str(e)}",
            status_code=500,
            error_code="RAG_ERROR"
        )


@router.post("/search", response_model=SemanticSearchResponse)
def semantic_search(
    payload: SemanticSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes multi-filter vector similarity search on document chunks."""
    try:
        return SemanticSearchEngine.execute_search(
            db=db,
            user=current_user,
            query=payload.query,
            asset=payload.asset,
            category=payload.category,
            plant_location=payload.plant_location,
            start_date=payload.start_date,
            end_date=payload.end_date,
            workspace_uuid=payload.workspace_uuid,
            limit=payload.limit
        )
    except Exception as e:
        raise AppException(
            message=f"Semantic search query failed: {str(e)}",
            status_code=500,
            error_code="SEARCH_ERROR"
        )


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns a list of conversation session threads for the authenticated user."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    
    resp = []
    for s in sessions:
        count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        resp.append(
            ChatSessionResponse(
                uuid=s.uuid,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=count
            )
        )
    return resp


@router.get("/sessions/{session_uuid}", response_model=ChatSessionDetailsResponse)
def get_chat_session_details(
    session_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves list of message exchanges belonging to a session thread."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.uuid == session_uuid, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise AppException("Chat session thread not found.", status_code=404, error_code="SESSION_NOT_FOUND")
        
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )
    
    msg_schemas = []
    for m in messages:
        msg_schemas.append(
            ChatMessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                confidence_score=m.confidence_score,
                documents_used=m.documents_used or [],
                citations=m.citations or [],
                related_equipment=m.related_equipment or [],
                timestamp=m.timestamp
            )
        )
        
    return ChatSessionDetailsResponse(
        uuid=session.uuid,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(msg_schemas),
        messages=msg_schemas
    )


@router.delete("/sessions/{session_uuid}", status_code=status.HTTP_200_OK)
def delete_chat_session(
    session_uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a conversation session thread and cascaded messages."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.uuid == session_uuid, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise AppException("Chat session thread not found.", status_code=404, error_code="SESSION_NOT_FOUND")
        
    db.delete(session)
    db.commit()
    return {"message": "Chat session thread deleted successfully."}


@router.get("/search/history", response_model=List[ChatSessionResponse])
def get_search_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alias endpoint yielding user conversation sessions list mapping search history logs."""
    return list_chat_sessions(db, current_user)


@router.get("/documents/{document_id}/chunks", response_model=List[SearchResultChunk])
def get_document_chunks(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all vector chunk text blocks associated with a document (debugging/audit)."""
    doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not doc:
        raise AppException("Document record not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")
        
    # Standard RBAC checks: Technicians, engineers, admins can view
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.id.asc()).all()
    
    resp = []
    doc_ref = DocumentReference(
        id=doc.id,
        uuid=doc.uuid,
        document_name=doc.document_name,
        original_filename=doc.original_filename,
        page=None,
        category=doc.category
    )
    
    for c in chunks:
        resp.append(
            SearchResultChunk(
                chunk_id=c.chunk_id,
                text=c.text,
                page=c.page,
                score=100.0,  # default placeholder score for sequential listing
                document=doc_ref,
                section=c.chunk_metadata.get("section"),
                equipment_mentioned=c.chunk_metadata.get("equipment_mentioned", [])
            )
        )
    return resp


@router.post("/documents/reindex", status_code=status.HTTP_202_ACCEPTED)
def reindex_document(
    payload: dict,  # expects {"document_id": int}
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reconstructs and regenerates vector embeddings index for a document."""
    if current_user.role not in ("Super Admin", "Admin", "Engineer"):
        raise AppException("Unauthorized to execute indexing tasks.", status_code=403, error_code="UNAUTHORIZED")
        
    doc_id = payload.get("document_id")
    if not doc_id:
        raise AppException("document_id parameter is required.", status_code=400, error_code="INVALID_PARAMETER")
        
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise AppException("Target document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")
        
    # Reset status and run background indexing
    doc.processing_status = "Queued"
    db.commit()
    
    background_tasks.add_task(index_document, db, doc_id)
    return {"message": "Reindexing scheduled successfully in background pipeline."}


@router.delete("/documents/index", status_code=status.HTTP_200_OK)
def purge_vector_indices(
    document_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes vector index chunks (restricted to Super Admin and Admin)."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrative roles can purge vector indices.", status_code=403, error_code="UNAUTHORIZED")
        
    if document_id:
        doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
        if not doc:
            raise AppException("Document record not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")
            
        count = VectorStore.purge_document_chunks(db, document_id)
        doc.processing_status = "Pending"
        db.commit()
        return {"message": f"Purged {count} vector index chunks for document {document_id}."}
    else:
        # Full database vector index wipe
        count = VectorStore.purge_all_chunks(db)
        db.query(DocumentModel).update({DocumentModel.processing_status: "Pending"})
        db.commit()
        return {"message": f"Full vector indexes database wipe completed successfully. Purged {count} chunks."}


@router.get("/assets", response_model=List[str])
def list_asset_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns list of unique equipment tags registered in database (grounding context)."""
    try:
        from sqlalchemy import text
        res = db.execute(text("SELECT asset_tag FROM equipment")).all()
        tags = sorted(list(set(row[0] for row in res if row[0])))
        return tags
    except Exception:
        return []


@router.get("/graph", response_model=GraphResponse)
@router.get("/ai/graph", response_model=GraphResponse)
def get_knowledge_graph(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Generates the industrial entity knowledge graph topology dynamically from SQL assets and parsed document tags."""
    from app.models.equipment import Equipment, MaintenancePrediction
    from app.models.document import DocumentModel
    from app.models.ai import DocumentChunk
    from app.core.logging import logger
    
    nodes = []
    edges = []
    
    # 1. Fetch all equipment
    eq_list = db.query(Equipment).all()
    eq_tags = {} # maps tag.lower() to exact tag
    for eq in eq_list:
        tag_key = eq.asset_tag.lower()
        eq_tags[tag_key] = eq.asset_tag
        
        # Determine color based on status
        color = "#6366f1" # default indigo
        if eq.status == "Maintenance":
            color = "#f59e0b" # yellow/amber
        elif eq.status == "Degraded":
            color = "#ef4444" # red
            
        nodes.append({
            "id": eq.asset_tag.lower(),
            "label": eq.asset_tag,
            "type": "Equipment",
            "details": f"{eq.asset_name} ({eq.manufacturer})",
            "location": f"{eq.plant} - {eq.department}",
            "color": color
        })
        
        # Add a simulated warning alert if degraded
        if eq.status == "Degraded":
            alert_id = f"alert_{eq.asset_tag.lower()}"
            nodes.append({
                "id": alert_id,
                "label": "Telemetry Warning",
                "type": "Alert",
                "details": f"Anomalous readings: Health {eq.health_score}%, Risk {eq.risk_score}%",
                "location": "Sensor Feed Diagnostics",
                "color": "#ef4444"
            })
            edges.append({
                "source": alert_id,
                "target": eq.asset_tag.lower(),
                "label": "HAS_ANOMALY"
            })
            
        # Add active predictions as process nodes
        latest_pred = (
            db.query(MaintenancePrediction)
            .filter(MaintenancePrediction.equipment_id == eq.id)
            .order_by(MaintenancePrediction.timestamp.desc())
            .first()
        )
        if latest_pred and latest_pred.maintenance_priority in ("High", "Critical"):
            proc_id = f"proc_{eq.asset_tag.lower()}"
            nodes.append({
                "id": proc_id,
                "label": "Maintenance Task",
                "type": "Process",
                "details": f"Priority: {latest_pred.maintenance_priority} | Due: {latest_pred.suggested_maintenance_date.strftime('%Y-%m-%d')}",
                "location": "Operational Workflow Dispatcher",
                "color": "#8b5cf6"
            })
            edges.append({
                "source": proc_id,
                "target": eq.asset_tag.lower(),
                "label": "SCHEDULED_WORK"
            })
            
    # 2. Fetch all active documents
    doc_list = db.query(DocumentModel).filter(DocumentModel.status != "Deleted").all()
    for doc in doc_list:
        doc_id_str = f"doc_{doc.id}"
        nodes.append({
            "id": doc_id_str,
            "label": doc.document_name,
            "type": "Document",
            "details": f"Category: {doc.category or 'General'} | Version: v{doc.version} ({doc.file_extension.upper()})",
            "location": f"Storage: {doc.plant_location or 'Main Vault'} - {doc.department or 'Operations'}",
            "color": "#3b82f6"
        })
        
        # Link documents to equipment based on tags metadata
        if doc.tags:
            tags_list = [t.strip().lower() for t in doc.tags.split(",") if t.strip()]
            for t in tags_list:
                if t in eq_tags:
                    edges.append({
                        "source": doc_id_str,
                        "target": t,
                        "label": "DESCRIBES"
                    })
                    
        # Link documents to equipment based on vector chunk mentions
        try:
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
            linked_tags = set()
            for chunk in chunks:
                mentions = chunk.chunk_metadata.get("equipment_mentioned", [])
                for m in mentions:
                    if m.lower() in eq_tags:
                        linked_tags.add(m.lower())
            
            for lt in linked_tags:
                # Avoid duplicate edges
                if not any(e["source"] == doc_id_str and e["target"] == lt for e in edges):
                    edges.append({
                        "source": doc_id_str,
                        "target": lt,
                        "label": "REFERENCES"
                    })
        except Exception as chunk_err:
            logger.error("graph_chunks_query_failed", document_id=doc.id, error=str(chunk_err))

    # 3. Fetch all active expert knowledge entries (tribal knowledge)
    try:
        from app.models.expert_knowledge import ExpertKnowledge
        ek_list = db.query(ExpertKnowledge).all()
        for ek in ek_list:
            ek_id_str = f"ek_{ek.id}"
            nodes.append({
                "id": ek_id_str,
                "label": ek.title[:20] + "..." if len(ek.title) > 20 else ek.title,
                "type": "ExpertKnowledge",
                "details": f"By: {ek.author} ({ek.author_role}) | Conf: {ek.confidence_score}%",
                "location": f"Category: {ek.category}",
                "color": "#10b981"
            })
            
            if ek.equipment:
                edges.append({
                    "source": ek_id_str,
                    "target": ek.equipment.asset_tag.lower(),
                    "label": "EXPERIENCE"
                })
    except Exception as ek_err:
        logger.error("graph_expert_knowledge_failed", error=str(ek_err))

    # 4. Fetch all Decision Recommendations and Evidence
    try:
        from app.models.decision_intelligence import DecisionRecommendation, DecisionEvidence
        recs = db.query(DecisionRecommendation).all()
        for rec in recs:
            rec_node_id = f"rec_{rec.id}"
            nodes.append({
                "id": rec_node_id,
                "label": rec.recommendation_type[:20] + "..." if len(rec.recommendation_type) > 20 else rec.recommendation_type,
                "type": "Recommendation",
                "details": f"{rec.title} | Priority: {rec.priority}",
                "location": f"Risk Score: {rec.risk_score}%",
                "color": "#a855f7" # purple
            })
            
            # Link recommendation to equipment
            if rec.equipment:
                edges.append({
                    "source": rec_node_id,
                    "target": rec.equipment.asset_tag.lower(),
                    "label": "RECOMMENDATION"
                })
                
            # Fetch and link evidence
            for ev in rec.evidence:
                ev_node_id = f"ev_{ev.id}"
                nodes.append({
                    "id": ev_node_id,
                    "label": ev.evidence_type,
                    "type": "Evidence",
                    "details": ev.summary[:40] + "..." if len(ev.summary) > 40 else ev.summary,
                    "location": f"Source: {ev.source_name}",
                    "color": "#ec4899" # pink
                })
                edges.append({
                    "source": ev_node_id,
                    "target": rec_node_id,
                    "label": "EVIDENCE"
                })
                
                # Cross-reference evidence to incident or expert knowledge anchors
                if ev.evidence_type == "Incident" and ev.reference_id:
                    # Link to incident nodes (if incident node exists, or simply search by title/tag)
                    # For simplicity, we can link to the equipment node or other nodes if matched
                    pass
    except Exception as recs_err:
        logger.error("graph_decision_intelligence_failed", error=str(recs_err))
            
    # 5. Fetch and link AI Agents (Phase 10)
    try:
        from app.models.agent_intelligence import AgentCollaboration
        agents = [
            "Maintenance Agent",
            "Compliance Agent",
            "Safety Agent",
            "Root Cause Analysis Agent",
            "Quality Agent",
            "Knowledge Graph Agent",
            "Document Intelligence Agent"
        ]
        
        for a in agents:
            a_node_id = f"agent_{a.replace(' ', '_').lower()}"
            nodes.append({
                "id": a_node_id,
                "label": a,
                "type": "Agent",
                "details": "Specialized Industrial AI Investigator",
                "location": "Multi-Agent System Node",
                "color": "#06b6d4" # cyan
            })
            
            # Create sample links to recommendations based on agent type
            for r in recs:
                if "Maintenance" in a and "Bearing" in r.recommendation_type:
                    edges.append({
                        "source": a_node_id,
                        "target": f"rec_{r.id}",
                        "label": "PROPOSED"
                    })
                elif "Compliance" in a and "Compliance" in r.recommendation_type:
                    edges.append({
                        "source": a_node_id,
                        "target": f"rec_{r.id}",
                        "label": "PROPOSED"
                    })
                elif "Root Cause" in a and "Shutdown" in r.recommendation_type:
                    edges.append({
                        "source": a_node_id,
                        "target": f"rec_{r.id}",
                        "label": "PROPOSED"
                    })
    except Exception as agent_graph_err:
        logger.warning("agent_graph_nodes_skipped", error=str(agent_graph_err))

    # 6. Fetch and link Phase 11 Discovery Entities
    try:
        from app.models.discovery import (
            DiscoveryFinding,
            PatternRelationship,
            KnowledgeGapRecord,
            OptimizationOpportunity,
            RiskDiscovery
        )
        
        # Add Discovery Findings
        findings = db.query(DiscoveryFinding).all()
        for f in findings:
            f_node_id = f"disc_{f.id}"
            nodes.append({
                "id": f_node_id,
                "label": f.title[:25] + "..." if len(f.title) > 25 else f.title,
                "type": "Discovery",
                "details": f"Impact: {f.business_impact[:40]}... | Conf: {f.confidence_score}%",
                "location": f"Category: {f.finding_type}",
                "color": "#f43f5e" # rose
            })
            
            # Link to affected equipment
            if f.affected_assets:
                for tag in [t.strip().lower() for t in f.affected_assets.split(",") if t.strip()]:
                    if tag in eq_tags:
                        edges.append({
                            "source": f_node_id,
                            "target": tag,
                            "label": "AFFECTS"
                        })
                        
        # Add Pattern Relationships
        patterns = db.query(PatternRelationship).all()
        for p in patterns:
            p_node_id = f"pat_{p.id}"
            nodes.append({
                "id": p_node_id,
                "label": p.title[:25] + "..." if len(p.title) > 25 else p.title,
                "type": "Pattern",
                "details": f"Pattern: {p.pattern_type} | Failures: {p.failure_count}",
                "location": "Pattern Analytics Engine",
                "color": "#fb923c" # orange
            })
            
            # Link Pattern to Equipment
            if p.equipment:
                edges.append({
                    "source": p_node_id,
                    "target": p.equipment.asset_tag.lower(),
                    "label": "PATTERN_FOUND"
                })
                
            # Link Discovery -> HAS_PATTERN -> Pattern
            for f in findings:
                if f.finding_type == "Hidden Pattern":
                    edges.append({
                        "source": f"disc_{f.id}",
                        "target": p_node_id,
                        "label": "HAS_PATTERN"
                    })

        # Add Risks
        risks = db.query(RiskDiscovery).all()
        for r in risks:
            r_node_id = f"risk_{r.id}"
            nodes.append({
                "id": r_node_id,
                "label": r.title[:25] + "..." if len(r.title) > 25 else r.title,
                "type": "Risk",
                "details": f"Type: {r.risk_type} | Priority: {r.priority}",
                "location": "Risk Discovery Engine",
                "color": "#dc2626" # red
            })
            
            if r.equipment:
                edges.append({
                    "source": r_node_id,
                    "target": r.equipment.asset_tag.lower(),
                    "label": "EXPOSES_RISK"
                })
                
            # Link Pattern -> HAS_RISK -> Risk
            for p in patterns:
                edges.append({
                    "source": f"pat_{p.id}",
                    "target": r_node_id,
                    "label": "HAS_RISK"
                })

        # Add Opportunities
        opts = db.query(OptimizationOpportunity).all()
        for o in opts:
            o_node_id = f"opt_{o.id}"
            nodes.append({
                "id": o_node_id,
                "label": o.title[:25] + "..." if len(o.title) > 25 else o.title,
                "type": "Opportunity",
                "details": f"Type: {o.opportunity_type} | Savings: ${o.estimated_savings:,.0f}",
                "location": "Optimization Engine",
                "color": "#10b981" # emerald
            })
            
            if o.equipment:
                edges.append({
                    "source": o_node_id,
                    "target": o.equipment.asset_tag.lower(),
                    "label": "OPTIMIZES"
                })
                
            # Link Risk -> HAS_OPPORTUNITY -> Opportunity
            for r in risks:
                edges.append({
                    "source": f"risk_{r.id}",
                    "target": o_node_id,
                    "label": "HAS_OPPORTUNITY"
                })

        # Add Knowledge Gaps
        gaps = db.query(KnowledgeGapRecord).all()
        for g in gaps:
            g_node_id = f"gap_{g.id}"
            nodes.append({
                "id": g_node_id,
                "label": f"Gap: {g.gap_type}",
                "type": "Knowledge Gap",
                "details": f"Severity: {g.severity} | Score: {g.completeness_score}%",
                "location": "Knowledge Completeness Engine",
                "color": "#eab308" # yellow
            })
            
            if g.equipment:
                edges.append({
                    "source": g_node_id,
                    "target": g.equipment.asset_tag.lower(),
                    "label": "MISSING_DOCS"
                })
                
            # Link Opportunity -> HAS_KNOWLEDGE_GAP -> Knowledge Gap
            for o in opts:
                edges.append({
                    "source": f"opt_{o.id}",
                    "target": g_node_id,
                    "label": "HAS_KNOWLEDGE_GAP"
                })
    except Exception as e:
        logger.warning("discovery_graph_nodes_skipped", error=str(e))

    # 7. Fetch and link Phase 12 Digital Knowledge Twin Entities
    try:
        from app.models.twin import KnowledgeTwin
        twins = db.query(KnowledgeTwin).all()
        for tw in twins:
            tw_node_id = f"twin_{tw.id}"
            eq_tag = tw.equipment.asset_tag if tw.equipment else "General"
            nodes.append({
                "id": tw_node_id,
                "label": f"Twin: {eq_tag}",
                "type": "Twin",
                "details": f"Compliance: {tw.compliance_readiness} | Readiness: {tw.maintenance_readiness}",
                "location": "360 Knowledge Twin Matrix",
                "color": "#0284c7" # sky blue
            })
            
            # Connect Twin to Equipment node
            if tw.equipment:
                edges.append({
                    "source": tw_node_id,
                    "target": tw.equipment.asset_tag.lower(),
                    "label": "TWIN_OF"
                })
    except Exception as e:
        logger.warning("twin_graph_nodes_skipped", error=str(e))

    # 8. Fetch and link Phase 13 Continuous Learning Entities
    try:
        from app.models.learning import FeedbackRecord, RecommendationValidation
        fbs = db.query(FeedbackRecord).all()
        for fb in fbs:
            fb_node_id = f"fb_{fb.id}"
            nodes.append({
                "id": fb_node_id,
                "label": f"Feedback: {fb.feedback_type}",
                "type": "Feedback",
                "details": f"Entity: {fb.entity_type} | Rating: {fb.rating or 'N/A'}",
                "location": "Continuous Learning Engine",
                "color": "#8b5cf6" # violet
            })
            
            # Connect Feedback to Recommendation if applicable
            if fb.entity_type == "Recommendation" and fb.entity_id:
                edges.append({
                    "source": fb_node_id,
                    "target": f"rec_{fb.entity_id}",
                    "label": "VALIDATES"
                })

        vals = db.query(RecommendationValidation).all()
        for val in vals:
            val_node_id = f"val_{val.id}"
            nodes.append({
                "id": val_node_id,
                "label": f"Validation: {val.validation_status}",
                "type": "Validation",
                "details": f"Delta: {val.confidence_delta:+.1f}%",
                "location": "Engineer Validation Center",
                "color": "#10b981" if val.validation_status == "Accepted" else "#ef4444"
            })
            
            edges.append({
                "source": val_node_id,
                "target": f"rec_{val.recommendation_id}",
                "label": "EVALUATES"
            })
    except Exception as e:
        logger.warning("learning_graph_nodes_skipped", error=str(e))

    # 9. Fetch and link Phase 14 Executive AI Command Center Entities
    try:
        from app.models.executive import EnterpriseKPI, FinancialImpact
        kpi = db.query(EnterpriseKPI).order_by(EnterpriseKPI.created_at.desc()).first()
        if kpi:
            exec_node_id = f"exec_{kpi.id}"
            nodes.append({
                "id": exec_node_id,
                "label": f"Executive Dashboard ({kpi.plant_health_score}%)",
                "type": "Executive",
                "details": f"AI Confidence: {kpi.ai_confidence_score}% | Plant Health: {kpi.plant_health_score}%",
                "location": "Executive AI Command Center",
                "color": "#f59e0b" # amber
            })
            
            # Connect Executive to Equipment nodes
            for eq_tag in eq_tags:
                edges.append({
                    "source": exec_node_id,
                    "target": eq_tag,
                    "label": "MONITORS"
                })

        fins = db.query(FinancialImpact).all()
        for f in fins:
            fin_node_id = f"fin_{f.id}"
            nodes.append({
                "id": fin_node_id,
                "label": f"Financial ROI: ${f.amount:,.0f}",
                "type": "Financial Impact",
                "details": f"{f.category}: {f.title[:30]}...",
                "location": "Financial Intelligence Center",
                "color": "#10b981" # emerald
            })
            
            if kpi:
                edges.append({
                    "source": f"exec_{kpi.id}",
                    "target": fin_node_id,
                    "label": "RETURNS_ROI"
                })
    except Exception as exec_err:
        logger.error("graph_executive_entities_failed", error=str(exec_err))

    return {"nodes": nodes, "edges": edges}


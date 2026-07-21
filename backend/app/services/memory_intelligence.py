import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.ai.embeddings import EmbeddingGenerator
from app.models.expert_knowledge import ExpertKnowledge
from app.models.lessons_learned import IncidentRecord
from app.models.document import DocumentModel
from app.models.equipment import Equipment
from app.core.logging import logger

class MemoryIntelligence:
    """Automates cognitive processing of expert tribal knowledge cards upon save."""

    COMMON_INDUSTRIAL_WORDS = {
        "bearing", "cavitation", "impeller", "seal", "turbine", "boiler", 
        "valves", "shaft", "compressor", "leakage", "vibration", "overheating", 
        "pressure", "lubricant", "viscosity", "alignment", "voltage", "current", 
        "fuses", "insulation", "calibration", "corrosion", "thickness", "welding", 
        "thermal", "bypass", "exhaust", "coupling", "solenoid", "actuator"
    }

    @classmethod
    def process_entry(cls, db: Session, entry: ExpertKnowledge) -> None:
        """Processes the memory card: calculates embedding, extracts terms, links context, and scores confidence."""
        combined_text = f"{entry.title}. {entry.description}. Root Cause: {entry.root_cause or ''}"
        
        # 1. Compute Embedding vector (384 dimensions)
        try:
            embedding = EmbeddingGenerator.generate_embedding(combined_text)
            entry.embedding = embedding
        except Exception as e:
            logger.error("memory_intelligence_embedding_failed", error=str(e), entry_id=entry.id)
            entry.embedding = None

        # 2. Extract Industrial Keywords and Entities
        words = re.findall(r"\b[a-zA-Z]{3,}\b", combined_text.lower())
        matched_terms = [w for w in words if w in cls.COMMON_INDUSTRIAL_WORDS]
        entry.ai_keywords = ", ".join(sorted(list(set(matched_terms)))) if matched_terms else "General Operations"

        # Simple entity matcher: Capitalized words or specific patterns
        entities = re.findall(r"\b[A-Z][A-Z0-9\-]+\b|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", entry.description)
        unique_entities = sorted(list(set(entities)))
        # Filter entities to remove generic sentences start words
        filtered_entities = [ent for ent in unique_entities if len(ent) > 2 and ent not in ["The", "And", "This", "For", "With", "After"]]
        entry.ai_entities = ", ".join(filtered_entities) if filtered_entities else "Standard Maintenance"

        # 3. Generate AI Summary
        sentences = re.split(r'(?<=[.!?])\s+', entry.description.strip())
        if sentences:
            # Take first two sentences as summary
            summary = " ".join(sentences[:2])
            entry.ai_summary = summary if len(summary) < 200 else summary[:197] + "..."
        else:
            entry.ai_summary = entry.description[:150] + "..."

        # 4. Dynamically Compute Confidence Score
        score = 60.0 # base score
        if len(entry.description) > 150:
            score += 15.0 # details bonus
        if entry.author_role in ["Super Admin", "Chief Engineer", "Engineer", "Department Manager"]:
            score += 15.0 # credential bonus
        if entry.verification_status == "Approved":
            score += 10.0 # approved bonus
        entry.confidence_score = min(100.0, score)

    @classmethod
    def get_ai_recommendations(cls, db: Session, entry: ExpertKnowledge) -> Dict[str, Any]:
        """Finds similar incidents, related SOPs/manuals, and suggests preventive actions based on keywords."""
        recommendations = {
            "similar_experiences": [],
            "related_documents": [],
            "related_incidents": [],
            "suggested_preventive_actions": [],
            "confidence_score": entry.confidence_score,
            "evidence_used": []
        }

        # 1. Similar Experiences via Cosine Distance (if embedding exists)
        if entry.embedding is not None:
            cosine_dist_expr = ExpertKnowledge.embedding.cosine_distance(entry.embedding)
            similar_exp = (
                db.query(ExpertKnowledge, cosine_dist_expr.label("distance"))
                .filter(ExpertKnowledge.id != entry.id)
                .order_by(cosine_dist_expr.asc())
                .limit(3)
                .all()
            )
            for exp, distance in similar_exp:
                sim = 1.0 - float(distance) if distance is not None else 0.0
                score_pct = max(0, min(100, int(sim * 100)))
                recommendations["similar_experiences"].append({
                    "uuid": exp.uuid,
                    "title": exp.title,
                    "author": exp.author,
                    "match_score": score_pct
                })
                if score_pct > 70:
                    recommendations["evidence_used"].append(f"Matching tribal memory: '{exp.title}' ({score_pct}% match)")

        # 2. Related Documents (SOPs, manuals) via keyword search in tags/titles
        keywords_list = [k.strip() for k in (entry.ai_keywords or "").split(",") if k.strip()]
        if keywords_list:
            docs = db.query(DocumentModel).filter(DocumentModel.status != "Deleted").all()
            matching_docs = []
            for doc in docs:
                match_count = 0
                doc_title_lower = doc.document_name.lower()
                doc_tags_lower = (doc.tags or "").lower()
                for kw in keywords_list:
                    if kw in doc_title_lower or kw in doc_tags_lower:
                        match_count += 1
                if match_count > 0:
                    matching_docs.append((doc, match_count))
            
            # Sort by match counts descending
            matching_docs.sort(key=lambda x: -x[1])
            for doc, count in matching_docs[:3]:
                recommendations["related_documents"].append({
                    "id": doc.id,
                    "document_name": doc.document_name,
                    "category": doc.category or "General",
                    "version": doc.version
                })
                recommendations["evidence_used"].append(f"Grounded matching document: '{doc.document_name}' ({doc.category})")

        # 3. Related Incidents via keyword matches in cause/name
        if keywords_list:
            incidents = db.query(IncidentRecord).all()
            matching_incidents = []
            for inc in incidents:
                match_count = 0
                inc_name_lower = inc.incident_name.lower()
                inc_cause_lower = inc.cause.lower()
                for kw in keywords_list:
                    if kw in inc_name_lower or kw in inc_cause_lower:
                        match_count += 1
                if match_count > 0:
                    matching_incidents.append((inc, match_count))
                    
            matching_incidents.sort(key=lambda x: -x[1])
            for inc, count in matching_incidents[:3]:
                recommendations["related_incidents"].append({
                    "uuid": inc.uuid,
                    "incident_name": inc.incident_name,
                    "severity": inc.severity,
                    "status": inc.status
                })
                recommendations["evidence_used"].append(f"Correlated operational incident: '{inc.incident_name}' ({inc.severity})")

        # 4. Suggested Preventive Actions based on keywords & category
        if "bearing" in (entry.ai_keywords or "").lower():
            recommendations["suggested_preventive_actions"].append(
                "Establish quarterly oil sump viscosity scans and vibration diagnostics monitoring intervals."
            )
        if "cavitation" in (entry.ai_keywords or "").lower() or "pump" in entry.title.lower():
            recommendations["suggested_preventive_actions"].append(
                "Verify minimum net positive suction head (NPSH) limits on pump inlet gauges to preempt localized vacuum bubbles."
            )
        if "vibration" in (entry.ai_keywords or "").lower():
            recommendations["suggested_preventive_actions"].append(
                "Trigger automatic shutdown alarms when telemetry vibration exceeds 4.5 mm/s limit bounds."
            )
            
        # Standard safety recommendation fallback
        if not recommendations["suggested_preventive_actions"]:
            recommendations["suggested_preventive_actions"].append(
                f"Schedule routine inspection check-sheets matching the category: {entry.category} operations guidelines."
            )

        return recommendations

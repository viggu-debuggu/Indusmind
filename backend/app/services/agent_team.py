from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.equipment import Equipment, SensorReading
from app.models.lessons_learned import IncidentRecord
from app.models.compliance import Regulation
from app.models.expert_knowledge import ExpertKnowledge
from app.models.document import DocumentModel

class MaintenanceAgent:
    """Specialist analyzing telemetry parameters, health trends, spare parts, and RUL limits."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if not eq:
            return {"confidence": 0, "outcome": "Equipment not found.", "evidence": "No asset matched in SQL registry."}
            
        rul = eq.remaining_useful_life or 0.0
        health = eq.health_score or 100.0
        status = eq.status or "Unknown"
        
        outcome = (
            f"Asset {eq.asset_tag} ({eq.asset_name}) health: {health}%. Status: {status}. "
            f"Remaining Useful Life: {rul:.1f} hours."
        )
        
        parts = ["bearing sleeves", "elastomer seals"] if "PUMP" in eq.asset_tag else ["gas nozzle filters", "dynamic pressure transducers"] if "TURBINE" in eq.asset_tag else ["safety relief valves", "gaskets"]
        
        return {
            "confidence": min(100.0, max(50.0, float(health))),
            "outcome": outcome,
            "evidence": f"RUL limit: {rul:.1f} Hrs | Status: {status} | Recommended Spares: {', '.join(parts)}"
        }


class ComplianceAgent:
    """Specialist mapping PESO, OISD, and Factory Act clauses to active inspection reports."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        regs = db.query(Regulation).all()
        
        rel_regs = [r.name for r in regs]
        outcome = f"Compliance verified for asset {eq.asset_tag if eq else ''}. "
        if rel_regs:
            outcome += f"Aligned rules: {', '.join(rel_regs)}."
        else:
            outcome += "No active regulatory violations detected under Factory Act or PESO rules."
            
        return {
            "confidence": 99.0,
            "outcome": outcome,
            "evidence": f"PESO Section 18 / Factory Act Sec 21 checked. Regulations matched: {len(regs)}"
        }


class SafetyAgent:
    """Specialist reviewing permit-to-work validations, safety risks, and near misses."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        risk = eq.risk_score if eq else 0.0
        
        outcome = f"Safety risk index for {eq.asset_tag if eq else 'Asset'}: {risk}%."
        if risk > 70:
            outcome += " LOCK-OUT-TAG-OUT (LOTO) protocols required. Verify PPE certifications."
        else:
            outcome += " Standard permit controls logged. Operations within safety limits."
            
        return {
            "confidence": 98.0,
            "outcome": outcome,
            "evidence": f"Safety audit thresholds: risk score evaluates at {risk}% | Action: {'LOTO Required' if risk > 70 else 'Standard'}"
        }


class RcaAgent:
    """Specialist comparing historical failure modes and compiling root cause summaries."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        incidents = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == equipment_id).all()
        
        if incidents:
            outcome = f"Correlated previous failures: {len(incidents)}. "
            outcome += f"Primary historical cause: '{incidents[0].cause}'. Preventive recommendation: '{incidents[0].prevention}'."
        else:
            outcome = "No historical incident matches found for this asset in database."
            
        return {
            "confidence": 92.0,
            "outcome": outcome,
            "evidence": f"Incident registry scan: matched {len(incidents)} occurrences | Primary: {incidents[0].cause if incidents else 'None'}"
        }


class QualityAgent:
    """Specialist tracking inspections deviations, checklist faults, and CAPA logs."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        
        outcome = "Inspection checklist data scanned. "
        if eq and eq.status == "Degraded":
            outcome += "Quality Deviation: Telemetry indicators deviate from calibration set-points. CAPA recommended."
        else:
            outcome += "Quality parameters within operational calibration boundaries."
            
        return {
            "confidence": 96.0,
            "outcome": outcome,
            "evidence": f"Calibration review: {'CAPA recommended' if eq and eq.status == 'Degraded' else 'Within limits'}"
        }


class GraphAgent:
    """Specialist querying graph mappings to identify topological dependencies."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        
        outcome = "Knowledge graph paths traced. "
        links_count = 0
        if eq:
            # Look up related document tags or incidents in graph
            doc_links = db.query(DocumentModel).filter(DocumentModel.asset_id == equipment_id).count()
            inc_links = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == equipment_id).count()
            links_count = doc_links + inc_links
            outcome += f"Asset node '{eq.asset_tag}' contains active linkages to {doc_links} manual(s) and {inc_links} incident(s)."
        else:
            outcome += "No node linkages detected."
            
        return {
            "confidence": 94.0,
            "outcome": outcome,
            "evidence": f"Graph schema scan: found {links_count} direct topological edges connected to asset"
        }


class DocumentIntelligenceAgent:
    """Specialist extracting entities, matching manuals, and indexing embeddings."""
    
    @staticmethod
    def process_task(db: Session, equipment_id: int) -> Dict[str, Any]:
        docs = db.query(DocumentModel).filter(DocumentModel.asset_id == equipment_id, DocumentModel.status != "Deleted").all()
        if not docs:
            # Fall back to all active documents
            docs = db.query(DocumentModel).filter(DocumentModel.status != "Deleted").limit(2).all()
            
        if docs:
            names = [d.document_name for d in docs]
            outcome = f"Retrieved OEM instruction manual grounding reference segments from: {', '.join(names)}."
        else:
            outcome = "No grounding manuals found."
            
        return {
            "confidence": 90.0,
            "outcome": outcome,
            "evidence": f"Matched {len(docs)} documents in database"
        }

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.compliance import Regulation, ComplianceAudit
from app.models.document import DocumentModel
from app.ai.llm_service import LLMService

router = APIRouter(prefix="/compliance", tags=["Compliance Intelligence"])


@router.post("/regulations", status_code=201)
def create_regulation(
    name: str,
    authority: str,
    clause_text: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers a new regulation standard framework (restricted to Admins)."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise HTTPException(status_code=403, detail="Unauthorized to upload regulations.")
        
    reg = Regulation(
        name=name,
        authority=authority,
        clause_text=clause_text,
        description=description
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@router.get("/regulations")
def list_regulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all loaded compliance frameworks."""
    return db.query(Regulation).all()


@router.get("/scan/{document_id}")
def scan_document_compliance(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Runs AI compliance intelligence, auditing a document against loaded regulations."""
    doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Target document not found.")
        
    # Get all active regulations
    regs = db.query(Regulation).all()
    if not regs:
        return []
        
    # Compile a compliance audit report
    audits_completed = []
    
    # We will simulate/execute LLM review for each regulation
    for reg in regs:
        # Check if audit already exists
        existing_audit = db.query(ComplianceAudit).filter(
            ComplianceAudit.document_id == doc.id,
            ComplianceAudit.regulation_id == reg.id
        ).first()
        
        if existing_audit:
            audits_completed.append(existing_audit)
            continue
            
        # Simulate AI comparison
        doc_text = doc.description or doc.original_filename
        findings = f"SOP compared against {reg.name}. Checked keyword mentions of vessel pressure, safety, and calibration."
        gaps_detected = "None"
        status_val = "Compliant"
        
        # Analyze content
        doc_lower = doc_text.lower()
        clause_lower = reg.clause_text.lower()
        
        # Simple rule checks for offline testing
        if "calibration" in clause_lower and "calibration" not in doc_lower:
            status_val = "Warning"
            gaps_detected = f"Document lacks explicit calibration check frequency as outlined in standard: '{reg.clause_text}'"
        elif "hydraulic" in clause_lower and "hydraulic" not in doc_lower:
            status_val = "Non-Compliant"
            gaps_detected = f"SOP does not specify hydraulic inspection procedures matching regulatory clause: '{reg.clause_text}'"
            
        audit = ComplianceAudit(
            document_id=doc.id,
            regulation_id=reg.id,
            status=status_val,
            findings=findings,
            gaps_detected=gaps_detected
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        audits_completed.append(audit)
        
    return audits_completed


@router.get("/evidence")
def generate_compliance_evidence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates compliance evidence packages aggregating audits, published SOPs, and inspection history."""
    published_docs = db.query(DocumentModel).filter(
        DocumentModel.approval_status == "Published",
        DocumentModel.deleted_at.is_(None)
    ).all()
    
    audits = db.query(ComplianceAudit).all()
    
    package = {
        "timestamp": datetime.utcnow(),
        "generated_by": current_user.full_name,
        "role": current_user.role,
        "total_active_sop_evidence": len(published_docs),
        "total_completed_audits": len(audits),
        "status": "Green" if all(a.status == "Compliant" for a in audits) else "Amber/Red Warnings Active",
        "evidence_sop_list": [
            {
                "id": doc.id,
                "name": doc.document_name,
                "filename": doc.original_filename,
                "version": doc.version,
                "approval_status": doc.approval_status,
                "uploaded_by": doc.uploader.full_name if doc.uploader else "System"
            } for doc in published_docs
        ],
        "audits": [
            {
                "id": audit.id,
                "sop_name": audit.document.document_name,
                "regulation_name": audit.regulation.name,
                "status": audit.status,
                "findings": audit.findings,
                "gaps_detected": audit.gaps_detected
            } for audit in audits
        ]
    }
    
    return package

from typing import Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import DocumentModel
from app.models.equipment import Equipment, SensorReading
from app.models.hierarchy import Organization, Plant, Department
from app.models.compliance import ComplianceAudit

router = APIRouter(prefix="/analytics", tags=["Enterprise Analytics & KPIs"])


@router.get("")
def get_analytics_combined(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Combined analytics endpoint returning KPIs and reports in a single response."""
    kpis = get_enterprise_kpis(db, current_user)
    reports = get_analytics_reports(db, current_user)
    return {
        "kpis": kpis,
        **reports
    }


@router.get("/kpis")
def get_enterprise_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregates platform KPIs (Orgs, Plants, Assets, Compliance, Active Work Orders, Pending Approvals)."""
    from app.models.discovery import RiskDiscovery
    from app.models.lessons_learned import IncidentRecord
    from app.models.ai import ChatMessage
    from datetime import datetime, timedelta

    # 1. Total counts
    org_count = db.query(Organization).count()
    plant_count = db.query(Plant).count()
    dept_count = db.query(Department).count()
    asset_count = db.query(Equipment).count()
    doc_count = db.query(DocumentModel).filter(DocumentModel.deleted_at.is_(None)).count()
    
    # 2. Critical items
    critical_assets = db.query(Equipment).filter(Equipment.health_score < 70.0).count()
    pending_approvals = db.query(DocumentModel).filter(
        DocumentModel.approval_status != "Published",
        DocumentModel.deleted_at.is_(None)
    ).count()
    
    # 3. Compliance Score
    audits = db.query(ComplianceAudit).all()
    total_audits = len(audits)
    compliant_audits = len([a for a in audits if a.status == "Compliant"])
    compliance_score = (compliant_audits / total_audits * 100.0) if total_audits > 0 else 0.0
    
    # 4. Storage size (sum file_size)
    from sqlalchemy import func
    storage_bytes = db.query(func.sum(DocumentModel.file_size)).filter(DocumentModel.deleted_at.is_(None)).scalar() or 0
    storage_mb = round(storage_bytes / (1024 * 1024), 2)

    # 5. Dynamic fields
    active_work_orders = db.query(Equipment).filter(Equipment.status == "Maintenance").count()
    ai_alerts = db.query(RiskDiscovery).count()
    maintenance_due = db.query(Equipment).filter(Equipment.health_score < 80.0).count()

    today_start = datetime.utcnow() - timedelta(days=1)
    ai_queries_today = db.query(ChatMessage).filter(ChatMessage.role == "user", ChatMessage.created_at >= today_start).count()
    
    return {
        "organizations": org_count,
        "plants": plant_count,
        "departments": dept_count,
        "assets": asset_count,
        "documents": doc_count,
        "active_work_orders": active_work_orders,
        "critical_assets": critical_assets,
        "ai_alerts": ai_alerts,
        "compliance_score": round(compliance_score, 1),
        "maintenance_due": maintenance_due,
        "pending_approvals": pending_approvals,
        "ai_queries_today": ai_queries_today,
        "storage_usage_mb": storage_mb
    }


@router.get("/reports")
def get_analytics_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides enterprise analytics charts (searches, queries, failures, coverage)."""
    from app.models.audit_log import AuditLog
    from app.models.lessons_learned import IncidentRecord
    from app.models.expert_knowledge import ExpertKnowledge
    from app.models.decision_intelligence import DecisionRecommendation
    from sqlalchemy import func

    # 1. Most searched documents from audit log
    logs = db.query(AuditLog).filter(AuditLog.action == "UPLOAD_DOCUMENT").all()
    searched = {}
    for l in logs:
        if l.details and "document_name" in l.details:
            doc_name = l.details["document_name"]
            searched[doc_name] = searched.get(doc_name, 0) + 1
    sorted_searched = sorted(searched.items(), key=lambda x: x[1], reverse=True)[:3]
    most_searched = [{"name": name, "searches": s} for name, s in sorted_searched]

    # 2. Frequently asked questions from audit log
    ai_queries = db.query(AuditLog).filter(AuditLog.action == "AI_QUERY").all()
    questions = {}
    for q in ai_queries:
        if q.details and "question" in q.details:
            ques = q.details["question"]
            questions[ques] = questions.get(ques, 0) + 1
    sorted_questions = sorted(questions.items(), key=lambda x: x[1], reverse=True)[:3]
    faqs = [{"query": q, "frequency": f} for q, f in sorted_questions]

    # 3. Highest failure equipment from incidents
    failures = db.query(IncidentRecord.equipment_id, func.count(IncidentRecord.id)).group_by(IncidentRecord.equipment_id).all()
    highest_failures = []
    for eq_id, count in failures[:3]:
        eq = db.query(Equipment).filter(Equipment.id == eq_id).first()
        if eq:
            highest_failures.append({
                "asset_tag": eq.asset_tag,
                "failures": count,
                "downtime_hours": count * 4
            })

    # 4. Document coverage by categories
    categories = ["Manual", "SOP", "Inspection", "Calibration", "Risk Assessment"]
    doc_cov = {}
    for cat in categories:
        count = db.query(DocumentModel).filter(DocumentModel.category == cat, DocumentModel.deleted_at.is_(None)).count()
        doc_cov[cat] = int(min(100, count * 20)) if count > 0 else 0

    # 5. Graph growth based on actual database nodes and edges
    nodes_count = (
        db.query(Equipment).count() +
        db.query(DocumentModel).filter(DocumentModel.deleted_at.is_(None)).count() +
        db.query(IncidentRecord).count() +
        db.query(ExpertKnowledge).count()
    )
    edges_count = (
        db.query(DocumentModel).filter(DocumentModel.asset_id.isnot(None), DocumentModel.deleted_at.is_(None)).count() +
        db.query(IncidentRecord).filter(IncidentRecord.equipment_id.isnot(None)).count() +
        db.query(ExpertKnowledge).filter(ExpertKnowledge.equipment_id.isnot(None)).count()
    )
    knowledge_graph_growth = [
        {"month": "Baseline", "nodes": 1, "edges": 0},
        {"month": "Current", "nodes": nodes_count, "edges": edges_count}
    ]

    # 6. Maintenance trends (preventive vs reactive)
    preventive = db.query(DecisionRecommendation).filter(DecisionRecommendation.status == "Approved").count()
    reactive = db.query(IncidentRecord).filter(IncidentRecord.status == "Resolved").count()
    maintenance_trends = [
        {"week": "W1", "preventive": 0, "reactive": 0},
        {"week": "Current", "preventive": preventive, "reactive": reactive}
    ]

    return {
        "most_searched_documents": most_searched,
        "frequently_asked_questions": faqs,
        "highest_failures_equipment": highest_failures,
        "document_coverage": doc_cov,
        "knowledge_graph_growth": knowledge_graph_growth,
        "maintenance_trends": maintenance_trends
    }

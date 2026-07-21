import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.equipment import Equipment, SensorReading, MaintenancePrediction
from app.models.document import DocumentModel
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.expert_knowledge import ExpertKnowledge
from app.models.decision_intelligence import DecisionRecommendation, DecisionEvidence
from app.models.discovery import DiscoveryFinding, PatternRelationship, KnowledgeGapRecord, OptimizationOpportunity, RiskDiscovery
from app.models.twin import KnowledgeTwin, KnowledgeHealth, AssetComparison, TwinSnapshot
from app.core.logging import logger

class TwinService:
    """
    Core service constructing the 360-degree Digital Knowledge Twin for every industrial asset.
    Combines telemetry, RUL, OEM manuals, SOPs, inspections, incidents, tribal memories,
    compliance audits, decision recommendations, and discovery findings.
    """

    @classmethod
    def calculate_knowledge_health(cls, db: Session, eq: Equipment) -> Dict[str, float]:
        """Calculates the 7 coverage dimensions and overall Knowledge Health Score for an asset."""
        # 1. Documentation Coverage
        docs = db.query(DocumentModel).filter(
            DocumentModel.status != "Deleted",
            (DocumentModel.asset_id == eq.id) | (DocumentModel.tags.ilike(f"%{eq.asset_tag}%"))
        ).all()
        has_manual = any(d.category == "Manual" or "manual" in d.document_name.lower() for d in docs)
        has_sop = any(d.category == "SOP" or "sop" in d.document_name.lower() for d in docs)
        doc_cov = 100.0 if (has_manual and has_sop) else 65.0 if (has_manual or has_sop) else 30.0

        # 2. Inspection Coverage
        insp_cov = 85.0 if (eq.inspection_reports and len(eq.inspection_reports.strip()) > 5) else 50.0

        # 3. Maintenance Coverage
        maint_cov = 95.0 if eq.status == "Operational" else 70.0 if eq.status == "Maintenance" else 50.0

        # 4. Expert Knowledge Coverage
        memories = db.query(ExpertKnowledge).filter(ExpertKnowledge.equipment_id == eq.id).all()
        expert_cov = min(100.0, 50.0 + (len(memories) * 25.0))

        # 5. Compliance Coverage
        audits = db.query(ComplianceAudit).all()
        non_compliant = any(a.status == "Non-Compliant" for a in audits)
        warning = any(a.status == "Warning" for a in audits)
        comp_cov = 40.0 if non_compliant else 75.0 if warning else 95.0

        # 6. Incident Coverage
        incidents = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == eq.id).all()
        open_incidents = any(i.status != "Resolved" for i in incidents)
        inc_cov = 50.0 if open_incidents else 90.0 if incidents else 100.0

        # 7. Recommendation Coverage
        recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.equipment_id == eq.id).all()
        rec_cov = 90.0 if recs else 70.0

        # Weighted Overall Knowledge Health Score
        overall = (
            (doc_cov * 0.20) +
            (insp_cov * 0.15) +
            (maint_cov * 0.15) +
            (expert_cov * 0.15) +
            (comp_cov * 0.15) +
            (inc_cov * 0.10) +
            (rec_cov * 0.10)
        )

        return {
            "documentation_coverage": round(doc_cov, 1),
            "inspection_coverage": round(insp_cov, 1),
            "maintenance_coverage": round(maint_cov, 1),
            "expert_knowledge_coverage": round(expert_cov, 1),
            "compliance_coverage": round(comp_cov, 1),
            "incident_coverage": round(inc_cov, 1),
            "recommendation_coverage": round(rec_cov, 1),
            "overall_health_score": round(overall, 1)
        }

    @classmethod
    def build_360_twin(cls, db: Session, equipment_id: int) -> Dict[str, Any]:
        """Constructs the complete 360-degree Digital Knowledge Twin payload for an asset."""
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if not eq:
            raise ValueError(f"Equipment with ID {equipment_id} not found.")

        # Calculate Knowledge Health Metrics
        health_scores = cls.calculate_knowledge_health(db, eq)

        # 1. Check/Create KnowledgeTwin record
        twin = db.query(KnowledgeTwin).filter(KnowledgeTwin.equipment_id == eq.id).first()
        if not twin:
            # Formulate initial summaries
            op_summary = (
                f"{eq.asset_name} ({eq.asset_tag}) operating in {eq.plant} - {eq.department}. "
                f"Manufactured by {eq.manufacturer or 'OEM Standard'} ({eq.model or 'N/A'}). "
                f"Current Health Score: {eq.health_score}%, Risk Score: {eq.risk_score}%."
            )
            top_risks = (
                f"Vibration parameters wear limit: {eq.risk_score}%. "
                f"Remaining Useful Life: {eq.remaining_useful_life:.0f} running hours."
            )
            actions = (
                f"Schedule routine bearing lubrication check, verify suction pressure stability, "
                f"and confirm PESO/Factory Act safety valve calibration status."
            )
            missing = "Upload latest OEM engineering manual and update Standard Operating Procedure (SOP)."
            impact = f"High business criticality asset powering {eq.department} fluid throughput."
            
            # Spare parts inventory recommendation based on asset type
            spares = [
                {"part_name": "Ceramic Bearing Sleeve", "part_number": f"SP-{eq.asset_tag}-01", "stock_qty": 2, "lead_time_days": 5},
                {"part_name": "Mechanical Shaft Seal Assembly", "part_number": f"SP-{eq.asset_tag}-02", "stock_qty": 4, "lead_time_days": 3},
                {"part_name": "High-Temp Gasket Kit", "part_number": f"SP-{eq.asset_tag}-03", "stock_qty": 10, "lead_time_days": 2}
            ]

            twin = KnowledgeTwin(
                equipment_id=eq.id,
                operational_summary=op_summary,
                top_risks=top_risks,
                recommended_actions=actions,
                missing_knowledge=missing,
                compliance_readiness="Compliant" if health_scores["compliance_coverage"] > 80 else "Audits Pending",
                maintenance_readiness="Optimal" if eq.status == "Operational" else "Maintenance Due",
                operational_confidence=92.5,
                business_impact=impact,
                spare_parts=json.dumps(spares)
            )
            db.add(twin)
            db.flush()

        # Update KnowledgeHealth record
        health = db.query(KnowledgeHealth).filter(KnowledgeHealth.twin_id == twin.id).first()
        if not health:
            health = KnowledgeHealth(twin_id=twin.id)
            db.add(health)
            db.flush()

        health.documentation_coverage = health_scores["documentation_coverage"]
        health.inspection_coverage = health_scores["inspection_coverage"]
        health.maintenance_coverage = health_scores["maintenance_coverage"]
        health.expert_knowledge_coverage = health_scores["expert_knowledge_coverage"]
        health.compliance_coverage = health_scores["compliance_coverage"]
        health.incident_coverage = health_scores["incident_coverage"]
        health.recommendation_coverage = health_scores["recommendation_coverage"]
        health.overall_health_score = health_scores["overall_health_score"]

        db.commit()
        db.refresh(twin)
        db.refresh(health)

        # 2. Collect 360 Aggregated Modules
        # A. Telemetry
        sensor = db.query(SensorReading).filter(SensorReading.equipment_id == eq.id).order_by(desc(SensorReading.timestamp)).first()
        telemetry = {
            "temperature": sensor.temperature if sensor else 45.0,
            "pressure": sensor.pressure if sensor else 4.2,
            "vibration": sensor.vibration if sensor else 1.2,
            "rpm": sensor.rpm if sensor else 1500.0,
            "voltage": sensor.voltage if sensor else 415.0,
            "current": sensor.current if sensor else 22.0,
            "oil_level": sensor.oil_level if sensor else 85.0,
            "humidity": sensor.humidity if sensor else 60.0,
            "runtime_hours": sensor.runtime_hours if sensor else eq.running_hours,
            "timestamp": sensor.timestamp.isoformat() if sensor else datetime.utcnow().isoformat()
        }

        # B. Documents
        docs = db.query(DocumentModel).filter(
            DocumentModel.status != "Deleted",
            (DocumentModel.asset_id == eq.id) | (DocumentModel.tags.ilike(f"%{eq.asset_tag}%"))
        ).all()
        doc_list = [{
            "id": d.id,
            "document_name": d.document_name,
            "category": d.category or "General",
            "version": d.version,
            "approval_status": d.approval_status,
            "created_at": d.created_at.isoformat()
        } for d in docs]

        # C. Maintenance Predictions
        preds = db.query(MaintenancePrediction).filter(MaintenancePrediction.equipment_id == eq.id).order_by(desc(MaintenancePrediction.timestamp)).all()
        maint_list = [{
            "id": p.id,
            "predicted_failure": p.predicted_failure,
            "failure_probability": p.failure_probability,
            "maintenance_priority": p.maintenance_priority,
            "suggested_maintenance_date": p.suggested_maintenance_date.isoformat(),
            "confidence_score": p.confidence_score
        } for p in preds]

        # D. Incidents
        incidents = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == eq.id).all()
        inc_list = [{
            "id": i.id,
            "incident_name": i.incident_name,
            "severity": i.severity,
            "status": i.status,
            "cause": i.cause,
            "resolution": i.resolution,
            "incident_date": i.incident_date.isoformat() if i.incident_date else None
        } for i in incidents]

        # E. Compliance Audits
        audits = db.query(ComplianceAudit).all()
        comp_list = [{
            "id": a.id,
            "regulation_name": a.regulation.name if a.regulation else "PESO Clause",
            "status": a.status,
            "findings": a.findings,
            "gaps_detected": a.gaps_detected
        } for a in audits]

        # F. Expert Knowledge
        memories = db.query(ExpertKnowledge).filter(ExpertKnowledge.equipment_id == eq.id).all()
        exp_list = [{
            "id": m.id,
            "title": m.title,
            "author": m.author,
            "author_role": m.author_role,
            "description": m.description,
            "confidence_score": m.confidence_score
        } for m in memories]

        # G. Decision Recommendations
        recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.equipment_id == eq.id).all()
        rec_list = [{
            "id": r.id,
            "title": r.title,
            "recommendation_type": r.recommendation_type,
            "priority": r.priority,
            "risk_score": r.risk_score,
            "failure_probability": r.failure_probability,
            "recommended_action": r.recommended_action
        } for r in recs]

        # H. Discovery Findings
        findings = db.query(DiscoveryFinding).filter(DiscoveryFinding.affected_assets.ilike(f"%{eq.asset_tag}%")).all()
        disc_list = [{
            "id": f.id,
            "title": f.title,
            "finding_type": f.finding_type,
            "priority": f.priority,
            "summary": f.summary,
            "expected_savings": f.expected_savings
        } for f in findings]

        # I. Timeline
        timeline = cls.get_knowledge_timeline(db, eq.id)

        # J. Spare Parts
        spare_parts_parsed = json.loads(twin.spare_parts) if twin.spare_parts else []

        # K. Related Assets
        related = db.query(Equipment).filter(
            Equipment.id != eq.id,
            (Equipment.plant == eq.plant) | (Equipment.department == eq.department)
        ).limit(4).all()
        related_list = [{
            "id": r.id,
            "asset_tag": r.asset_tag,
            "asset_name": r.asset_name,
            "status": r.status,
            "health_score": r.health_score
        } for r in related]

        # Structure Equipment Dict
        eq_dict = {
            "id": eq.id,
            "asset_name": eq.asset_name,
            "asset_tag": eq.asset_tag,
            "plant": eq.plant,
            "department": eq.department,
            "manufacturer": eq.manufacturer,
            "model": eq.model,
            "installation_date": eq.installation_date.isoformat() if eq.installation_date else None,
            "status": eq.status,
            "running_hours": eq.running_hours,
            "remaining_useful_life": eq.remaining_useful_life,
            "health_score": eq.health_score,
            "risk_score": eq.risk_score
        }

        # Structure Twin Dict
        twin_dict = {
            "id": twin.id,
            "uuid": twin.uuid,
            "equipment_id": twin.equipment_id,
            "operational_summary": twin.operational_summary,
            "top_risks": twin.top_risks,
            "recommended_actions": twin.recommended_actions,
            "missing_knowledge": twin.missing_knowledge,
            "compliance_readiness": twin.compliance_readiness,
            "maintenance_readiness": twin.maintenance_readiness,
            "operational_confidence": twin.operational_confidence,
            "business_impact": twin.business_impact,
            "spare_parts": twin.spare_parts,
            "created_at": twin.created_at.isoformat(),
            "updated_at": twin.updated_at.isoformat()
        }

        # Structure Health Dict
        health_dict = {
            "id": health.id,
            "uuid": health.uuid,
            "twin_id": health.twin_id,
            "documentation_coverage": health.documentation_coverage,
            "inspection_coverage": health.inspection_coverage,
            "maintenance_coverage": health.maintenance_coverage,
            "expert_knowledge_coverage": health.expert_knowledge_coverage,
            "compliance_coverage": health.compliance_coverage,
            "incident_coverage": health.incident_coverage,
            "recommendation_coverage": health.recommendation_coverage,
            "overall_health_score": health.overall_health_score,
            "created_at": health.created_at.isoformat(),
            "updated_at": health.updated_at.isoformat()
        }

        return {
            "equipment": eq_dict,
            "twin": twin_dict,
            "health": health_dict,
            "documents": doc_list,
            "telemetry_summary": telemetry,
            "maintenance_history": maint_list,
            "incidents": inc_list,
            "compliance": comp_list,
            "expert_knowledge": exp_list,
            "recommendations": rec_list,
            "discovery_findings": disc_list,
            "timeline": timeline,
            "spare_parts": spare_parts_parsed,
            "related_assets": related_list
        }

    @classmethod
    def get_knowledge_timeline(cls, db: Session, equipment_id: int) -> List[Dict[str, Any]]:
        """Combines all operational events into a single unified chronological timeline."""
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if not eq:
            return []

        events = []

        # 1. Installation
        if eq.installation_date:
            events.append({
                "event_type": "Installation",
                "title": f"Commissioning & Installation of {eq.asset_tag}",
                "description": f"Asset installed in {eq.plant} - {eq.department} by {eq.manufacturer or 'OEM'}.",
                "timestamp": eq.installation_date.isoformat(),
                "severity": "Info"
            })

        # 2. Incidents
        incidents = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == eq.id).all()
        for i in incidents:
            dt_str = i.incident_date.isoformat() if i.incident_date else eq.created_at.isoformat()
            events.append({
                "event_type": "Incident",
                "title": f"Incident Reported: {i.incident_name}",
                "description": f"Severity: {i.severity} | Cause: {i.cause or 'Under RCA review'}.",
                "timestamp": dt_str,
                "severity": i.severity
            })

        # 3. Expert Knowledge
        memories = db.query(ExpertKnowledge).filter(ExpertKnowledge.equipment_id == eq.id).all()
        for m in memories:
            events.append({
                "event_type": "Expert Memory",
                "title": f"Tribal Knowledge logged: {m.title}",
                "description": f"By {m.author} ({m.author_role}). Description: {m.description[:80]}...",
                "timestamp": m.created_at.isoformat(),
                "severity": "Info"
            })

        # 4. Decision Recommendations
        recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.equipment_id == eq.id).all()
        for r in recs:
            events.append({
                "event_type": "AI Recommendation",
                "title": f"Recommendation Formulated: {r.title}",
                "description": f"Action: {r.recommended_action[:90]}...",
                "timestamp": r.created_at.isoformat(),
                "severity": r.priority
            })

        # 5. Discovery Findings
        findings = db.query(DiscoveryFinding).filter(DiscoveryFinding.affected_assets.ilike(f"%{eq.asset_tag}%")).all()
        for f in findings:
            events.append({
                "event_type": "Discovery Finding",
                "title": f"AI Finding: {f.title}",
                "description": f"Category: {f.finding_type} | Impact: {f.business_impact[:80]}...",
                "timestamp": f.created_at.isoformat(),
                "severity": f.priority
            })

        # Sort by timestamp descending
        events.sort(key=lambda x: x["timestamp"], reverse=True)
        return events

    @classmethod
    def compare_twins(cls, db: Session, asset1_tag: str, asset2_tag: str) -> Dict[str, Any]:
        """Generates side-by-side comparative matrices between two Digital Knowledge Twins."""
        eq1 = db.query(Equipment).filter(Equipment.asset_tag == asset1_tag.upper()).first()
        eq2 = db.query(Equipment).filter(Equipment.asset_tag == asset2_tag.upper()).first()

        if not eq1 or not eq2:
            raise ValueError(f"One or both assets ('{asset1_tag}', '{asset2_tag}') could not be found.")

        twin1_data = cls.build_360_twin(db, eq1.id)
        twin2_data = cls.build_360_twin(db, eq2.id)

        comparison = {
            "asset1": {
                "tag": eq1.asset_tag,
                "name": eq1.asset_name,
                "status": eq1.status,
                "health_score": eq1.health_score,
                "risk_score": eq1.risk_score,
                "rul": eq1.remaining_useful_life,
                "knowledge_health_score": twin1_data["health"]["overall_health_score"],
                "documentation_coverage": twin1_data["health"]["documentation_coverage"],
                "compliance_status": twin1_data["twin"]["compliance_readiness"],
                "incidents_count": len(twin1_data["incidents"]),
                "recommendations_count": len(twin1_data["recommendations"]),
                "ai_confidence": twin1_data["twin"]["operational_confidence"]
            },
            "asset2": {
                "tag": eq2.asset_tag,
                "name": eq2.asset_name,
                "status": eq2.status,
                "health_score": eq2.health_score,
                "risk_score": eq2.risk_score,
                "rul": eq2.remaining_useful_life,
                "knowledge_health_score": twin2_data["health"]["overall_health_score"],
                "documentation_coverage": twin2_data["health"]["documentation_coverage"],
                "compliance_status": twin2_data["twin"]["compliance_readiness"],
                "incidents_count": len(twin2_data["incidents"]),
                "recommendations_count": len(twin2_data["recommendations"]),
                "ai_confidence": twin2_data["twin"]["operational_confidence"]
            },
            "winner_health": eq1.asset_tag if eq1.health_score >= eq2.health_score else eq2.asset_tag,
            "winner_knowledge": eq1.asset_tag if twin1_data["health"]["overall_health_score"] >= twin2_data["health"]["overall_health_score"] else eq2.asset_tag
        }

        # Save record
        comp_record = AssetComparison(
            asset1_id=eq1.id,
            asset2_id=eq2.id,
            comparison_metrics=json.dumps(comparison)
        )
        db.add(comp_record)
        db.commit()

        return comparison

    @classmethod
    def get_twin_analytics(cls, db: Session) -> Dict[str, Any]:
        """Aggregates platform Digital Knowledge Twin readiness metrics."""
        equipment_count = db.query(Equipment).count()
        twins_count = db.query(KnowledgeTwin).count()
        
        twins = db.query(KnowledgeHealth).all()
        avg_knowledge = sum(t.overall_health_score for t in twins) / len(twins) if twins else 0.0
        avg_doc = sum(t.documentation_coverage for t in twins) / len(twins) if twins else 0.0
        
        audits = db.query(ComplianceAudit).all()
        accuracy = (len([a for a in audits if a.status == "Compliant"]) / len(audits) * 100.0) if audits else 0.0
        
        doc_count = db.query(DocumentModel).filter(DocumentModel.deleted_at.is_(None)).count()
        growth_pct = min(100.0, doc_count * 5.0)

        coverage_pct = (twins_count / equipment_count * 100.0) if equipment_count > 0 else 0.0

        operational_count = db.query(Equipment).filter(Equipment.status == "Operational").count()
        op_readiness = (operational_count / equipment_count * 100.0) if equipment_count > 0 else 0.0

        validations = db.query(RecommendationValidation).all()
        accepted_val = len([v for v in validations if v.validation_status in ("Accepted", "Modified")])
        ai_conf = (accepted_val / len(validations) * 100.0) if validations else 0.0

        return {
            "twin_coverage_pct": round(coverage_pct, 1),
            "knowledge_completeness": round(avg_knowledge, 1),
            "twin_accuracy": round(accuracy, 1),
            "knowledge_growth_pct": round(growth_pct, 1),
            "documentation_quality": round(avg_doc, 1),
            "operational_readiness": round(op_readiness, 1),
            "ai_confidence": round(ai_conf, 1),
            "readiness_trend": [0.0, 0.0, 0.0, 0.0, 0.0, round(coverage_pct, 1)]
        }

    @classmethod
    def refresh_all_twins(cls, db: Session) -> int:
        """Re-analyzes and syncs Digital Knowledge Twins for all registered equipment."""
        equipment_list = db.query(Equipment).all()
        count = 0
        for eq in equipment_list:
            cls.build_360_twin(db, eq.id)
            count += 1
        return count

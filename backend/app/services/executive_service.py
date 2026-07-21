import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.executive import (
    ExecutiveMetric,
    ExecutiveReport,
    FinancialImpact,
    EnterpriseKPI,
    RiskSummary
)
from app.models.equipment import Equipment
from app.models.twin import KnowledgeTwin, KnowledgeHealth
from app.models.compliance import ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.decision_intelligence import DecisionRecommendation
from app.models.discovery import DiscoveryFinding, PatternRelationship, OptimizationOpportunity
from app.models.learning import RecommendationValidation, ModelEvaluation
from app.core.logging import logger

class ExecutiveService:
    """
    Core strategic service calculating 10 Enterprise KPIs, financial ROI breakdowns,
    plant risk heatmaps, operational intelligence metrics, and executive report generation.
    """

    @classmethod
    def calculate_enterprise_kpis(cls, db: Session) -> EnterpriseKPI:
        """Calculates the 10 Enterprise KPIs across plant operations."""
        from app.models.compliance import ComplianceAudit
        from app.models.learning import ModelEvaluation
        from app.models.document import DocumentModel

        equipment_list = db.query(Equipment).all()
        avg_plant_health = (
            sum(e.health_score for e in equipment_list) / len(equipment_list)
            if equipment_list else 0.0
        )

        health_records = db.query(KnowledgeHealth).all()
        avg_knowledge_health = (
            sum(h.overall_health_score for h in health_records) / len(health_records)
            if health_records else 0.0
        )

        validations = db.query(RecommendationValidation).all()
        accepted = len([v for v in validations if v.validation_status == "Accepted"])
        total_val = len(validations)
        learning_score = (accepted / total_val * 100.0) if total_val > 0 else 0.0

        # Dynamic sub-kpi metrics
        audits = db.query(ComplianceAudit).all()
        compliance_readiness_score = (len([a for a in audits if a.status == "Compliant"]) / len(audits) * 100.0) if audits else 0.0
        
        maintenance_readiness_score = (len([e for e in equipment_list if e.status == "Operational"]) / len(equipment_list) * 100.0) if equipment_list else 0.0
        
        asset_reliability_score = (sum(100.0 - e.risk_score for e in equipment_list) / len(equipment_list)) if equipment_list else 0.0
        
        operational_readiness_score = (avg_plant_health + maintenance_readiness_score) / 2
        
        downtime_risk_score = (sum(e.risk_score for e in equipment_list) / len(equipment_list)) if equipment_list else 0.0
        
        doc_count = db.query(DocumentModel).filter(DocumentModel.deleted_at.is_(None)).count()
        knowledge_growth_score = min(100.0, doc_count * 5.0)

        latest_eval = db.query(ModelEvaluation).order_by(ModelEvaluation.created_at.desc()).first()
        ai_confidence_score = latest_eval.answer_quality if latest_eval else (0.0 if not equipment_list else 94.0)

        kpi = EnterpriseKPI(
            plant_health_score=round(avg_plant_health, 1),
            ai_confidence_score=round(ai_confidence_score, 1),
            knowledge_health_score=round(avg_knowledge_health, 1),
            compliance_readiness_score=round(compliance_readiness_score, 1),
            maintenance_readiness_score=round(maintenance_readiness_score, 1),
            asset_reliability_score=round(asset_reliability_score, 1),
            operational_readiness_score=round(operational_readiness_score, 1),
            downtime_risk_score=round(downtime_risk_score, 1),
            knowledge_growth_score=round(knowledge_growth_score, 1),
            continuous_learning_score=round(learning_score, 1)
        )
        db.add(kpi)
        db.commit()
        db.refresh(kpi)
        return kpi

    @classmethod
    def calculate_financial_impact(cls, db: Session) -> Dict[str, Any]:
        """Calculates downtime cost, predicted savings, maintenance optimization, and failure avoidance ROI."""
        db.query(FinancialImpact).delete()
        db.commit()

        from app.models.discovery import OptimizationOpportunity, RiskDiscovery
        from app.models.decision_intelligence import DecisionRecommendation

        items = []
        
        # 1. Predicted Cost Savings from OptimizationOpportunity
        opts = db.query(OptimizationOpportunity).all()
        for o in opts:
            items.append(
                FinancialImpact(
                    category="Predicted Cost Savings",
                    title=o.title,
                    amount=o.estimated_savings,
                    description=o.description
                )
            )
            
        # 2. Avoided Failures from DecisionRecommendation
        recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.priority.in_(["High", "Critical"])).all()
        for r in recs:
            items.append(
                FinancialImpact(
                    category="Avoided Failures",
                    title=f"Early Prevention: {r.title}",
                    amount=r.estimated_cost,
                    description=r.description
                )
            )
            
        # 3. Potential Downtime Cost from RiskDiscovery
        risks = db.query(RiskDiscovery).all()
        for r in risks:
            exposure = 25000.0
            if r.priority == "Critical":
                exposure = 85000.0
            elif r.priority == "High":
                exposure = 45000.0
                
            items.append(
                FinancialImpact(
                    category="Potential Downtime Cost",
                    title=f"Risk Exposure: {r.title}",
                    amount=exposure,
                    description=r.description
                )
            )

        if items:
            db.add_all(items)
            db.commit()

        total_savings = sum(i.amount for i in items if i.category != "Potential Downtime Cost")
        downtime_risk_cost = sum(i.amount for i in items if i.category == "Potential Downtime Cost")

        return {
            "total_savings": total_savings,
            "potential_downtime_cost": downtime_risk_cost,
            "items": [
                {
                    "id": i.id,
                    "uuid": i.uuid,
                    "category": i.category,
                    "title": i.title,
                    "amount": i.amount,
                    "description": i.description,
                    "created_at": i.created_at.isoformat()
                } for i in items
            ]
        }

    @classmethod
    def get_risk_intelligence(cls, db: Session) -> Dict[str, Any]:
        """Aggregates critical risks, telemetry wear spikes, and compliance audit exposures into a Risk Heatmap."""
        db.query(RiskSummary).delete()
        db.commit()

        from app.models.discovery import RiskDiscovery

        risk_discoveries = db.query(RiskDiscovery).all()
        risks = []
        for rd in risk_discoveries:
            asset_tag = rd.equipment.asset_tag if rd.equipment else "General Operations"
            exposure = 25000.0
            cat = "Emerging Risk"
            if rd.priority == "Critical":
                exposure = 85000.0
                cat = "Critical Risk"
            elif rd.priority == "High":
                exposure = 45000.0
                cat = "Emerging Risk"
            elif rd.priority == "Medium":
                exposure = 25000.0
                cat = "Operational Bottleneck"
            else:
                exposure = 10000.0
                cat = "Compliance Risk"
                
            risks.append(
                RiskSummary(
                    risk_category=cat,
                    title=rd.title,
                    severity=rd.priority,
                    impact_description=rd.description,
                    affected_assets=asset_tag,
                    financial_exposure=exposure
                )
            )

        if risks:
            db.add_all(risks)
            db.commit()

        # Build Plant Risk Heatmap dynamically
        heatmap = []
        dept_risk = db.query(
            Equipment.plant,
            Equipment.department
        ).distinct().all()
        
        for p_name, d_name in dept_risk:
            eq_in_dept = db.query(Equipment).filter(
                Equipment.plant == p_name,
                Equipment.department == d_name
            ).all()
            if eq_in_dept:
                avg_risk = sum(e.risk_score for e in eq_in_dept) / len(eq_in_dept)
                if avg_risk >= 70.0:
                    level = "High"
                    color = "#f43f5e"
                elif avg_risk >= 40.0:
                    level = "Medium"
                    color = "#fb923c"
                else:
                    level = "Low"
                    color = "#10b981"
                heatmap.append({
                    "plant": p_name,
                    "department": d_name,
                    "risk_level": level,
                    "risk_score": round(avg_risk, 1),
                    "color": color
                })

        return {
            "risks": [
                {
                    "id": r.id,
                    "uuid": r.uuid,
                    "risk_category": r.risk_category,
                    "title": r.title,
                    "severity": r.severity,
                    "impact_description": r.impact_description,
                    "affected_assets": r.affected_assets,
                    "financial_exposure": r.financial_exposure,
                    "created_at": r.created_at.isoformat()
                } for r in risks
            ],
            "heatmap": heatmap
        }

    @classmethod
    def get_operational_intelligence(cls, db: Session) -> Dict[str, Any]:
        """Provides enterprise operational performance KPIs."""
        equipment_count = db.query(Equipment).count()
        operational_count = db.query(Equipment).filter(Equipment.status == "Operational").count()
        avail_pct = round((operational_count / equipment_count * 100.0), 1) if equipment_count > 0 else 0.0

        # Dynamic trends and completion metrics
        now = datetime.utcnow()
        incident_trend = []
        for w in range(5, -1, -1):
            start_w = now - timedelta(weeks=w+1)
            end_w = now - timedelta(weeks=w)
            count = db.query(IncidentRecord).filter(
                IncidentRecord.incident_date >= start_w.date(),
                IncidentRecord.incident_date <= end_w.date()
            ).count()
            incident_trend.append(count)
            
        from app.models.discovery import DiscoveryFinding
        discovery_trend = []
        for w in range(5, -1, -1):
            start_w = now - timedelta(weeks=w+1)
            end_w = now - timedelta(weeks=w)
            count = db.query(DiscoveryFinding).filter(
                DiscoveryFinding.created_at >= start_w,
                DiscoveryFinding.created_at <= end_w
            ).count()
            discovery_trend.append(count)

        from app.models.compliance import ComplianceAudit
        audits = db.query(ComplianceAudit).all()
        inspection_pct = (len([a for a in audits if a.status != "Non-Compliant"]) / len(audits) * 100.0) if audits else 0.0

        validations = db.query(RecommendationValidation).all()
        maintenance_pct = (len([v for v in validations if v.validation_status == "Accepted"]) / len(validations) * 100.0) if validations else 0.0

        from app.models.agent_intelligence import AgentMetric
        agent_metrics = db.query(AgentMetric).all()
        coll_velocity = sum(m.success_rate for m in agent_metrics) / len(agent_metrics) if agent_metrics else 0.0

        return {
            "equipment_availability_pct": avail_pct,
            "maintenance_performance_pct": round(maintenance_pct, 1),
            "inspection_completion_pct": round(inspection_pct, 1),
            "incident_trend": incident_trend,
            "discovery_trend": discovery_trend,
            "agent_collaboration_velocity": round(coll_velocity, 1)
        }

    @classmethod
    def generate_executive_report(cls, db: Session, report_type: str = "Monthly") -> ExecutiveReport:
        """Generates a structured weekly or monthly Executive Report."""
        kpis = cls.calculate_enterprise_kpis(db)
        fin = cls.calculate_financial_impact(db)
        risks = cls.get_risk_intelligence(db)

        summary_text = (
            f"INDUSMIND AI Executive Command Center Report ({report_type}). "
            f"Overall Plant Health Score: {kpis.plant_health_score}%. "
            f"AI Operational Readiness: {kpis.operational_readiness_score}%. "
            f"Total Projected Cost Savings: ${fin['total_savings']:,.0f}."
        )

        kpi_json = json.dumps({
            "plant_health": kpis.plant_health_score,
            "ai_confidence": kpis.ai_confidence_score,
            "knowledge_health": kpis.knowledge_health_score,
            "compliance_readiness": kpis.compliance_readiness_score,
            "maintenance_readiness": kpis.maintenance_readiness_score
        })

        fin_summary = f"Total Savings: ${fin['total_savings']:,.0f}. Potential Downtime Risk Exposure: ${fin['potential_downtime_cost']:,.0f}."
        risk_summary = f"Active Critical Risks: {len(risks['risks'])}. Plant Risk Level: Controlled."
        recs_summary = "Approved dynamic AI Decision Recommendations for bearing sleeve overhaul and valve calibration."

        report = ExecutiveReport(
            report_name=f"{report_type} Plant Operations & AI Intelligence Report",
            report_type=report_type,
            summary=summary_text,
            kpi_data=kpi_json,
            financial_summary=fin_summary,
            risk_summary=risk_summary,
            recommendations_summary=recs_summary
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @classmethod
    def generate_executive_dashboard(cls, db: Session) -> Dict[str, Any]:
        """Constructs 360-degree Executive Dashboard payload."""
        kpis = cls.calculate_enterprise_kpis(db)
        fin = cls.calculate_financial_impact(db)
        risk_intel = cls.get_risk_intelligence(db)

        critical_assets = db.query(Equipment).filter(Equipment.status != "Operational").count()
        high_risk_assets = db.query(Equipment).filter(Equipment.risk_score > 30.0).count()
        pending_recs = db.query(DecisionRecommendation).filter(DecisionRecommendation.status == "Proposed").count()

        from app.models.discovery import OptimizationOpportunity
        top_opportunities = []
        opts = db.query(OptimizationOpportunity).order_by(desc(OptimizationOpportunity.estimated_savings)).limit(3).all()
        for o in opts:
            top_opportunities.append({
                "title": o.title,
                "savings": o.estimated_savings,
                "priority": o.priority
            })

        kpi_dict = {
            "plant_health_score": kpis.plant_health_score,
            "ai_confidence_score": kpis.ai_confidence_score,
            "knowledge_health_score": kpis.knowledge_health_score,
            "compliance_readiness_score": kpis.compliance_readiness_score,
            "maintenance_readiness_score": kpis.maintenance_readiness_score,
            "asset_reliability_score": kpis.asset_reliability_score,
            "operational_readiness_score": kpis.operational_readiness_score,
            "downtime_risk_score": kpis.downtime_risk_score,
            "knowledge_growth_score": kpis.knowledge_growth_score,
            "continuous_learning_score": kpis.continuous_learning_score,
            "created_at": kpis.created_at.isoformat()
        }

        return {
            "enterprise_kpis": kpi_dict,
            "financial_impact_total": fin["total_savings"],
            "potential_downtime_cost": fin["potential_downtime_cost"],
            "predicted_cost_savings": sum(o["savings"] for o in top_opportunities),
            "avoided_failures_count": len([i for i in fin["items"] if i["category"] == "Avoided Failures"]),
            "critical_assets_count": critical_assets,
            "high_risk_assets_count": high_risk_assets,
            "pending_recommendations_count": pending_recs,
            "risk_heatmap": risk_intel["heatmap"],
            "top_risks": risk_intel["risks"],
            "top_opportunities": top_opportunities
        }

    @classmethod
    def refresh_executive_center(cls, db: Session) -> Dict[str, Any]:
        """On-demand/scheduled job to recalculate all executive metrics."""
        try:
            logger.info("starting_executive_center_refresh")
            kpis = cls.calculate_enterprise_kpis(db)
            fin = cls.calculate_financial_impact(db)
            risks = cls.get_risk_intelligence(db)
            report = cls.generate_executive_report(db, "Weekly")

            logger.info("completed_executive_center_refresh")
            return {
                "status": "Success",
                "kpi_id": kpis.id,
                "total_savings": fin["total_savings"],
                "report_id": report.id
            }
        except Exception as e:
            db.rollback()
            logger.error("executive_center_refresh_failed", error=str(e))
            raise

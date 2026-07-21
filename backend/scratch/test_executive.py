import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import models
from app.models.user import User
from app.models.workspace import Workspace
from app.models.hierarchy import Organization, Plant, Department
from app.models.equipment import Equipment
from app.models.document import DocumentModel
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.expert_knowledge import ExpertKnowledge
from app.models.decision_intelligence import DecisionRecommendation
from app.models.discovery import DiscoveryFinding
from app.models.twin import KnowledgeTwin
from app.models.learning import FeedbackRecord
from app.models.executive import ExecutiveMetric, ExecutiveReport, FinancialImpact, EnterpriseKPI, RiskSummary

from app.database.session import SessionLocal, Base, engine
from app.services.executive_service import ExecutiveService
from app.ai.rag_service import RAGService
from app.database.seed import seed_hierarchy_data

def test_executive():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding initial hierarchy data if empty...")
        if db.query(Equipment).count() == 0:
            seed_hierarchy_data(db)

        print("\nExecuting ExecutiveService.refresh_executive_center...")
        res = ExecutiveService.refresh_executive_center(db)
        print("Refresh Result:", res)

        print("\n=== 10 ENTERPRISE KPIS ===")
        kpis = db.query(EnterpriseKPI).order_by(EnterpriseKPI.created_at.desc()).first()
        print(f"Plant Health Score: {kpis.plant_health_score}%")
        print(f"AI Confidence Score: {kpis.ai_confidence_score}%")
        print(f"Knowledge Health Score: {kpis.knowledge_health_score}%")
        print(f"Compliance Readiness: {kpis.compliance_readiness_score}%")
        print(f"Maintenance Readiness: {kpis.maintenance_readiness_score}%")
        print(f"Asset Reliability Score: {kpis.asset_reliability_score}%")
        print(f"Operational Readiness: {kpis.operational_readiness_score}%")
        print(f"Downtime Risk Score: {kpis.downtime_risk_score}%")
        print(f"Knowledge Growth Score: +{kpis.knowledge_growth_score}%")
        print(f"Continuous Learning Score: {kpis.continuous_learning_score}%")

        print("\n=== FINANCIAL ROI BREAKDOWN ===")
        fin = ExecutiveService.calculate_financial_impact(db)
        print(f"Total Predicted Cost Savings: ${fin['total_savings']:,.0f}")
        print(f"Potential Downtime Exposure: ${fin['potential_downtime_cost']:,.0f}")
        for item in fin["items"]:
            print(f"  - [{item['category']}] {item['title']}: ${item['amount']:,.0f}")

        print("\n=== RISK HEATMAP DATA ===")
        risks = ExecutiveService.get_risk_intelligence(db)
        for h in risks["heatmap"]:
            print(f"  - {h['plant']} ({h['department']}): {h['risk_level']} Risk ({h['risk_score']}%)")

        print("\n=== EXECUTIVE REPORTS ARCHIVE ===")
        reports = db.query(ExecutiveReport).all()
        for r in reports:
            print(f"Report ID {r.id}: {r.report_name} ({r.report_type})")
            print(f"  Summary: {r.summary[:100]}...")

        print("\n=== TESTING EXECUTIVE COPILOT QUERIES ===")
        user = db.query(User).first()
        resp = RAGService.execute_rag(
            db=db,
            user=user,
            question="What is the overall health of the plant?"
        )
        print("COPILOT ANSWER FOR 'health of the plant':")
        print(resp.answer[:300])

        print("\nSUCCESS: All Executive AI Command Center backend modules executed cleanly!")
    except Exception as e:
        print(f"ERROR during Executive test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_executive()

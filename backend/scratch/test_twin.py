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
from app.models.twin import KnowledgeTwin, KnowledgeHealth, AssetComparison, TwinSnapshot

from app.database.session import SessionLocal, Base, engine
from app.services.twin_service import TwinService
from app.database.seed import seed_hierarchy_data

def test_twin():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding initial hierarchy data if empty...")
        if db.query(Equipment).count() == 0:
            seed_hierarchy_data(db)

        print("\nExecuting TwinService.refresh_all_twins...")
        count = TwinService.refresh_all_twins(db)
        print(f"Synchronized {count} Digital Knowledge Twins!")

        print("\n=== SAMPLE 360-DEGREE TWIN PAYLOAD (PUMP-P102) ===")
        pump = db.query(Equipment).filter(Equipment.asset_tag == "PUMP-P102").first()
        if pump:
            twin_data = TwinService.build_360_twin(db, pump.id)
            print("Asset Tag:", twin_data["equipment"]["asset_tag"])
            print("Overall Knowledge Health Score:", twin_data["health"]["overall_health_score"], "%")
            print("Documentation Coverage:", twin_data["health"]["documentation_coverage"], "%")
            print("Inspection Coverage:", twin_data["health"]["inspection_coverage"], "%")
            print("Compliance Readiness:", twin_data["twin"]["compliance_readiness"])
            print("Operational Summary:", twin_data["twin"]["operational_summary"])
            print("Timeline Events Count:", len(twin_data["timeline"]))
            print("Documents Mapped Count:", len(twin_data["documents"]))

        print("\n=== SAMPLE TWIN COMPARISON (PUMP-P102 vs TURBINE-T203) ===")
        comp = TwinService.compare_twins(db, "PUMP-P102", "TURBINE-T203")
        print("Asset 1 (PUMP-P102) Score:", comp["asset1"]["knowledge_health_score"])
        print("Asset 2 (TURBINE-T203) Score:", comp["asset2"]["knowledge_health_score"])
        print("Winner Knowledge:", comp["winner_knowledge"])

        print("\n=== TWIN ANALYTICS ===")
        analytics = TwinService.get_twin_analytics(db)
        print(analytics)

        print("\nSUCCESS: All Digital Knowledge Twin backend modules executed cleanly!")
    except Exception as e:
        print(f"ERROR during Twin test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_twin()

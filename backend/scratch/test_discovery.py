import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import all models to register on Base.metadata
from app.models.user import User
from app.models.workspace import Workspace
from app.models.hierarchy import Organization, Plant, Department
from app.models.equipment import Equipment
from app.models.document import DocumentModel
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.expert_knowledge import ExpertKnowledge
from app.models.discovery import DiscoveryFinding, PatternRelationship, KnowledgeGapRecord, OptimizationOpportunity, RiskDiscovery

from app.database.session import SessionLocal, Base, engine
from app.services.discovery_engine import DiscoveryEngine
from app.database.seed import seed_hierarchy_data

def test_discovery():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding initial data if empty...")
        if db.query(Equipment).count() == 0:
            seed_hierarchy_data(db)
            
        print("Executing DiscoveryEngine.run_discovery...")
        counts = DiscoveryEngine.run_discovery(db)
        print("Discovery Run Counts:", counts)
        
        print("\n=== SAMPLE DISCOVERY FINDINGS ===")
        findings = db.query(DiscoveryFinding).limit(5).all()
        for f in findings:
            print(f"[{f.finding_type}] {f.title} (Priority: {f.priority}, Conf: {f.confidence_score}%)")
            print(f"  Summary: {f.summary}")
            print(f"  Impact: {f.business_impact}")
            print(f"  Assets: {f.affected_assets}")
            print(f"  Savings: ${f.expected_savings}")
            print("-" * 50)
            
        print("\n=== DISCOVERY ANALYTICS ===")
        analytics = DiscoveryEngine.get_discovery_analytics(db)
        print(analytics)
        print("\nSUCCESS: All Discovery Engine backend modules executed cleanly!")
    except Exception as e:
        print(f"ERROR during Discovery test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_discovery()

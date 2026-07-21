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
from app.models.learning import FeedbackRecord, LearningEvent, RecommendationValidation, KnowledgeEvolution, ModelEvaluation

from app.database.session import SessionLocal, Base, engine
from app.services.learning_service import LearningService
from app.database.seed import seed_hierarchy_data

def test_learning():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding initial hierarchy data if empty...")
        if db.query(Equipment).count() == 0:
            seed_hierarchy_data(db)

        print("\nExecuting LearningService.run_learning_pipeline...")
        res = LearningService.run_learning_pipeline(db)
        print("Pipeline Result:", res)

        print("\n=== TESTING ENGINEER FEEDBACK RECORDING ===")
        user = db.query(User).first()
        user_id = user.id if user else 1
        rec = db.query(DecisionRecommendation).first()
        rec_id = rec.id if rec else 1

        fb = LearningService.record_feedback(
            db=db,
            user_id=user_id,
            entity_type="Recommendation",
            entity_id=rec_id,
            feedback_type="Accept",
            rating=5,
            comment="Accepted during maintenance review.",
            correction_text=None
        )
        print(f"Feedback Record Created: ID {fb.id}, Type: {fb.feedback_type}, Status: {fb.status}")

        print("\n=== KNOWLEDGE EVOLUTION RECORDS ===")
        evos = db.query(KnowledgeEvolution).limit(5).all()
        for e in evos:
            print(f"[{e.evolution_type}] {e.title} (Freshness: {e.freshness_score}%)")
            print(f"  Description: {e.description}")
            print(f"  Action: {e.recommended_update}")
            print("-" * 50)

        print("\n=== LEARNING ANALYTICS ===")
        analytics = LearningService.get_learning_analytics(db)
        print(analytics)

        print("\nSUCCESS: All Continuous Learning AI backend modules executed cleanly!")
    except Exception as e:
        print(f"ERROR during Learning test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_learning()

import sys
import os
import uuid

# Adjust sys.path to run from the backend directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env")))

# Force import all models to populate the SQLAlchemy mapper registry
from app.models.user import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.models.document import DocumentModel
from app.models.ai import DocumentChunk, ChatSession, ChatMessage
from app.models.equipment import Equipment, SensorReading, MaintenancePrediction
from app.models.workspace import Workspace, workspace_documents
from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.notification import Notification

from app.database.session import SessionLocal
from app.ai.rag_service import RAGService
from app.ai.embeddings import EmbeddingGenerator
from app.ai.vector_store import VectorStore

def run_test():
    # Configure UTF-8 encoding for Windows consoles
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    print("Initializing RAG validation test...")
    db = SessionLocal()
    try:
        # 1. Fetch organization seeded in db
        org = db.query(Organization).filter(Organization.name == "ABC Chemicals").first()
        if not org:
            print("Error: Organization 'ABC Chemicals' not found. Ensure seeding is complete.")
            return

        # 2. Get or create a mock user linked to the organization
        user = db.query(User).filter(User.email == "test_verification@indusmind.ai").first()
        if not user:
            user = User(
                full_name="Verification Agent",
                email="test_verification@indusmind.ai",
                password_hash="mock_hash",
                role="Engineer",
                organization_id=org.id,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created temporary verification user: {user.email} (Org: {org.name})")
        else:
            # Update organization just in case
            user.organization_id = org.id
            db.commit()
            db.refresh(user)
            print(f"Using existing verification user: {user.email} (Org: {org.name})")

        # 3. Clean up any existing verification documents to ensure clean run
        old_doc = db.query(DocumentModel).filter(DocumentModel.document_name == "Gas Turbine Maintenance Guide").first()
        if old_doc:
            print(f"Cleaning up old document ID: {old_doc.id}")
            db.query(DocumentChunk).filter(DocumentChunk.document_id == old_doc.id).delete()
            db.delete(old_doc)
            db.commit()

        # 4. Create a mock document entry in the DB
        doc = DocumentModel(
            document_name="Gas Turbine Maintenance Guide",
            original_filename="turbine_manual.pdf",
            stored_filename=f"turbine_manual_{uuid.uuid4().hex}.pdf",
            file_extension="pdf",
            mime_type="application/pdf",
            storage_path="/mock/storage/turbine_manual.pdf",
            file_size=1024,
            status="Uploaded",
            approval_status="Published",
            uploaded_by=user.id,
            category="Manual"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"Created mock document record in DB: ID={doc.id}, Name='{doc.document_name}'")

        # 5. Insert mock document chunks with embeddings
        chunk_text = (
            "The superheated gas turbine unit 4 is located at Power Generation Block B, Thermal Generation department. "
            "Its operational status is currently Maintenance for scheduled inspection. The turbine is linked to asset tag TURBINE-T203."
        )
        print("Generating local SentenceTransformer vector embedding for mock chunk...")
        chunk_embedding = EmbeddingGenerator.generate_embedding(chunk_text)

        chunks_data = [{
            "document_id": doc.id,
            "chunk_id": f"doc_{doc.id}_chunk_1",
            "embedding": chunk_embedding,
            "page": 1,
            "text": chunk_text,
            "chunk_metadata": {
                "section": "Location and Status",
                "equipment_mentioned": ["TURBINE-T203"]
            }
        }]
        
        print("Saving mock chunk and embedding to PostgreSQL pgvector...")
        VectorStore.save_chunks(db, chunks_data)

        # 6. Execute RAG query
        question = "What is the location and status of the superheated gas turbine unit?"
        print(f"\nQuestion: '{question}'")
        print("Executing RAG Pipeline (sending query to LLM)...")
        
        response = RAGService.execute_rag(
            db=db,
            user=user,
            question=question
        )

        print("\n=== RAG PIPELINE RESPONSE ===")
        print(f"Answer:\n{response.answer}")
        print(f"Confidence Score: {response.confidence_score}%")
        print(f"Related Equipment: {response.related_equipment}")
        print(f"Citations:")
        for idx, citation in enumerate(response.citations):
            print(f"  [{idx + 1}] Source: {citation.source_document}, Page: {citation.page}, Section: {citation.section}")
            print(f"      Snippet: \"{citation.snippet}\"")
        print("=============================")

    except Exception as e:
        print(f"RAG Pipeline test execution failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()

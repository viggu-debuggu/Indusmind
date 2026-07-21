import pytest
from io import BytesIO
from datetime import datetime
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.session import Base, get_db
from app.main import app
from app.models.user import User
from app.models.document import DocumentModel
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.api.dependencies.auth import get_current_user

# Setup testing SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_compliance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_current_user():
    session = TestingSessionLocal()
    user = session.query(User).filter(User.role == "Admin").first()
    session.close()
    return user


@pytest.fixture(name="client")
def client_fixture():
    """Provides a TestClient with overridden database and authentication dependencies."""
    Base.metadata.create_all(bind=engine)
    
    app.dependency_overrides[get_db] = lambda: TestingSessionLocal()
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    session = TestingSessionLocal()
    
    # Create Organization
    from app.models.hierarchy import Organization
    org = Organization(id=1, name="ABC Chemicals")
    session.add(org)
    session.flush()
    
    # Create default Admin and Viewer users
    admin = User(
        id=1,
        full_name="Admin User",
        email="admin@abc.com",
        role="Admin",
        organization_id=org.id,
        is_active=True,
        password_hash="mock"
    )
    viewer = User(
        id=2,
        full_name="Viewer User",
        email="viewer@abc.com",
        role="Viewer",
        organization_id=org.id,
        is_active=True,
        password_hash="mock"
    )
    session.add_all([admin, viewer])
    session.flush()
    
    # Seed regulation
    reg = Regulation(
        id=1,
        name="Factory Act Section 21",
        authority="Factory Act",
        clause_text="Guarding of machinery requirements in all plants.",
        description="Fencing safety clause."
    )
    session.add(reg)
    session.commit()
    session.close()

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


@patch("app.ai.indexing_worker.index_document")
def test_document_duplicate_prevention(mock_indexing, client):
    """Verifies that uploading a duplicate document checksum returns 409 Conflict."""
    file_payload = {"file": ("manual.txt", BytesIO(b"Standard machinery operation procedures."), "text/plain")}
    form_data = {"document_name": "Machinery Guide", "category": "SOP"}
    
    # 1st Upload: Success
    res = client.post("/api/documents/upload", files=file_payload, data=form_data)
    assert res.status_code == 200
    doc_id = res.json()["id"]

    # 2nd Upload: Should return 409 Conflict due to exact checksum duplicate
    file_payload_2 = {"file": ("manual.txt", BytesIO(b"Standard machinery operation procedures."), "text/plain")}
    res2 = client.post("/api/documents/upload", files=file_payload_2, data=form_data)
    assert res2.status_code == 409
    assert "duplicate" in res2.json()["error"]["message"].lower()


@patch("app.ai.indexing_worker.index_document")
def test_document_approval_and_rollback_workflow(mock_indexing, client):
    """Verifies document status promotions (Uploaded -> Review -> Approved -> Published) and rollbacks."""
    # Upload Document
    file_payload = {"file": ("sop.txt", BytesIO(b"Calibration guidelines for pump assembly."), "text/plain")}
    form_data = {"document_name": "SOP Calibration", "category": "SOP"}
    res = client.post("/api/documents/upload", files=file_payload, data=form_data)
    assert res.status_code == 200
    doc = res.json()
    doc_id = doc["id"]
    assert doc["approvalStatus"] == "Uploaded"

    # Step 1: Uploaded -> Pending Review
    res = client.post(f"/api/documents/{doc_id}/approve")
    assert res.status_code == 200
    assert res.json()["approvalStatus"] == "Pending Review"

    # Step 2: Pending Review -> Engineer Approved
    res = client.post(f"/api/documents/{doc_id}/approve")
    assert res.status_code == 200
    assert res.json()["approvalStatus"] == "Engineer Approved"

    # Step 3: Engineer Approved -> Published
    res = client.post(f"/api/documents/{doc_id}/approve")
    assert res.status_code == 200
    assert res.json()["approvalStatus"] == "Published"

    # Test Rollback of active current flag (by creating a version and rolling back)
    # Upload new version
    form_data_v2 = {"document_name": "SOP Calibration v2", "category": "SOP", "versionGroupId": doc["versionGroupId"]}
    file_payload_v2 = {"file": ("sop.txt", BytesIO(b"Calibration guidelines for pump assembly v2."), "text/plain")}
    res_v2 = client.post("/api/documents/upload", files=file_payload_v2, data=form_data_v2)
    assert res_v2.status_code == 200
    doc_v2 = res_v2.json()
    assert doc_v2["isCurrent"] is True

    # Check that previous is now not current
    session = TestingSessionLocal()
    orig_doc = session.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    assert orig_doc.is_current is False
    session.close()

    # Roll back to the original version
    res_roll = client.post(f"/api/documents/{doc_id}/rollback")
    assert res_roll.status_code == 200
    assert res_roll.json()["isCurrent"] is True


@patch("app.ai.indexing_worker.index_document")
def test_compliance_intelligence_scan(mock_indexing, client):
    """Verifies that compliance intelligence compares SOPs to regulations and lists evidence."""
    # 1. Upload SOP
    file_payload = {"file": ("pressure_sop.txt", BytesIO(b"We maintain high pressure storage vessels."), "text/plain")}
    form_data = {"document_name": "Pressure SOP", "category": "SOP"}
    res = client.post("/api/documents/upload", files=file_payload, data=form_data)
    doc_id = res.json()["id"]

    # 2. Approve SOP to 'Published' so it is indexed as compliance evidence
    client.post(f"/api/documents/{doc_id}/approve")
    client.post(f"/api/documents/{doc_id}/approve")
    client.post(f"/api/documents/{doc_id}/approve")

    # 3. Scan Compliance
    res_scan = client.get(f"/api/compliance/scan/{doc_id}")
    assert res_scan.status_code == 200
    scans = res_scan.json()
    assert len(scans) > 0
    assert scans[0]["status"] in ("Compliant", "Warning", "Non-Compliant")

    # 4. Fetch evidence packages
    res_ev = client.get("/api/compliance/evidence")
    assert res_ev.status_code == 200
    evidence = res_ev.json()
    assert len(evidence["evidence_sop_list"]) == 1
    assert evidence["evidence_sop_list"][0]["id"] == doc_id

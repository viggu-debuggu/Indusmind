import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.session import Base, get_db
from app.main import app
from app.models.user import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.models.document import DocumentModel

from app.api.dependencies.auth import get_current_user

# Setup testing SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_current_user(db: Session = Depends(get_db)):
    return db.query(User).filter(User.email == "engineer@indusmind.ai").first()


@pytest.fixture(name="client")
def client_fixture():
    """Provides a TestClient with overridden database and authentication dependencies."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Override dependencies
    app.dependency_overrides[get_db] = lambda: TestingSessionLocal()
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Seed mock users in SQLite
    session = TestingSessionLocal()
    engineer = User(
        id=2,
        full_name="Test Engineer",
        email="engineer@indusmind.ai",
        role="Engineer",
        is_active=True,
        password_hash="mock"
    )
    admin = User(
        id=1,
        full_name="Test Admin",
        email="admin@indusmind.ai",
        role="Admin",
        is_active=True,
        password_hash="mock"
    )
    session.add_all([engineer, admin])
    session.commit()
    session.close()

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)



def test_api_upload_single_document(client):
    """Checks POST /api/documents/upload returns document details."""
    file_payload = {"file": ("test_sheet.csv", b"temp,vibration\n45,1.2\n", "text/csv")}
    form_payload = {
        "document_name": "Telemetry Logs",
        "category": "Report",
        "department": "Maintenance",
        "plant_location": "Plant A"
    }

    res = client.post("/api/documents/upload", files=file_payload, data=form_payload)
    
    assert res.status_code == 200
    data = res.json()
    assert data["documentName"] == "Telemetry Logs"
    assert data["originalFilename"] == "test_sheet.csv"
    assert data["mimeType"] == "text/csv"
    assert data["version"] == 1
    assert data["status"] == "Uploaded"


def test_api_list_and_search_documents(client):
    """Checks GET /api/documents queries the indexed documents."""
    # Seed an entry
    file_payload = {"file": ("manual.pdf", b"pdf mock bytes", "application/pdf")}
    form_payload = {"document_name": "Pump Manual", "category": "Manual"}
    client.post("/api/documents/upload", files=file_payload, data=form_payload)

    # Search matches
    res = client.get("/api/documents", params={"search": "Pump"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["documentName"] == "Pump Manual"
    assert data["total"] == 1

    # Search non-match
    res_empty = client.get("/api/documents", params={"search": "Boiler"})
    assert len(res_empty.json()["items"]) == 0


def test_api_archive_and_restore_document(client):
    """Checks POST /api/documents/archive and restore endpoints."""
    # Seed document
    file_payload = {"file": ("manual.pdf", b"pdf bytes", "application/pdf")}
    form_payload = {"document_name": "Boiler Manual", "category": "Manual"}
    up_res = client.post("/api/documents/upload", files=file_payload, data=form_payload)
    doc_id = up_res.json()["id"]

    # Temporarily override get_current_user to return the Admin user
    def override_admin_user(db: Session = Depends(get_db)):
        return db.query(User).filter(User.role == "Admin").first()
    client.app.dependency_overrides[get_current_user] = override_admin_user

    # Archive
    arch_res = client.post("/api/documents/archive", json={"id": doc_id})
    assert arch_res.status_code == 200
    assert arch_res.json()["status"] == "Archived"

    # Restore
    rest_res = client.post("/api/documents/restore", json={"id": doc_id})
    assert rest_res.status_code == 200
    assert rest_res.json()["status"] == "Uploaded"



def test_api_download_document(client):
    """Checks GET /api/documents/download/{id} streams back original file bytes."""
    # Seed document
    file_payload = {"file": ("notes.txt", b"secret instructions", "text/plain")}
    form_payload = {"document_name": "Safety Notes", "category": "Compliance"}
    up_res = client.post("/api/documents/upload", files=file_payload, data=form_payload)
    doc_id = up_res.json()["id"]

    # Download file content
    down_res = client.get(f"/api/documents/download/{doc_id}")
    assert down_res.status_code == 200
    assert down_res.content == b"secret instructions"
    assert "attachment; filename=\"notes.txt\"" in down_res.headers["Content-Disposition"]

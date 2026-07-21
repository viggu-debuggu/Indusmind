import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.session import Base, get_db
from app.main import app
from app.models.user import User
from app.models.document import DocumentModel
from app.models.workspace import Workspace
from app.api.dependencies.auth import get_current_user

# Setup testing SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_workspaces.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_current_user(db: Session = Depends(get_db)):
    return db.query(User).filter(User.email == "engineer@indusmind.ai").first()


@pytest.fixture(name="client")
def client_fixture():
    """Provides a TestClient with overridden database and authentication dependencies."""
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


def test_api_workspace_lifecycle(client):
    """Test workspace creation, details, list, linking, unlinking, and deletion."""
    # 1. Create Workspace
    payload = {"name": "Boiler Maintenance WS", "description": "Shutdown repair docs"}
    res = client.post("/api/workspaces", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Boiler Maintenance WS"
    assert data["description"] == "Shutdown repair docs"
    ws_uuid = data["uuid"]
    ws_id = data["id"]
    
    # 2. List Workspaces
    list_res = client.get("/api/workspaces")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["uuid"] == ws_uuid
    assert list_res.json()[0]["documentCount"] == 0

    # 3. Seed a Document
    file_payload = {"file": ("manual.pdf", b"pdf bytes", "application/pdf")}
    form_payload = {"document_name": "Boiler Manual", "category": "Manual"}
    doc_res = client.post("/api/documents/upload", files=file_payload, data=form_payload)
    assert doc_res.status_code == 200
    doc_id = doc_res.json()["id"]

    # 4. Link Document to Workspace
    link_res = client.post(f"/api/workspaces/{ws_uuid}/documents", json={"document_ids": [doc_id]})
    assert link_res.status_code == 200
    link_data = link_res.json()
    assert link_data["documentCount"] == 1
    assert len(link_data["documents"]) == 1
    assert link_data["documents"][0]["id"] == doc_id

    # Verify counts in list route
    list_res_updated = client.get("/api/workspaces")
    assert list_res_updated.json()[0]["documentCount"] == 1

    # 5. Get Workspace details
    details_res = client.get(f"/api/workspaces/{ws_uuid}")
    assert details_res.status_code == 200
    assert details_res.json()["documentCount"] == 1
    assert len(details_res.json()["documents"]) == 1

    # 6. Unlink Document from Workspace
    unlink_res = client.delete(f"/api/workspaces/{ws_uuid}/documents/{doc_id}")
    assert unlink_res.status_code == 200
    assert unlink_res.json()["documentCount"] == 0
    assert len(unlink_res.json()["documents"]) == 0

    # 7. Delete Workspace
    del_res = client.delete(f"/api/workspaces/{ws_uuid}")
    assert del_res.status_code == 200
    
    # Confirm it is deleted
    list_res_empty = client.get("/api/workspaces")
    assert len(list_res_empty.json()) == 0

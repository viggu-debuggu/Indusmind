import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.session import Base, get_db
from app.main import app
from app.models.user import User
from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
from app.models.workspace import Workspace
from app.models.equipment import Equipment, SensorReading
from app.api.dependencies.auth import get_current_user
from app.ai.metadata_extractor import MetadataExtractor

# Setup testing SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hierarchy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_current_user():
    # Default override returns an Org Admin user linked to ABC Chemicals
    session = TestingSessionLocal()
    user = session.query(User).filter(User.email == "admin@abc.com").first()
    session.close()
    return user


@pytest.fixture(name="client")
def client_fixture():
    """Provides a TestClient with overridden database and authentication dependencies."""
    Base.metadata.create_all(bind=engine)
    
    # Override dependencies
    app.dependency_overrides[get_db] = lambda: TestingSessionLocal()
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Seed mock hierarchy and users
    session = TestingSessionLocal()
    
    # 1. Create Organization
    org = Organization(id=1, name="ABC Chemicals", description="Mock Chemical Corp")
    session.add(org)
    session.flush()
    
    # 2. Seed Users
    admin_user = User(
        id=1,
        full_name="Org Admin",
        email="admin@abc.com",
        role="Admin",
        organization_id=org.id,
        is_active=True,
        password_hash="mock"
    )
    super_admin = User(
        id=2,
        full_name="Super Admin",
        email="super@indusmind.ai",
        role="Super Admin",
        organization_id=None,
        is_active=True,
        password_hash="mock"
    )
    session.add_all([admin_user, super_admin])
    session.flush()

    # 3. Seed Plants and Departments
    plant = Plant(id=1, organization_id=org.id, name="Visakha Plant", location="India")
    session.add(plant)
    session.flush()
    
    dept = Department(id=1, plant_id=plant.id, name="Utilities")
    session.add(dept)
    session.flush()
    
    ws = Workspace(id=1, name="Turnaround 2026", department_id=dept.id)
    session.add(ws)
    session.flush()
    
    eq = Equipment(
        id=1,
        asset_name="Boiler B1",
        asset_tag="BOILER-B401",
        plant="Visakha Plant",
        department="Utilities",
        installation_date=datetime.utcnow() if False else None, # filled in by default or custom date
        workspace_id=ws.id
    )
    # Set standard datetime for SQLite safety
    from datetime import datetime
    eq.installation_date = datetime.utcnow()
    session.add(eq)
    session.flush()

    reading = SensorReading(
        equipment_id=eq.id,
        temperature=98.5, # triggers warning threshold for bearing / lubrication wear
        pressure=12.2,
        vibration=5.1,
        rpm=1500,
        voltage=415,
        current=30,
        oil_level=80,
        humidity=50,
        runtime_hours=1200
    )
    session.add(reading)
    session.commit()
    session.close()

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def test_hierarchy_tree_endpoint(client):
    """Verifies that hierarchy trees list plants and departments correctly."""
    res = client.get("/api/hierarchy/tree")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "ABC Chemicals"
    assert len(data[0]["children"]) == 1
    assert data[0]["children"][0]["name"] == "Visakha Plant"
    assert len(data[0]["children"][0]["children"]) == 1
    assert data[0]["children"][0]["children"][0]["name"] == "Utilities"


from unittest.mock import patch

@patch("app.ai.metadata_extractor.MetadataExtractor._extract_via_llm")
def test_ai_metadata_extraction_rules(mock_llm):
    """Validates rule-based parsing of equipment tag and criticality keywords."""
    mock_llm.side_effect = Exception("Force fallback to rule-based parsing in unit tests")
    sample_text = "Standard Operating Procedure for PUMP-P102 calibration checks. This is a critical safety manual."
    meta = MetadataExtractor.extract_metadata(sample_text)
    assert meta["asset_tag"] == "PUMP-P102"
    assert meta["equipment_name"] == "Centrifugal Fluid Pump"
    assert meta["equipment_type"] == "Pump"
    assert meta["criticality"] == "High"
    assert "safety" in meta["keywords"]


def test_rca_agent_endpoint(client):
    """Checks that POST /api/equipment/{id}/rca triggers failure analysis and returns structured citations."""
    res = client.post("/api/equipment/1/rca")
    assert res.status_code == 200
    data = res.json()
    assert len(data["possible_cause"]) > 0
    assert data["confidence"] > 0
    assert len(data["recommended_actions"]) > 0
    assert len(data["citations"]) > 0
    assert data["citations"][0]["source_document"] is not None

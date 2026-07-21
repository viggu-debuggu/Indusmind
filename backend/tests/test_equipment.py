import pytest
from datetime import datetime, timedelta
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database.session import Base, get_db
from app.main import app
from app.models.user import User
from app.models.equipment import Equipment, SensorReading, MaintenancePrediction
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
    
    # Seed mock user
    session = TestingSessionLocal()
    engineer = User(
        id=2,
        full_name="Test Engineer",
        email="engineer@indusmind.ai",
        role="Engineer",
        is_active=True,
        password_hash="mock"
    )
    session.add(engineer)
    session.commit()
    session.close()
    
    yield TestClient(app)
    
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_create_and_list_equipment(client):
    # Register equipment asset
    payload = {
        "assetName": "Testing Centrifugal Pump",
        "assetTag": "PUMP-TEST-01",
        "plant": "Fluid Plant A",
        "department": "Maintenance Dept",
        "manufacturer": "Sulzer Ltd",
        "model": "Centri-X100",
        "installationDate": (datetime.utcnow() - timedelta(days=365)).isoformat(),
        "status": "Operational",
        "runningHours": 100.0,
        "remainingUsefulLife": 20000.0,
        "healthScore": 100.0,
        "riskScore": 0.0
    }
    response = client.post("/api/equipment", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["assetTag"] == "PUMP-TEST-01"
    assert data["id"] is not None

    # List all equipment
    list_response = client.get("/api/equipment")
    assert list_response.status_code == 200
    assets = list_response.json()
    assert len(assets) >= 1
    assert any(x["assetTag"] == "PUMP-TEST-01" for x in assets)


def test_telemetry_ingestion_and_prediction(client):
    # 1. Register equipment
    payload = {
        "assetName": "Test Gas Turbine",
        "assetTag": "TURBINE-TEST-02",
        "plant": "Power Plant A",
        "department": "Thermal Dept",
        "installationDate": (datetime.utcnow() - timedelta(days=500)).isoformat(),
        "status": "Operational"
    }
    client.post("/api/equipment", json=payload)

    # Fetch equipment to get ID
    assets = client.get("/api/equipment").json()
    eq = next(x for x in assets if x["assetTag"] == "TURBINE-TEST-02")
    eq_id = eq["id"]

    # 2. Post normal sensor reading
    sensor_payload = {
        "temperature": 45.0,
        "pressure": 3.0,
        "vibration": 1.1,
        "rpm": 1500.0,
        "voltage": 415.0,
        "current": 20.0,
        "oilLevel": 85.0,
        "humidity": 55.0,
        "runtimeHours": 250.0
    }
    post_response = client.post(f"/api/equipment/{eq_id}/sensor-data", json=sensor_payload)
    assert post_response.status_code == 201
    
    # 3. Check health and current prediction
    health_response = client.get(f"/api/equipment/{eq_id}/health")
    assert health_response.status_code == 200
    health_data = health_response.json()
    assert health_data["healthScore"] > 80.0
    assert health_data["latestReading"]["temperature"] == 45.0
    assert len(health_data["predictionsHistory"]) >= 1

    # 4. Check historical logs
    history_response = client.get(f"/api/equipment/{eq_id}/history")
    assert history_response.status_code == 200
    history_data = history_response.json()
    assert len(history_data) == 1

    # 5. Get prediction details directly
    pred_response = client.get(f"/api/equipment/{eq_id}/prediction")
    assert pred_response.status_code == 200
    pred_data = pred_response.json()
    assert pred_data["maintenancePriority"] in ["Low", "Medium"]

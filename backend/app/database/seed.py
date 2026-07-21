import random
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.equipment import (
    Equipment as EquipmentModel,
    SensorReading as SensorReadingModel,
    MaintenancePrediction as MaintenancePredictionModel
)
from app.ai.predictive_engine import PredictiveEngine

def seed_equipment_data(db: Session, workspace_id: Optional[int] = None):
    """
    Seeds initial industrial equipment assets and generates historical sensor
    readings to enable rich data visualization out-of-the-box.
    """
    if db.query(EquipmentModel).count() > 0:
        return

    print("Seeding industrial assets registry...")
    
    # 5 standard assets
    assets = [
        {
            "asset_name": "High-Pressure Centrifugal Pump",
            "asset_tag": "PUMP-P102",
            "plant": "Fluid Processing Facility A",
            "department": "Hydraulics Operations",
            "manufacturer": "Sulzer Pumps Ltd",
            "model": "HPH-150-4",
            "installation_date": datetime.utcnow() - timedelta(days=730),
            "status": "Operational",
            "running_hours": 1245.0,
            "last_maintenance_date": datetime.utcnow() - timedelta(days=45),
            "next_maintenance_date": datetime.utcnow() + timedelta(days=45),
            "health_score": 98.0,
            "risk_score": 2.0,
            # Base sensor metrics for seeding history
            "base_temp": 42.0, "base_press": 4.5, "base_vib": 1.2,
            "rpm": 1500.0, "voltage": 415.0, "current": 22.0, "oil": 85.0, "humidity": 60.0
        },
        {
            "asset_name": "Superheated Gas Turbine Unit 4",
            "asset_tag": "TURBINE-T203",
            "plant": "Power Generation Block B",
            "department": "Thermal Generation",
            "manufacturer": "Siemens Energy",
            "model": "SGT-800",
            "installation_date": datetime.utcnow() - timedelta(days=1200),
            "status": "Maintenance",
            "running_hours": 8512.0,
            "last_maintenance_date": datetime.utcnow() - timedelta(days=2),
            "next_maintenance_date": datetime.utcnow() + timedelta(days=180),
            "health_score": 78.0,
            "risk_score": 22.0,
            # Base sensor metrics for seeding history
            "base_temp": 580.0, "base_press": 12.5, "base_vib": 4.8,
            "rpm": 3000.0, "voltage": 11000.0, "current": 180.0, "oil": 72.0, "humidity": 40.0
        },
        {
            "asset_name": "Industrial Heat Exchange Boiler",
            "asset_tag": "BOILER-B401",
            "plant": "Utility Boiler Room C",
            "department": "Steam Utilities",
            "manufacturer": "Babcock & Wilcox",
            "model": "FM-120-45",
            "installation_date": datetime.utcnow() - timedelta(days=900),
            "status": "Operational",
            "running_hours": 4310.0,
            "last_maintenance_date": datetime.utcnow() - timedelta(days=90),
            "next_maintenance_date": datetime.utcnow() + timedelta(days=90),
            "health_score": 95.0,
            "risk_score": 5.0,
            # Base sensor metrics for seeding history
            "base_temp": 210.0, "base_press": 25.0, "base_vib": 0.8,
            "rpm": 0.0, "voltage": 220.0, "current": 15.0, "oil": 0.0, "humidity": 75.0
        },
        {
            "asset_name": "Reciprocating Air Compressor Unit",
            "asset_tag": "COMP-C300",
            "plant": "Pneumatics Station D",
            "department": "Utility Air Feed",
            "manufacturer": "Atlas Copco",
            "model": "LE8-10",
            "installation_date": datetime.utcnow() - timedelta(days=500),
            "status": "Degraded",
            "running_hours": 9820.0,
            "last_maintenance_date": datetime.utcnow() - timedelta(days=120),
            "next_maintenance_date": datetime.utcnow() + timedelta(days=30),
            "health_score": 62.0,
            "risk_score": 38.0,
            # Base sensor metrics for seeding history
            "base_temp": 88.0, "base_press": 16.2, "base_vib": 6.2,
            "rpm": 850.0, "voltage": 415.0, "current": 45.0, "oil": 55.0, "humidity": 50.0
        },
        {
            "asset_name": "Primary Electric Control Substation",
            "asset_tag": "SUBSTATION-E1",
            "plant": "Grid Feed Room Yard West",
            "department": "High Voltage Distribution",
            "manufacturer": "ABB Group",
            "model": "SafeRing-33",
            "installation_date": datetime.utcnow() - timedelta(days=1500),
            "status": "Operational",
            "running_hours": 15230.0,
            "last_maintenance_date": datetime.utcnow() - timedelta(days=15),
            "next_maintenance_date": datetime.utcnow() + timedelta(days=165),
            "health_score": 100.0,
            "risk_score": 0.0,
            # Base sensor metrics for seeding history
            "base_temp": 32.0, "base_press": 0.0, "base_vib": 0.1,
            "rpm": 0.0, "voltage": 33000.0, "current": 600.0, "oil": 98.0, "humidity": 35.0
        }
    ]

    for item in assets:
        # Separate base metrics from model instantiation params
        base_temp = item.pop("base_temp")
        base_press = item.pop("base_press")
        base_vib = item.pop("base_vib")
        rpm = item.pop("rpm")
        voltage = item.pop("voltage")
        current = item.pop("current")
        oil = item.pop("oil")
        humidity = item.pop("humidity")
        
        db_eq = EquipmentModel(**item, workspace_id=workspace_id)
        db.add(db_eq)
        db.flush()  # Get db_eq.id
        
        # Generate 15 historical sensor data points spanning back 3 days
        print(f"  Generating telemetry history for {db_eq.asset_tag}...")
        for i in range(15):
            hours_offset = (15 - i) * 6  # 90 hours back down to now
            timestamp = datetime.utcnow() - timedelta(hours=hours_offset)
            
            # Add random fluctuations (drift)
            temp = base_temp + random.uniform(-2.0, 2.0)
            press = base_press + random.uniform(-0.5, 0.5) if base_press > 0 else 0.0
            vib = base_vib + random.uniform(-0.15, 0.15)
            runtime = db_eq.running_hours - (15 - i) * 6
            
            # Anomaly injection for degraded COMP-C300
            if db_eq.asset_tag == "COMP-C300" and i > 10:
                temp += (i - 10) * 3.0  # Temperature escalation
                vib += (i - 10) * 0.5   # Vibration escalation
                
            db_reading = SensorReadingModel(
                equipment_id=db_eq.id,
                temperature=round(max(temp, 0.0), 2),
                pressure=round(max(press, 0.0), 2),
                vibration=round(max(vib, 0.0), 2),
                rpm=rpm,
                voltage=voltage,
                current=current,
                oil_level=oil,
                humidity=humidity,
                runtime_hours=round(runtime, 1),
                timestamp=timestamp
            )
            db.add(db_reading)
            
            # Every 3rd reading, run prediction to seed predictive history
            if i % 3 == 0 or i == 14:
                age_days = (timestamp - db_eq.installation_date).days
                last_m_days = (timestamp - db_eq.last_maintenance_date).days if db_eq.last_maintenance_date else 30
                
                pred = PredictiveEngine.run_prediction(
                    temperature=temp,
                    pressure=press,
                    vibration=vib,
                    running_hours=runtime,
                    equipment_age_days=max(age_days, 1),
                    last_maintenance_days=max(last_m_days, 1),
                    asset_tag=db_eq.asset_tag
                )
                
                db_pred = MaintenancePredictionModel(
                    equipment_id=db_eq.id,
                    predicted_failure=pred["predicted_failure"],
                    failure_probability=pred["failure_probability"],
                    remaining_useful_life=pred["remaining_useful_life"],
                    maintenance_priority=pred["maintenance_priority"],
                    suggested_maintenance_date=pred["suggested_maintenance_date"],
                    confidence_score=pred["confidence_score"],
                    timestamp=timestamp
                )
                db.add(db_pred)
                
                # Apply current prediction to the final state if it is the latest iteration
                if i == 14:
                    db_eq.remaining_useful_life = pred["remaining_useful_life"]
                    db_eq.health_score = max(100.0 - pred["failure_probability"], 0.0)
                    db_eq.risk_score = pred["failure_probability"]
                    if db_eq.status != "Maintenance":
                        db_eq.status = "Degraded" if pred["maintenance_priority"] in ["High", "Critical"] else "Operational"

    db.commit()
    print("SUCCESS: Seeded all industrial equipment data and historical logs.")


def seed_hierarchy_data(db: Session):
    """Seeds organization, plant, department, workspaces and links users and equipment."""
    from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
    from app.models.workspace import Workspace
    from app.models.user import User
    from app.core.security import get_password_hash
    from typing import Optional
    
    if db.query(Organization).count() > 0:
        return
        
    print("Seeding default admin user...")
    admin = db.query(User).filter(User.email == "admin@indusmind.com").first()
    if not admin:
        admin = User(
            full_name="Vignesh M.",
            email="admin@indusmind.com",
            password_hash=get_password_hash("Admin@2024!"),
            company="Indusmind Operations Inc.",
            department="Utilities Department",
            job_title="Chief Asset Architect",
            role="Super Admin",
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.flush()
        
    print("Seeding enterprise hierarchy tree...")
    
    # 1. Create Organization
    org = Organization(
        name="ABC Chemicals",
        description="Global chemical manufacturer and fluid operations leader."
    )
    db.add(org)
    db.flush()
    
    # 2. Create Plant
    plant = Plant(
        organization_id=org.id,
        name="Visakhapatnam Plant",
        location="Andhra Pradesh, India"
    )
    db.add(plant)
    db.flush()
    
    # 3. Create Department
    dept = Department(
        plant_id=plant.id,
        name="Utilities Department"
    )
    db.add(dept)
    db.flush()
    
    # 4. Create Workspace
    ws = Workspace(
        name="Shutdown 2026",
        description="Comprehensive turnaround maintenance and diagnostics manuals.",
        department_id=dept.id
    )
    db.add(ws)
    db.flush()
    
    # 5. Link users to Organization and Department
    users = db.query(User).all()
    for user in users:
        user.organization_id = org.id
        if user.role != "Super Admin":
            user.department_id = dept.id
        else:
            # Grant Super Admin platform access to the organization
            grant = UserOrganizationGrant(user_id=user.id, organization_id=org.id)
            db.add(grant)
            
    db.commit()
    
    # Seed regulations
    from app.models.compliance import Regulation
    reg1 = Regulation(
        name="Factory Act Section 21: Guarding of Machinery",
        authority="Factory Act",
        clause_text="Every dangerous part of any machinery must be securely fenced by safeguards of substantial construction while the parts are in motion.",
        description="Fencing of machinery requirements."
    )
    reg2 = Regulation(
        name="PESO Pressure Vessel Rule 18",
        authority="PESO",
        clause_text="All high-pressure chemical storage vessels must be fitted with safety valves set to release pressure above 10.0 Bar, tested every 12 months.",
        description="Overpressure protection standards."
    )
    db.add_all([reg1, reg2])
    db.commit()
    print("SUCCESS: Seeded organization, plant, department, workspaces and regulations framework.")

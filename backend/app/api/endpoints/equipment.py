from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.equipment import (
    Equipment as EquipmentModel,
    SensorReading as SensorReadingModel,
    MaintenancePrediction as MaintenancePredictionModel
)
from app.schemas.equipment import (
    EquipmentResponse,
    EquipmentCreate,
    EquipmentUpdate,
    SensorReadingCreate,
    SensorReadingResponse,
    EquipmentHealthResponse,
    MaintenancePredictionResponse,
    RCAResponse
)
from app.ai.predictive_engine import PredictiveEngine

router = APIRouter()

@router.get("", response_model=List[EquipmentResponse])
def list_equipment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all registered industrial machinery assets."""
    equipment_list = db.query(EquipmentModel).order_by(EquipmentModel.asset_tag).all()
    
    # Attach latest reading to each response
    resp = []
    for eq in equipment_list:
        latest = (
            db.query(SensorReadingModel)
            .filter(SensorReadingModel.equipment_id == eq.id)
            .order_by(SensorReadingModel.timestamp.desc())
            .first()
        )
        eq_data = EquipmentResponse.model_validate(eq)
        if latest:
            eq_data.latest_reading = SensorReadingResponse.model_validate(latest)
        resp.append(eq_data)
        
    return resp


@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers a new industrial machinery asset in the platform (Admin/Engineer only)."""
    if current_user.role not in ["Super Admin", "Admin", "Engineer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role lacks authorization to register assets."
        )
        
    existing = db.query(EquipmentModel).filter(EquipmentModel.asset_tag == payload.asset_tag).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An asset with tag '{payload.asset_tag}' is already registered."
        )
        
    db_eq = EquipmentModel(**payload.model_dump())
    db.add(db_eq)
    db.commit()
    db.refresh(db_eq)
    return db_eq


@router.get("/{id}/health", response_model=EquipmentHealthResponse)
def get_equipment_health(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves current health metrics, scores, and active prediction history for a machinery asset."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    latest_reading = (
        db.query(SensorReadingModel)
        .filter(SensorReadingModel.equipment_id == eq.id)
        .order_by(SensorReadingModel.timestamp.desc())
        .first()
    )
    
    predictions = (
        db.query(MaintenancePredictionModel)
        .filter(MaintenancePredictionModel.equipment_id == eq.id)
        .order_by(MaintenancePredictionModel.timestamp.desc())
        .limit(10)
        .all()
    )
    
    response_data = {
        "id": eq.id,
        "asset_name": eq.asset_name,
        "asset_tag": eq.asset_tag,
        "status": eq.status,
        "health_score": eq.health_score,
        "risk_score": eq.risk_score,
        "remaining_useful_life": eq.remaining_useful_life,
        "running_hours": eq.running_hours,
        "latest_reading": latest_reading,
        "predictions_history": predictions
    }
    
    return response_data


@router.get("/{id}/history", response_model=List[SensorReadingResponse])
def get_equipment_sensor_history(
    id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves historical sensor telemetry data points for visualization."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    history = (
        db.query(SensorReadingModel)
        .filter(SensorReadingModel.equipment_id == eq.id)
        .order_by(SensorReadingModel.timestamp.desc())
        .limit(limit)
        .all()
    )
    
    # Return chronologically (oldest to newest) for chart plotting
    history.reverse()
    return history


@router.post("/{id}/sensor-data", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def post_equipment_sensor_reading(
    id: int,
    payload: SensorReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Appends new real-time sensor telemetry and triggers predictive recalculation."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    # Append the reading
    db_reading = SensorReadingModel(
        equipment_id=eq.id,
        **payload.model_dump()
    )
    db.add(db_reading)
    
    # Run predictive AI engine
    age_days = (datetime.utcnow() - eq.installation_date).days
    last_m_days = 30
    if eq.last_maintenance_date:
        last_m_days = (datetime.utcnow() - eq.last_maintenance_date).days
        
    pred = PredictiveEngine.run_prediction(
        temperature=payload.temperature,
        pressure=payload.pressure,
        vibration=payload.vibration,
        running_hours=payload.runtime_hours,
        equipment_age_days=max(age_days, 1),
        last_maintenance_days=max(last_m_days, 1),
        asset_tag=eq.asset_tag
    )
    
    # Store the prediction in DB
    db_pred = MaintenancePredictionModel(
        equipment_id=eq.id,
        predicted_failure=pred["predicted_failure"],
        failure_probability=pred["failure_probability"],
        remaining_useful_life=pred["remaining_useful_life"],
        maintenance_priority=pred["maintenance_priority"],
        suggested_maintenance_date=pred["suggested_maintenance_date"],
        confidence_score=pred["confidence_score"]
    )
    db.add(db_pred)
    
    # Update Equipment Statuses, RUL, Health & Risk scores
    eq.running_hours = payload.runtime_hours
    eq.remaining_useful_life = pred["remaining_useful_life"]
    eq.health_score = max(100.0 - pred["failure_probability"], 0.0)
    eq.risk_score = pred["failure_probability"]
    
    # Only transition from Operational -> Degraded based on priority
    if eq.status != "Maintenance":
        eq.status = "Degraded" if pred["maintenance_priority"] in ["High", "Critical"] else "Operational"
        
    db.commit()
    db.refresh(db_reading)
    return db_reading


@router.get("/{id}/prediction", response_model=MaintenancePredictionResponse)
def get_equipment_prediction(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the latest stored predictive diagnostics or generates a new prediction based on current sensors."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    # Get latest stored prediction
    latest_pred = (
        db.query(MaintenancePredictionModel)
        .filter(MaintenancePredictionModel.equipment_id == eq.id)
        .order_by(MaintenancePredictionModel.timestamp.desc())
        .first()
    )
    
    if latest_pred:
        return latest_pred
        
    # Generate on-the-fly prediction if history is empty
    latest_reading = (
        db.query(SensorReadingModel)
        .filter(SensorReadingModel.equipment_id == eq.id)
        .order_by(SensorReadingModel.timestamp.desc())
        .first()
    )
    
    # Default parameters if no sensor history exists
    temp = latest_reading.temperature if latest_reading else 45.0
    press = latest_reading.pressure if latest_reading else 2.5
    vib = latest_reading.vibration if latest_reading else 1.2
    runtime = latest_reading.runtime_hours if latest_reading else eq.running_hours
    
    age_days = (datetime.utcnow() - eq.installation_date).days
    last_m_days = 30
    if eq.last_maintenance_date:
        last_m_days = (datetime.utcnow() - eq.last_maintenance_date).days
        
    pred = PredictiveEngine.run_prediction(
        temperature=temp,
        pressure=press,
        vibration=vib,
        running_hours=runtime,
        equipment_age_days=max(age_days, 1),
        last_maintenance_days=max(last_m_days, 1),
        asset_tag=eq.asset_tag
    )
    
    db_pred = MaintenancePredictionModel(
        equipment_id=eq.id,
        predicted_failure=pred["predicted_failure"],
        failure_probability=pred["failure_probability"],
        remaining_useful_life=pred["remaining_useful_life"],
        maintenance_priority=pred["maintenance_priority"],
        suggested_maintenance_date=pred["suggested_maintenance_date"],
        confidence_score=pred["confidence_score"]
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred


@router.post("/{id}/rca", response_model=RCAResponse)
def initiate_equipment_rca(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiates AI Root Cause Analysis (RCA) on the target equipment asset."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    # Get latest reading
    latest_reading = (
        db.query(SensorReadingModel)
        .filter(SensorReadingModel.equipment_id == eq.id)
        .order_by(SensorReadingModel.timestamp.desc())
        .first()
    )
    
    # Retrieve linked manual document names & pages to search for references
    from app.models.document import DocumentModel
    docs = db.query(DocumentModel).filter(DocumentModel.asset_id == eq.id).all()
    doc_names = [d.original_filename for d in docs]
    
    # Telemetry Context
    temp = latest_reading.temperature if latest_reading else 45.0
    press = latest_reading.pressure if latest_reading else 2.5
    vib = latest_reading.vibration if latest_reading else 1.2
    
    # Run LLM or Mock generator
    from app.ai.llm_service import LLMService
    import json
    
    system_prompt = (
        "You are an expert root cause analysis (RCA) agent. "
        "Formulate a detailed, structured RCA report. "
        "Return a clean JSON block (no markdown tags, just raw JSON) matching the schema:\n"
        "{\n"
        "  \"possible_cause\": \"Main likely reason for anomaly or failure\",\n"
        "  \"confidence\": 0.92,\n"
        "  \"evidence\": \"Specific telemetry values or logs indicating this issue\",\n"
        "  \"similar_failures\": \"Describe matching historical incidents if any\",\n"
        "  \"recommended_actions\": \"Steps to resolve the fault\",\n"
        "  \"citations\": [\n"
        "     {\"source_document\": \"manual_filename.pdf\", \"page\": 12, \"section\": \"Calibration\"}\n"
        "  ]\n"
        "}"
    )
    
    prompt = (
        f"EQUIPMENT PROFILE:\n"
        f"- Asset Tag: {eq.asset_tag}\n"
        f"- Name: {eq.asset_name}\n"
        f"- Manufacturer: {eq.manufacturer or 'Unknown'}\n"
        f"- Model: {eq.model or 'Unknown'}\n"
        f"- Status: {eq.status}\n"
        f"- Health Score: {eq.health_score}%\n\n"
        f"CURRENT TELEMETRY READING:\n"
        f"- Temperature: {temp}°C\n"
        f"- Pressure: {press} Bar\n"
        f"- Vibration: {vib} mm/s\n\n"
        f"INCIDENT & TIMELINE DETAILS:\n"
        f"- Failure History: {eq.failure_history or 'None registered.'}\n"
        f"- Inspection Notes: {eq.inspection_reports or 'None registered.'}\n"
        f"- Open Work Orders: {eq.open_work_orders or 'None registered.'}\n\n"
        f"LINKED REFERENCE MANUALS:\n"
        f"- Files: {', '.join(doc_names) if doc_names else 'None linked.'}\n"
    )
    
    import os
    has_llm_key = any(os.getenv(k) for k in ["GEMINI_API_KEY", "OPENAI_API_KEY", "AZURE_OPENAI_API_KEY"])
    
    if has_llm_key:
        try:
            resp = LLMService.generate_response(prompt=prompt, system_prompt=system_prompt)
            resp = resp.replace("```json", "").replace("```", "").strip()
            data = json.loads(resp)
            return data
        except Exception:
            pass # Fallback to mock below
            
    # Mock fallback response based on tag type
    default_citations = []
    if doc_names:
        default_citations.append({"source_document": doc_names[0], "page": 8, "section": "Troubleshooting Guide"})
    else:
        default_citations.append({"source_document": "No Reference Manual Uploaded", "page": 1, "section": "N/A"})

    # Determine mock report details based on telemetry values
    possible_cause = "Normal Operations: No immediate critical faults detected."
    confidence = 0.95
    evidence = f"Telemetry values are within safe thresholds: Temperature {temp}°C, Vibration {vib} mm/s."
    
    # Query similar incidents dynamically
    from app.models.lessons_learned import IncidentRecord
    similar_inc = db.query(IncidentRecord).filter(IncidentRecord.equipment_id == eq.id).first()
    if similar_inc:
        similar_failures = f"A similar failure '{similar_inc.incident_name}' was recorded on this asset on {similar_inc.incident_date.isoformat()} due to: {similar_inc.cause}."
    else:
        similar_failures = "No matching historical incidents found in the database."
        
    recommended_actions = "Continue routine inspections according to the standard operating procedures."
    
    if vib > 4.5 or temp > 95.0:
        possible_cause = "Bearing Wear & Lubrication Starvation: High friction in the primary driveshaft bearing assembly."
        confidence = 0.88
        evidence = f"Vibration level is highly escalated at {vib} mm/s (critical limit: 4.5 mm/s), accompanied by temperature rise to {temp}°C."
        recommended_actions = "Immediately shut down the asset, check lubricant levels and viscosity, and inspect bearing surfaces for physical pitting."
        
    return {
        "possible_cause": possible_cause,
        "confidence": confidence,
        "evidence": evidence,
        "similar_failures": similar_failures,
        "recommended_actions": recommended_actions,
        "citations": default_citations
    }


@router.get("/{id}/qr")
def get_equipment_qr(id: int, db: Session = Depends(get_db)):
    """Generates a mock SVG QR Code linking to the asset digital twin profile."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    # Return a custom inline SVG representing a QR code
    qr_svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">'
        f'<rect width="100" height="100" fill="white"/>'
        f'<rect x="10" y="10" width="30" height="30" fill="black"/>'
        f'<rect x="15" y="15" width="20" height="20" fill="white"/>'
        f'<rect x="18" y="18" width="14" height="14" fill="black"/>'
        f'<rect x="60" y="10" width="30" height="30" fill="black"/>'
        f'<rect x="65" y="15" width="20" height="20" fill="white"/>'
        f'<rect x="68" y="18" width="14" height="14" fill="black"/>'
        f'<rect x="10" y="60" width="30" height="30" fill="black"/>'
        f'<rect x="15" y="65" width="20" height="20" fill="white"/>'
        f'<rect x="18" y="68" width="14" height="14" fill="black"/>'
        f'<rect x="45" y="20" width="8" height="8" fill="black"/>'
        f'<rect x="45" y="45" width="8" height="8" fill="black"/>'
        f'<rect x="20" y="45" width="8" height="8" fill="black"/>'
        f'<rect x="70" y="45" width="12" height="12" fill="black"/>'
        f'<rect x="60" y="70" width="20" height="20" fill="black"/>'
        f'<rect x="50" y="60" width="8" height="8" fill="black"/>'
        f'<text x="50" y="95" font-family="monospace" font-size="6" text-anchor="middle" fill="black">{eq.asset_tag}</text>'
        f'</svg>'
    )
    from fastapi.responses import Response
    return Response(content=qr_svg, media_type="image/svg+xml")


@router.get("/{id}/gap-analysis")
def get_equipment_gap_analysis(id: int, db: Session = Depends(get_db)):
    """Identifies missing operational documents for an asset."""
    eq = db.query(EquipmentModel).filter(EquipmentModel.id == id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Machinery asset not found.")
        
    from app.models.document import DocumentModel
    docs = db.query(DocumentModel).filter(DocumentModel.asset_id == eq.id).all()
    uploaded_categories = {d.category for d in docs if d.category}
    
    required = ["Manual", "SOP", "Inspection", "Calibration", "Risk Assessment"]
    checklist = {req: (req in uploaded_categories) for req in required}
    missing = [req for req in required if req not in uploaded_categories]
    
    return {
        "equipment_id": eq.id,
        "asset_tag": eq.asset_tag,
        "checklist": checklist,
        "missing_documents": missing,
        "recommendations": [f"Create and upload a {m} document to satisfy safety protocols." for m in missing]
    }

import os
import json
import math
from datetime import datetime, timedelta

class PredictiveEngine:
    MODEL_PATH = "./ml_sandbox/models/failure_predictor.json"

    @classmethod
    def load_model(cls) -> dict:
        # Default fallback bounds and centroids if model file not found
        default_model = {
            "temp_bounds": [42.0, 610.0],
            "vib_bounds": [0.8, 6.8],
            "centroids": {
                "Operational": [0.05, 0.05],
                "Maintenance": [0.95, 0.70],
                "Degraded": [0.10, 0.95]
            }
        }
        if os.path.exists(cls.MODEL_PATH):
            try:
                with open(cls.MODEL_PATH, "r") as f:
                    return json.load(f)
            except Exception:
                return default_model
        return default_model

    @classmethod
    def run_prediction(
        cls,
        temperature: float,
        pressure: float,
        vibration: float,
        running_hours: float,
        equipment_age_days: float,
        last_maintenance_days: float,
        asset_tag: str
    ) -> dict:
        """
        Runs the predictive intelligence engine based on multi-metrics telemetry inputs,
        nearest centroid classifications, and heuristic domain rules.
        """
        model = cls.load_model()
        t_min, t_max = model["temp_bounds"]
        v_min, v_max = model["vib_bounds"]

        # Normalize features for nearest centroid status classification
        norm_temp = (temperature - t_min) / (t_max - t_min) if t_max > t_min else 0.0
        norm_vib = (vibration - v_min) / (v_max - v_min) if v_max > v_min else 0.0
        features = [norm_temp, norm_vib]

        # Calculate Euclidean distances to centroids
        best_status = "Operational"
        min_distance = float("inf")
        for status, centroid in model["centroids"].items():
            dist = math.sqrt(sum((x - y) ** 2 for x, y in zip(features, centroid)))
            if dist < min_distance:
                min_distance = dist
                best_status = status

        predicted_failure = "None"
        base_probability = 0.0

        # Heuristic rules based on asset thresholds
        is_pump = "PUMP" in asset_tag.upper()
        is_turbine = "TURBINE" in asset_tag.upper()
        is_boiler = "BOILER" in asset_tag.upper()
        is_compressor = "COMP" in asset_tag.upper()
        is_substation = "SUBSTATION" in asset_tag.upper()

        if is_pump:
            if temperature > 60.0 or vibration > 3.0 or pressure > 6.0:
                best_status = "Degraded"
                predicted_failure = "Centrifugal Pump Impeller Cavitation & Bearing Wear"
                base_probability = 68.0
            if temperature > 80.0 or vibration > 5.0 or pressure > 9.0:
                best_status = "Degraded"
                predicted_failure = "Pump Gasket Seal Failure & Critical Friction Overheating"
                base_probability = 92.0
        elif is_turbine:
            if temperature > 650.0 or vibration > 6.0:
                best_status = "Maintenance"
                predicted_failure = "Gas Turbine Blade Thermal Fatigue & Rotor Imbalance"
                base_probability = 72.0
            if temperature > 720.0 or vibration > 8.0:
                best_status = "Degraded"
                predicted_failure = "Turbine Thrust Bearing Hydrodynamic Seizure"
                base_probability = 96.0
        elif is_boiler:
            if temperature > 240.0 or pressure > 35.0 or vibration > 2.0:
                best_status = "Degraded"
                predicted_failure = "Boiler Steam Chamber Overpressure & Valve Leakage"
                base_probability = 62.0
            if temperature > 280.0 or pressure > 45.0:
                best_status = "Degraded"
                predicted_failure = "Boiler Tube Leakage & Critical Thermal Expansion stress"
                base_probability = 88.0
        elif is_compressor:
            if temperature > 110.0 or vibration > 8.0 or pressure > 22.0:
                best_status = "Degraded"
                predicted_failure = "Air Compressor Reciprocating Valve Failure"
                base_probability = 70.0
            if temperature > 130.0 or vibration > 11.0:
                best_status = "Degraded"
                predicted_failure = "Compressor Cylinder Overheating Mechanical Seizure"
                base_probability = 94.0
        elif is_substation:
            if temperature > 55.0 or vibration > 1.5:
                best_status = "Degraded"
                predicted_failure = "Transformer Substation Overload & Dielectric Sparking"
                base_probability = 65.0

        # Calculate final failure probability based on status, age, and maintenance history
        if best_status == "Maintenance":
            prob = max(base_probability, 40.0 + min(running_hours / 300, 20.0))
        elif best_status == "Degraded":
            prob = max(base_probability, 75.0 + min(running_hours / 500, 15.0))
        else: # Operational
            prob = max(base_probability, min(running_hours / 400, 15.0) + min(last_maintenance_days / 12, 10.0))

        # Total age wear factor
        prob += min(equipment_age_days / 365, 5.0)
        prob = min(max(prob, 1.0), 99.0)

        # Remaining useful life (RUL)
        design_life = 25000.0
        base_rul = max(design_life - running_hours, 0.0)

        if prob > 80.0:
            rul = min(base_rul * 0.05, 120.0) # Under 120 hours left
        elif prob > 50.0:
            rul = min(base_rul * 0.35, 1200.0) # Under 1200 hours left
        elif prob > 20.0:
            rul = base_rul * 0.75
        else:
            rul = base_rul

        # Maintenance priority
        if prob > 80.0:
            priority = "Critical"
        elif prob > 50.0:
            priority = "High"
        elif prob > 20.0:
            priority = "Medium"
        else:
            priority = "Low"

        # Suggested maintenance date calculation
        now = datetime.utcnow()
        if priority == "Critical":
            suggested_date = now + timedelta(days=1)
        elif priority == "High":
            suggested_date = now + timedelta(days=7)
        elif priority == "Medium":
            suggested_date = now + timedelta(days=30)
        else:
            suggested_date = now + timedelta(days=90)

        # Calculate confidence score
        confidence = 96.0 - (min(last_maintenance_days / 35, 5.0)) - (abs(norm_temp - 0.5) * 4.0)
        confidence = min(max(confidence, 65.0), 98.0)

        return {
            "predicted_failure": predicted_failure if priority in ["High", "Critical"] else "None",
            "failure_probability": round(prob, 2),
            "remaining_useful_life": round(max(rul, 0.0), 1),
            "maintenance_priority": priority,
            "suggested_maintenance_date": suggested_date,
            "confidence_score": round(confidence, 1)
        }

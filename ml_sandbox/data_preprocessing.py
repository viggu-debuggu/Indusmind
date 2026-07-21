import math
from typing import List, Dict, Any, Tuple

# Mock raw telemetry database records
MOCK_RAW_TELEMETRY = [
    {"asset": "PUMP-P102", "temp": 42.0, "vibration": 1.2, "status": "Operational"},
    {"asset": "PUMP-P102", "temp": 44.5, "vibration": 1.4, "status": "Operational"},
    {"asset": "BOILER-B401", "temp": 210.0, "vibration": 0.8, "status": "Operational"},
    {"asset": "BOILER-B401", "temp": 215.2, "vibration": 0.9, "status": "Operational"},
    {"asset": "TURBINE-T203", "temp": 580.0, "vibration": 4.8, "status": "Maintenance"},
    {"asset": "TURBINE-T203", "temp": 610.0, "vibration": 5.2, "status": "Maintenance"},
    {"asset": "COMP-C300", "temp": 88.0, "vibration": 6.2, "status": "Degraded"},
    {"asset": "COMP-C300", "temp": 92.5, "vibration": 6.8, "status": "Degraded"},
]


def clean_outliers(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filters telemetry entries with unrealistic or missing metrics."""
    cleaned = []
    for entry in data:
        # Exclude extreme sensor reading anomalies
        if 0 < entry["temp"] < 2000 and 0 <= entry["vibration"] < 100:
            cleaned.append(entry)
    return cleaned


def normalize_features(
    data: List[Dict[str, Any]], 
    temp_bounds: Tuple[float, float], 
    vib_bounds: Tuple[float, float]
) -> List[Dict[str, Any]]:
    """Applies MinMax scaling to normalize temperature and vibration features."""
    t_min, t_max = temp_bounds
    v_min, v_max = vib_bounds
    
    normalized = []
    for entry in data:
        # Avoid zero division
        norm_temp = (entry["temp"] - t_min) / (t_max - t_min) if t_max > t_min else 0.0
        norm_vib = (entry["vibration"] - v_min) / (v_max - v_min) if v_max > v_min else 0.0
        
        normalized.append({
            "asset": entry["asset"],
            "features": [norm_temp, norm_vib],
            "status": entry["status"]
        })
    return normalized


def prepare_dataset() -> Tuple[List[Dict[str, Any]], Tuple[float, float], Tuple[float, float]]:
    """Loads, cleans, and scales industrial asset telemetry dataset."""
    cleaned = clean_outliers(MOCK_RAW_TELEMETRY)
    
    # Calculate normalization boundaries
    temps = [x["temp"] for x in cleaned]
    vibrations = [x["vibration"] for x in cleaned]
    
    temp_bounds = (min(temps), max(temps))
    vib_bounds = (min(vibrations), max(vibrations))
    
    dataset = normalize_features(cleaned, temp_bounds, vib_bounds)
    return dataset, temp_bounds, vib_bounds


if __name__ == "__main__":
    data, t_b, v_b = prepare_dataset()
    print(f"Dataset prepared successfully. Total entries: {len(data)}")
    print(f"Temperature bounds: {t_b}, Vibration bounds: {v_b}")
    print(f"Example normalized record: {data[0]}")

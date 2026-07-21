import json
import math
from typing import List, Dict, Any

class TelemetryPredictor:
    """Loads failure_predictor.json and makes health classifications."""
    
    def __init__(self, model_path: str):
        with open(model_path, "r") as f:
            model_data = json.load(f)
            
        self.centroids: Dict[str, List[float]] = model_data["centroids"]
        self.temp_min, self.temp_max = model_data["temp_bounds"]
        self.vib_min, self.vib_max = model_data["vib_bounds"]

    def _normalize(self, value: float, min_val: float, max_val: float) -> float:
        if max_val > min_val:
            return (value - min_val) / (max_val - min_val)
        return 0.0

    def _euclidean_distance(self, v1: List[float], v2: List[float]) -> float:
        return math.sqrt(sum((x - y) ** 2 for x, y in zip(v1, v2)))

    def predict_health(self, temp: float, vibration: float) -> str:
        # 1. Normalize input features
        norm_temp = self._normalize(temp, self.temp_min, self.temp_max)
        norm_vib = self._normalize(vibration, self.vib_min, self.vib_max)
        features = [norm_temp, norm_vib]

        # 2. Find nearest class centroid
        best_status = "Unknown"
        min_distance = float("inf")
        for status, centroid in self.centroids.items():
            dist = self._euclidean_distance(features, centroid)
            if dist < min_distance:
                min_distance = dist
                best_status = status
                
        return best_status


if __name__ == "__main__":
    predictor = TelemetryPredictor("./ml_sandbox/models/failure_predictor.json")
    
    # Test cases mapping to mock assets
    test_cases = [
        {"name": "Scenario A: Normal Pump operation", "temp": 43.0, "vibration": 1.1},
        {"name": "Scenario B: Overheating turbine leak", "temp": 590.0, "vibration": 5.0},
        {"name": "Scenario C: Excessive compressor vibration", "temp": 89.0, "vibration": 6.5},
    ]

    print("Running telemetry prediction test checks...")
    for tc in test_cases:
        pred = predictor.predict_health(tc["temp"], tc["vibration"])
        print(f"  {tc['name']}: {pred}")

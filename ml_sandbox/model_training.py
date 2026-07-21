import os
import json
import math
from typing import List, Dict, Any, Tuple
from data_preprocessing import prepare_dataset

class NearestCentroidClassifier:
    """Pure Python Nearest-Centroid classifier for zero-dependency inference."""
    
    def __init__(self):
        self.centroids: Dict[str, List[float]] = {}
        self.temp_bounds: Tuple[float, float] = (0.0, 0.0)
        self.vib_bounds: Tuple[float, float] = (0.0, 0.0)

    def fit(
        self, 
        dataset: List[Dict[str, Any]], 
        temp_bounds: Tuple[float, float], 
        vib_bounds: Tuple[float, float]
    ) -> None:
        self.temp_bounds = temp_bounds
        self.vib_bounds = vib_bounds
        
        # Group features by class status
        grouped: Dict[str, List[List[float]]] = {}
        for entry in dataset:
            status = entry["status"]
            if status not in grouped:
                grouped[status] = []
            grouped[status].append(entry["features"])
            
        # Calculate centroids (mean feature vector for each class status)
        for status, features_list in grouped.items():
            num_features = len(features_list[0])
            num_samples = len(features_list)
            
            centroid = [0.0] * num_features
            for features in features_list:
                for i in range(num_features):
                    centroid[i] += features[i]
                    
            centroid = [val / num_samples for val in centroid]
            self.centroids[status] = centroid

    def _euclidean_distance(self, v1: List[float], v2: List[float]) -> float:
        return math.sqrt(sum((x - y) ** 2 for x, y in zip(v1, v2)))

    def predict(self, normalized_features: List[float]) -> str:
        best_status = "Unknown"
        min_distance = float("inf")
        
        for status, centroid in self.centroids.items():
            dist = self._euclidean_distance(normalized_features, centroid)
            if dist < min_distance:
                min_distance = dist
                best_status = status
                
        return best_status

    def evaluate(self, dataset: List[Dict[str, Any]]) -> float:
        """Evaluates prediction accuracy over dataset."""
        correct = 0
        for entry in dataset:
            prediction = self.predict(entry["features"])
            if prediction == entry["status"]:
                correct += 1
        return correct / len(dataset) if dataset else 0.0

    def export_model(self, file_path: str) -> None:
        """Saves model parameters and bounds as JSON."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        model_data = {
            "centroids": self.centroids,
            "temp_bounds": list(self.temp_bounds),
            "vib_bounds": list(self.vib_bounds)
        }
        with open(file_path, "w") as f:
            json.dump(model_data, f, indent=2)


if __name__ == "__main__":
    print("Initializing nearest centroid model training pipeline...")
    dataset, temp_bounds, vib_bounds = prepare_dataset()
    
    model = NearestCentroidClassifier()
    model.fit(dataset, temp_bounds, vib_bounds)
    
    accuracy = model.evaluate(dataset)
    print("SUCCESS: Model training completed.")
    print(f"  Calculated Centroids: {model.centroids}")
    print(f"  Training Accuracy: {accuracy * 100:.1f}%")
    
    # Export parameters
    export_path = "./ml_sandbox/models/failure_predictor.json"
    model.export_model(export_path)
    print(f"SUCCESS: Model parameters exported to: {export_path}")

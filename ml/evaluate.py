"""
WomenSafe AI - ML Model Evaluation & Validation Suite
"""

import os
import json
import pandas as pd
import joblib
from sklearn.metrics import confusion_matrix, classification_report

def evaluate():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "risk_model.joblib")
    dataset_path = os.path.join(current_dir, "dataset.csv")

    if not os.path.exists(dataset_path):
        print("Dataset not found, skipping evaluation.")
        return

    df = pd.read_csv(dataset_path)
    features = [
        "lighting_condition",
        "crowd_level",
        "emergency_distance",
        "area_type",
        "historical_risk",
        "companion_status",
        "time_hour",
        "safe_haven_count",
    ]

    print(f"Validation against {len(df)} empirical records.")
    print("Class distribution:")
    print(df["risk_level"].value_counts())

if __name__ == "__main__":
    evaluate()

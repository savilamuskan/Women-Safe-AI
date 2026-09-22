"""
WomenSafe AI - Scikit-learn Risk Estimator Pipeline
Feature Engineering, Calibration, and Explainable Attribution Pipeline
"""

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline

CATEGORICAL_FEATURES = [
    "lighting_condition",
    "crowd_level",
    "emergency_distance",
    "area_type",
    "historical_risk",
    "companion_status",
]

NUMERICAL_FEATURES = ["time_hour", "safe_haven_count"]

def build_risk_pipeline():
    """
    Builds an end-to-end Scikit-learn pipeline for multi-class women safety risk classification.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("num", StandardScaler(), NUMERICAL_FEATURES),
        ]
    )

    classifier = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
    )

    pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", classifier)])
    return pipeline

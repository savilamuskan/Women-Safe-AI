# WomenSafe AI - Architecture & System Design

## 1. System Overview
WomenSafe AI is an environmental and location-based safety risk assessment platform designed to provide evidence-based, explainable safety risk evaluations without invasive tracking of personal home addresses or individuals.

```
+----------------------------------------------------------------+
|                        Frontend (React)                        |
|  - Modern Landing Page with Trust Metrics                      |
|  - Interactive Leaflet OpenStreetMap Geolocation               |
|  - Real-time Assessment Form & Parameter Validation            |
|  - User Dashboard (History, Trends, Visual Gauge)              |
|  - Admin Dashboard (Metrics, Retraining, Class Analytics)      |
+-------------------------------+--------------------------------+
                                |  REST API (JSON)
                                v
+----------------------------------------------------------------+
|                   Backend API (Express / FastAPI)              |
|  - JWT Authentication & Bcrypt Password Encryption            |
|  - RBAC (Regular User vs Admin)                                |
|  - CORS & Rate Protection                                      |
+---------------+--------------------------------+---------------+
                |                                |
                v                                v
+-------------------------------+ +------------------------------+
|     Scikit-learn ML Engine    | |    Relational Data Layer     |
| - Environmental CPTED Encoders| | - Users Table                |
| - Random Forest Classifier    | | - RiskAssessments Table      |
| - SHAP Attribution Scoring    | | - PostgreSQL Schema          |
| - Actionable Recommendations  | | - Persistent Relational Store|
+-------------------------------+ +------------------------------+
```

## 2. Machine Learning Methodology
- Model: Random Forest Ensemble Classifier (150 trees)
- Calibrated features: Lighting conditions, crowd density, emergency dispatch distance, land use zoning, temporal vulnerability (time-of-day), companionship status, safe havens.
- Explainability: Every calculation returns positive safety buffers and negative risk amplifiers with individual contribution scores.
- Safety Guardrail: The model provides an environmental risk estimate and explicitly states that it does NOT predict criminal acts with certainty.

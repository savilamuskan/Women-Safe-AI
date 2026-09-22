# WomenSafe AI - REST API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

### Register User
- **Method:** `POST`
- **Endpoint:** `/auth/register`
- **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Response (201):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": "usr_171...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

### Login User
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

### Current User
- **Method:** `GET`
- **Endpoint:** `/auth/me`
- **Header:** `Authorization: Bearer <token>`

---

## Risk Assessment

### Predict Safety Risk
- **Method:** `POST`
- **Endpoint:** `/risk/predict`
- **Headers:** Optional `Authorization: Bearer <token>`
- **Body:**
```json
{
  "location": "Northside Commercial Avenue",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "date": "2026-09-22",
  "time": "23:30",
  "day": "Tuesday",
  "areaType": "commercial",
  "lightingCondition": "pitch_dark",
  "crowdLevel": "low",
  "emergencyDistance": "1km_3km",
  "historicalRisk": "moderate",
  "nearbyAmenities": ["transit_station"],
  "travelMode": "walking",
  "companionStatus": "alone"
}
```
- **Response (200):**
```json
{
  "success": true,
  "assessmentId": "rec_172...",
  "result": {
    "riskScore": 68,
    "riskLevel": "Medium",
    "confidenceScore": 0.94,
    "summary": "Environmental Risk Index: 68/100 (Medium Risk)",
    "explanation": "Assessment indicates MEDIUM risk due to low ambient lighting and reduced foot traffic.",
    "contributingFactors": [
      {
        "factor": "Pitch Dark / Unlit Surroundings",
        "category": "lighting",
        "impact": "amplifier",
        "scoreImpact": 25,
        "description": "Complete absence of artificial illumination."
      }
    ],
    "recommendations": [
      "Prefer well-lit routes with active shops.",
      "Share real-time trip status with emergency contacts."
    ],
    "immediateDangerNotice": "If you are in immediate danger, contact your local emergency services or a trusted person immediately."
  }
}
```

### Assessment History
- **Method:** `GET`
- **Endpoint:** `/risk/history`
- **Header:** `Authorization: Bearer <token>`

### Delete Assessment
- **Method:** `DELETE`
- **Endpoint:** `/risk/:id`
- **Header:** `Authorization: Bearer <token>`

---

## Admin Endpoints
- **Method:** `GET` `/admin/stats`
- **Method:** `GET` `/admin/assessments`
- **Method:** `POST` `/admin/retrain`
- **Header:** `Authorization: Bearer <admin_token>`

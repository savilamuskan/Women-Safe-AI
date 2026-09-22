# WomenSafe AI - AI-Based Women Safety Risk Predictor

A complete, production-ready full-stack web application designed to evaluate environmental and location-based safety risk factors for women and vulnerable pedestrians.

---

## Key Features

1. **Professional Landing Page**
   - Commercial-grade aesthetic with clear mission, safety protocols, and emergency numbers.
   - Transparent accuracy and community trust metrics.

2. **AI Safety Risk Assessment**
   - Multi-factor environmental input form: Location, Time, Lighting, Crowd density, Emergency response proximity, Land-use zoning, Companion status, and Safe havens.
   - Interactive Leaflet map with OpenStreetMap geocoding and reverse location lookup.
   - Strict privacy safeguards: No collection or storage of exact private residential addresses.

3. **Explainable AI Result Engine**
   - Calibrated Risk Score (0–100) with categorical level: Low, Medium, High.
   - Dynamic attribution cards highlighting both risk amplifiers and safety buffers.
   - Plain-language contextual explanation and personalized, actionable recommendations.
   - Prominent immediate danger emergency notices.

4. **User & Admin Dashboards**
   - Personal risk assessment timeline, history review, detail inspections, and deletion controls.
   - Admin control center with system-wide analytics, risk-level distributions, hourly heatmaps, and ML pipeline retraining controls.

5. **Authentication & Security**
   - Bcrypt password hashing, JWT bearer tokens, role-based access control (User/Admin).
   - Pre-seeded test accounts:
     - User: `user@womensafe.ai` / `password123`
     - Admin: `admin@womensafe.ai` / `admin123`

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Leaflet, Lucide Icons, Motion
- **Backend**: Express + tsx, FastAPI schemas & Python scripts, RESTful API
- **Machine Learning**: Scikit-learn Random Forest ensemble, explainable attribution
- **Database**: PostgreSQL DDL migrations, SQLAlchemy models, and JSON-backed relational storage

---

## Setup & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

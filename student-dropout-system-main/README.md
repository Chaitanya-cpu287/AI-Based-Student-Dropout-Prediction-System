# 🎓 AI-Based Student Dropout Prediction System (EduGuard)

> An enterprise-grade, full-stack machine learning application designed to proactively identify students at risk of academic dropout, provide early interventions, and deliver personalized AI counseling.

---

## 📌 Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │            Frontend Web Portals               │
                      │  (Student Portal / Mentor Portal / Admin UI)  │
                      └───────────────────────┬───────────────────────┘
                                              │ HTTP / JSON
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │          Node.js Express Backend API          │
                      │               (Port 3000)                     │
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
                PostgreSQL /         │                 │ REST HTTP
                Local Store          │                 │ (Single & Batch)
                                     ▼                 ▼
             ┌─────────────────────────┐     ┌────────────────────────┐
             │     Database Layer      │     │     Python ML API      │
             │   (schema.sql & seeds)  │     │      (Port 5000)       │
             └─────────────────────────┘     └───────────┬────────────┘
                                                         │
                                                         ▼
                                             ┌────────────────────────┐
                                             │ Soft Voting Classifier │
                                             │ (RF + XGBoost + LogReg)│
                                             │   Accuracy: 91.80%     │
                                             │   ROC-AUC:  0.9780     │
                                             └────────────────────────┘
```

---

## ✨ Features

### 👨‍🎓 1. Student Portal
* **Instant Risk Assessment**: Immediate calculation of dropout risk percentage and categorization (**Low**, **Medium**, **High**).
* **Predictive Visualizations**: Dynamic radar chart analyzing study vectors, trajectory trendline chart, and stability gauges.
* **AI Academic Success Counselor**: Integrated interactive counselor powered by Google Gemini (with an automated rule-based heuristic counselor fallback).

### 👨‍🏫 2. Mentor Portal
* **Cohort Overview**: True cohort metrics (average attendance, average marks, total backlogs across assigned mentees).
* **Risk Distribution Analytics**: Live Chart.js doughnut and ranked risk percentage bar charts.
* **Student Deep-Dive**: Modal popup showing comprehensive academic history, 6-factor radar chart, and automated action plan recommendations.
* **Session Notes**: Persistent notes log saved per student.
* **Instant Re-Prediction**: Refresh individual student predictions on demand.

### 🛡️ 3. Admin Portal
* **Complete Student Directory**: View all enrolled students with their current assigned mentor.
* **Add New Students**: Integrated form with instant numeric and range validation.
* **One-Click Mentor Assignment**: Dynamic dropdown linking students to mentors with real-time persistence.
* **Student Deletion**: Secure student record removal with cascading relation cleanup.

---

## 🔑 Pre-Seeded Demo Credentials

The system includes pre-configured demo accounts so you can evaluate all portals immediately without manual database entry:

| Portal | Login Page | Username / ID | Password / DOB | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `frontend/student/index.html` | `ADM101` | `2004-05-15` | Low Risk Profile (Aarav Patel) |
| **Student** | `frontend/student/index.html` | `ADM103` | `2004-02-10` | High Risk Profile (Rohan Kumar) |
| **Mentor** | `frontend/mentor/login.html` | `MNT101` | `mentor123` | Dr. Sarah Jenkins (Mentees: ADM101–ADM104) |
| **Mentor** | `frontend/mentor/login.html` | `MNT102` | `mentor123` | Prof. Rajesh Sharma (Mentees: ADM105–ADM108) |
| **Admin** | `frontend/admin/login.html` | `admin` | `admin123` | Full administrative privileges |

---

## 🚀 Quick Start (One-Click Launch)

### On Windows:
Double-click `start.bat` in the project root. It will:
1. Start the Python ML API on `http://localhost:5000`
2. Start the Node.js backend server on `http://localhost:3000`
3. Launch the portal homepage in your default web browser

### On macOS / Linux:
```bash
chmod +x start.sh
./start.sh
```

---

## ⚙️ Manual Setup & Installation

### Step 1: Python ML API
```bash
cd ml_api
pip install -r requirements.txt
python app.py
```
*ML API runs at `http://localhost:5000`.*

### Step 2: Node.js Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs at `http://localhost:3000`.*

> **Dual Database Mode**: If PostgreSQL is running on port 5432 with credentials in `.env`, the system automatically connects to PostgreSQL and creates the schema. If PostgreSQL is offline or uninstalled, the backend **automatically and seamlessly switches to persistent local database storage**, allowing zero-friction testing.

### Step 3: Frontend Web Portals
Open `frontend/index.html` directly in your browser or serve it using any local web server (e.g. VS Code Live Server, `npx serve frontend`, or Python `python -m http.server 5500`).

---

## 📊 Machine Learning Model Details

* **Ensemble Architecture**: Soft Voting Classifier combining:
  * **Random Forest Classifier** (`n_estimators=120`, `max_depth=10`)
  * **XGBoost Classifier** (`n_estimators=100`, `max_depth=5`, `learning_rate=0.08`)
  * **Logistic Regression** (encapsulated in a `StandardScaler` pipeline to safely normalize diverse feature scales such as `annual_income`)
* **Evaluation Metrics**:
  * **Accuracy**: **91.80%**
  * **ROC-AUC**: **0.9780**
* **Input Features**:
  1. `attendance` (0–100%)
  2. `marks` (0–100)
  3. `study_hours` (1–12 hrs/day)
  4. `distance_from_home` (km)
  5. `annual_income` (₹ / currency)
  6. `previous_marks` (0–100)
  7. `backlogs` (count)
  8. `assignments_completed` (0–100%)
  9. `participation` (1–10)
* **Training & Testing**:
  To retrain the model at any time:
  ```bash
  python "Voting Model/src/train_random_forest.py"
  ```
  To test model inference on sample vectors:
  ```bash
  python "Voting Model/src/test_random_forest.py"
  ```

---

## 📡 API Endpoint Reference

### Machine Learning API (`http://localhost:5000`)
* `GET /health`: Service health and model status
* `POST /predict`: Predict dropout risk
  * Accepts a single JSON object: `{ "attendance": 80, ... }`
  * Accepts batch JSON array: `[ { ... }, { ... } ]` or `{ "students": [ ... ] }`

### Backend REST API (`http://localhost:3000`)
* `GET /health`: Backend and active database mode status
* `POST /api/login`: Student portal authentication
* `POST /api/mentor/login`: Mentor authentication
* `GET /api/mentor/students/:mentorId`: Fetch all students assigned to a mentor with batched ML predictions
* `POST /api/admin/login`: Admin authentication
* `GET /api/admin/students`: Directory of all students with mentor assignments
* `POST /api/admin/student`: Add a new student record
* `POST /api/admin/assign-mentor`: Assign or reassign a mentor to a student
* `DELETE /api/admin/student/:id`: Remove a student
* `GET /api/admin/mentors`: List of all registered mentors
* `POST /api/predict`: Proxy endpoint for ML prediction with heuristic fallback
* `POST /api/chat`: AI Academic Counselor conversation endpoint (Gemini with heuristic fallback)

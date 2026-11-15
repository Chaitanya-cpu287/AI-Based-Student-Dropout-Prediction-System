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
| **Student** | `student-dropout-system-main/frontend/student/index.html` | `ADM101` | `2004-05-15` | Low Risk Profile (Aarav Patel) |
| **Student** | `student-dropout-system-main/frontend/student/index.html` | `ADM103` | `2004-02-10` | High Risk Profile (Rohan Kumar) |
| **Mentor** | `student-dropout-system-main/frontend/mentor/login.html` | `MNT101` | `mentor123` | Dr. Sarah Jenkins (Mentees: ADM101–ADM104) |
| **Mentor** | `student-dropout-system-main/frontend/mentor/login.html` | `MNT102` | `mentor123` | Prof. Rajesh Sharma (Mentees: ADM105–ADM108) |
| **Admin** | `student-dropout-system-main/frontend/admin/login.html` | `admin` | `admin123` | Full administrative privileges |

---

## 🚀 Quick Start (One-Click Launch)

### On Windows:
Double-click `start.bat` in the root folder. It will:
1. Start the Python ML API on `http://localhost:5000`
2. Start the Node.js backend server on `http://localhost:3000`
3. Launch the portal homepage in your default web browser

---

## ⚙️ Manual Setup & Installation

### Step 1: Python ML API
```bash
cd student-dropout-system-main/ml_api
pip install -r requirements.txt
python app.py
```
*ML API runs at `http://localhost:5000`.*

### Step 2: Node.js Backend Server
```bash
cd student-dropout-system-main/backend
npm install
npm start
```
*Backend runs at `http://localhost:3000`.*

> **Dual Database Mode**: If PostgreSQL is running on port 5432 with credentials in `.env`, the system automatically connects to PostgreSQL and creates the schema. If PostgreSQL is offline or uninstalled, the backend **automatically and seamlessly switches to persistent local database storage**, allowing zero-friction testing.

### Step 3: Frontend Web Portals
Open `student-dropout-system-main/frontend/index.html` directly in your browser.

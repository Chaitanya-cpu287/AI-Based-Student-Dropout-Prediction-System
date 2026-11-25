# AI-Based Student Dropout Prediction System (EduGuard)

> An enterprise-grade, full-stack machine learning application designed to proactively identify students at risk of academic dropout, provide early interventions, and deliver personalized AI counseling.

---

## Architecture Overview

```
                      +-----------------------------------------------+
                      |            Frontend Web Portals               |
                      |  (Student Portal / Mentor Portal / Admin UI)  |
                      +-----------------------+-----------------------+
                                              | HTTP / JSON
                                              v
                      +-----------------------------------------------+
                      |          Node.js Express Backend API          |
                      |               (Port 3000)                     |
                      +-----------+-----------------------+-----------+
                                  |                       |
             PostgreSQL /         |                       | REST HTTP
             Local Store          |                       | (Single & Batch)
                                  v                       v
                      +-----------------------+  +--------------------+
                      |     Database Layer    |  |   Python ML API    |
                      |  (schema.sql & seeds) |  |    (Port 5000)     |
                      +-----------------------+  +---------+----------+
                                                           |
                                                           v
                                              +-------------------------+
                                              | Soft Voting Classifier  |
                                              | (RF + XGBoost + LogReg) |
                                              |   Accuracy: 91.80%      |
                                              |   ROC-AUC:  0.9780      |
                                              +-------------------------+
```

---

## Key Features

- **Multi-Role Portals:** Tailored interfaces for Students (academic trajectory & AI chatbot), Mentors (assigned cohort risk profiles), and Administrators (institution-wide attrition telemetry).
- **Ensemble Machine Learning Inference:** Integrates a Soft Voting Classifier combining Random Forest, XGBoost, and Logistic Regression with 91.8% accuracy.
- **Dedicated ML Pipeline Repository:** Model training scripts, synthetic feature generators, and evaluation benchmarks are maintained at [**Chaitanya-cpu287/ML-model-for-Student-Dropout-Prediction-System**](https://github.com/Chaitanya-cpu287/ML-model-for-Student-Dropout-Prediction-System).
- **Proactive Early Warning Engine:** Evaluates student attendance records, mid-semester test scores, backlog ratios, and behavioral indicators.
- **Containerized Microservices:** Shipped with `docker-compose.yml` orchestrating the Node.js API, PostgreSQL store, and Python ML services.
- **Automated Test Harness:** Integrated integration test suite (`test_suite.js`) validating authentication flows, mentor assignments, and ML scoring endpoints.

---

## Tech Stack

- **Backend API:** Node.js, Express.js (v5), RESTful architecture
- **Machine Learning Core:** Python, Scikit-Learn, XGBoost, Joblib
- **Database:** PostgreSQL with in-memory fallback for lightweight evaluation
- **Deployment:** Docker, Docker Compose

---

## Quickstart & Local Execution

### 1. Prerequisites
- Node.js (v18+)
- Python 3.9+
- Docker & Docker Compose (Optional)

### 2. Launch with Docker Compose

```bash
docker-compose up --build
```
- Access Frontend Portals at `http://localhost:3000`
- Access ML Inference Service at `http://localhost:5000`

### 3. Running Automated Tests

```bash
cd backend
npm test
```

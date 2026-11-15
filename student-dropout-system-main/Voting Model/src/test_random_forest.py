import pickle
import json
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "voting_model.pkl"
META_PATH = BASE_DIR / "model" / "model_metadata.json"

if not MODEL_PATH.exists():
    MODEL_PATH = BASE_DIR.parent / "ml_api" / "model" / "voting_model.pkl"
    META_PATH = BASE_DIR.parent / "ml_api" / "model" / "model_metadata.json"

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

print(f"Model loaded successfully from: {MODEL_PATH}")

if META_PATH.exists():
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    print(f"Model accuracy on test set: {meta['metrics']['accuracy']*100:.2f}% | ROC-AUC: {meta['metrics']['roc_auc']}")

# Test profile 1: At-risk student (low attendance, low income, backlogs)
high_risk_student = {
    "attendance": 48.0,
    "marks": 42.0,
    "study_hours": 1.5,
    "distance_from_home": 22.0,
    "annual_income": 180000,
    "previous_marks": 45.0,
    "backlogs": 4,
    "assignments_completed": 40.0,
    "participation": 2.5
}

# Test profile 2: Optimal student (high attendance, zero backlogs)
low_risk_student = {
    "attendance": 94.0,
    "marks": 89.0,
    "study_hours": 5.5,
    "distance_from_home": 4.0,
    "annual_income": 750000,
    "previous_marks": 88.0,
    "backlogs": 0,
    "assignments_completed": 96.0,
    "participation": 9.0
}

for label, student in [("High Risk Candidate", high_risk_student), ("Low Risk Candidate", low_risk_student)]:
    df = pd.DataFrame([student])
    pred = int(model.predict(df)[0])
    prob = float(model.predict_proba(df)[0][1])
    risk_pct = round(prob * 100, 2)
    risk_level = "Low" if risk_pct < 40 else "Medium" if risk_pct < 70 else "High"

    print(f"\n--- Prediction: {label} ---")
    print(f"  Dropout Prediction: {pred} ({'Likely Dropout' if pred == 1 else 'Likely to Graduate'})")
    print(f"  Risk Probability:   {risk_pct}%")
    print(f"  Risk Category:      {risk_level}")

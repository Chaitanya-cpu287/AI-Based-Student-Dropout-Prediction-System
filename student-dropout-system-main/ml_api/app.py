import os
import sys
import json
import pickle
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Safe encoding on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

CURRENT_DIR = Path(__file__).resolve().parent
PRIMARY_MODEL_PATH = CURRENT_DIR / "model" / "voting_model.pkl"
SECONDARY_MODEL_PATH = CURRENT_DIR.parent / "Voting Model" / "model" / "voting_model.pkl"
META_PATH = CURRENT_DIR / "model" / "model_metadata.json"

model = None
metadata = {}

model_path = PRIMARY_MODEL_PATH if PRIMARY_MODEL_PATH.exists() else SECONDARY_MODEL_PATH
if model_path.exists():
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print(f"Loaded ML Model from: {model_path}")
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}")

if META_PATH.exists():
    try:
        with open(META_PATH, "r") as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Warning: Could not read metadata: {e}")

FEATURES = [
    "attendance",
    "marks",
    "study_hours",
    "distance_from_home",
    "annual_income",
    "previous_marks",
    "backlogs",
    "assignments_completed",
    "participation"
]

DEFAULTS = {
    "attendance": 75.0,
    "marks": 60.0,
    "study_hours": 3.5,
    "distance_from_home": 10.0,
    "annual_income": 350000.0,
    "previous_marks": 65.0,
    "backlogs": 0,
    "assignments_completed": 70.0,
    "participation": 5.0
}


def sanitize_row(row_dict):
    clean = {}
    for f in FEATURES:
        val = row_dict.get(f)
        try:
            if val is None or val == "":
                clean[f] = DEFAULTS[f]
            else:
                clean[f] = float(val)
        except (ValueError, TypeError):
            clean[f] = DEFAULTS[f]
    return clean


def get_risk_level(risk_percent):
    if risk_percent < 40:
        return "Low"
    elif risk_percent < 70:
        return "Medium"
    else:
        return "High"


def explain_prediction(row, risk_percent):
    """Generate dynamic human-interpretable risk or protective factors."""
    factors = []

    if risk_percent >= 40:
        if row["attendance"] < 75:
            factors.append(f"Low Attendance ({row['attendance']:.1f}%)")
        if row["backlogs"] > 0:
            factors.append(f"Active Backlogs ({int(row['backlogs'])} courses)")
        if row["marks"] < 50:
            factors.append(f"Critical Marks Average ({row['marks']:.1f}/100)")
        if row["study_hours"] < 2.5:
            factors.append(f"Low Study Time ({row['study_hours']:.1f} hrs/day)")
        if row["annual_income"] < 250000:
            factors.append(f"Socioeconomic Stress (Income < \u20b92.5L)")
        if row["distance_from_home"] > 18:
            factors.append(f"Long Commute Distance ({row['distance_from_home']:.1f} km)")
        if row["assignments_completed"] < 60:
            factors.append(f"Low Assignment Completion ({row['assignments_completed']:.1f}%)")
        if not factors:
            factors.append("Cumulative multi-factor border risk")
    else:
        if row["attendance"] >= 80:
            factors.append(f"Strong Attendance ({row['attendance']:.1f}%)")
        if row["backlogs"] == 0:
            factors.append("Zero Academic Backlogs")
        if row["marks"] >= 70:
            factors.append(f"High Academic Marks ({row['marks']:.1f}/100)")
        if row["study_hours"] >= 4.0:
            factors.append(f"Dedicated Study Routine ({row['study_hours']:.1f} hrs/day)")
        if not factors:
            factors.append("Consistent overall performance profile")

    return factors[:3]


@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Student Dropout Prediction ML API",
        "model_loaded": model is not None,
        "features": FEATURES,
        "metrics": metadata.get("metrics", {}),
        "feature_importances": metadata.get("feature_importances", {})
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify(metadata if metadata else {"message": "Model metadata not available"})


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "ML model is not loaded"}), 503

    try:
        raw_data = request.get_json(force=True, silent=True)
        if raw_data is None:
            return jsonify({"error": "Invalid JSON payload"}), 400

        is_batch = False
        items = []

        if isinstance(raw_data, list):
            is_batch = True
            items = raw_data
        elif isinstance(raw_data, dict) and "students" in raw_data and isinstance(raw_data["students"], list):
            is_batch = True
            items = raw_data["students"]
        elif isinstance(raw_data, dict):
            items = [raw_data]
        else:
            return jsonify({"error": "Payload must be a JSON object or array"}), 400

        if len(items) == 0:
            return jsonify({"error": "Empty payload received"}), 400

        cleaned_records = [sanitize_row(item) for item in items]
        df = pd.DataFrame(cleaned_records)[FEATURES]

        predictions = model.predict(df)
        probabilities = model.predict_proba(df)[:, 1]

        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            risk_pct = round(float(prob) * 100, 2)
            row_dict = cleaned_records[i]
            level = get_risk_level(risk_pct)
            factors = explain_prediction(row_dict, risk_pct)

            results.append({
                "prediction": int(pred),
                "risk_percent": risk_pct,
                "risk_level": level,
                "key_factors": factors
            })

        if is_batch:
            return jsonify({
                "count": len(results),
                "predictions": results
            })
        else:
            return jsonify(results[0])

    except Exception as e:
        print("Prediction Error:", str(e))
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting ML API Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

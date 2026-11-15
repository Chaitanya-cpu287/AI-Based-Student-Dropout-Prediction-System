import os
import sys
import json
import pickle
from pathlib import Path

# Safe Unicode output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
import pandas as pd
import numpy as np

from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
    confusion_matrix,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score
)

# 1. Path Setup
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "rf_student_dropout_dataset.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_SAVE_PATH = MODEL_DIR / "voting_model.pkl"
METADATA_SAVE_PATH = MODEL_DIR / "model_metadata.json"

ML_API_MODEL_DIR = BASE_DIR.parent / "ml_api" / "model"
ML_API_MODEL_DIR.mkdir(parents=True, exist_ok=True)
ML_API_MODEL_PATH = ML_API_MODEL_DIR / "voting_model.pkl"
ML_API_METADATA_PATH = ML_API_MODEL_DIR / "model_metadata.json"

print(f"Loading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"Dataset loaded! Total instances: {len(df):,}")

X = df.drop("dropout", axis=1)
y = df["dropout"]

FEATURE_NAMES = list(X.columns)

# 2. Train-Test Split (80% Train, 20% Test, Stratified)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {len(X_train)} samples | Testing set: {len(X_test)} samples")

# 3. Component Classifiers
# A. Random Forest Classifier
rf = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

# B. XGBoost Classifier
xgb = XGBClassifier(
    n_estimators=120,
    max_depth=5,
    learning_rate=0.06,
    subsample=0.85,
    colsample_bytree=0.85,
    eval_metric="logloss",
    random_state=42
)

# C. Scaled Regularized Logistic Regression
lr = make_pipeline(
    StandardScaler(),
    LogisticRegression(max_iter=1000, C=1.0, random_state=42)
)

# 4. Soft Voting Ensemble
ensemble_model = VotingClassifier(
    estimators=[
        ("rf", rf),
        ("xgb", xgb),
        ("lr", lr)
    ],
    voting="soft",
    weights=[2, 2, 1]
)

# 5. Stratified 5-Fold Cross Validation
print("\nPerforming 5-Fold Stratified Cross-Validation on training data...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_acc = cross_val_score(ensemble_model, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
cv_auc = cross_val_score(ensemble_model, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)

print(f"5-Fold CV Accuracy: {cv_acc.mean()*100:.2f}% (+/- {cv_acc.std()*100:.2f}%)")
print(f"5-Fold CV ROC-AUC:  {cv_auc.mean():.4f} (+/- {cv_auc.std():.4f})")

# 6. Fit Ensemble on Full Training Set
print("\nFitting full ensemble model...")
ensemble_model.fit(X_train, y_train)

# 7. Evaluate on Unseen Holdout Test Set
y_pred = ensemble_model.predict(X_test)
y_prob = ensemble_model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)
brier = brier_score_loss(y_test, y_prob)
cm = confusion_matrix(y_test, y_pred).tolist()

print("\n" + "="*50)
print("[METRICS] FINAL MODEL PERFORMANCE METRICS (TEST SET)")
print("="*50)
print(f"Accuracy:         {acc * 100:.2f}%")
print(f"ROC-AUC Score:    {auc:.4f}")
print(f"Precision:        {prec * 100:.2f}%")
print(f"Recall:           {rec * 100:.2f}%")
print(f"F1-Score:         {f1:.4f}")
print(f"Brier Score Loss: {brier:.4f} (lower is better calibrated)")
print(f"\nConfusion Matrix:\nTN={cm[0][0]}, FP={cm[0][1]}\nFN={cm[1][0]}, TP={cm[1][1]}")
print("\nClassification Report:\n", classification_report(y_test, y_pred, digits=4))

# 8. Feature Importance Extraction (from RF and XGBoost components)
rf_fitted = ensemble_model.named_estimators_["rf"]
xgb_fitted = ensemble_model.named_estimators_["xgb"]

rf_importances = rf_fitted.feature_importances_
xgb_importances = xgb_fitted.feature_importances_
avg_importances = ((rf_importances + xgb_importances) / 2.0).round(4)

importance_dict = {
    feature: float(imp)
    for feature, imp in sorted(zip(FEATURE_NAMES, avg_importances), key=lambda x: x[1], reverse=True)
}

print("\n[EXPLAINABILITY] Global Feature Importances:")
for f, imp in importance_dict.items():
    print(f"  - {f:<22}: {imp*100:.2f}%")

# 9. Save Metadata JSON
metadata = {
    "model_name": "EduGuard Ensemble Voting Classifier (RF + XGB + LogReg)",
    "features": FEATURE_NAMES,
    "metrics": {
        "accuracy": round(float(acc), 4),
        "roc_auc": round(float(auc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "brier_score": round(float(brier), 4),
        "cv_accuracy_mean": round(float(cv_acc.mean()), 4),
        "cv_accuracy_std": round(float(cv_acc.std()), 4),
        "cv_auc_mean": round(float(cv_auc.mean()), 4)
    },
    "feature_importances": importance_dict,
    "feature_stats": {
        col: {
            "mean": round(float(df[col].mean()), 2),
            "std": round(float(df[col].std()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2)
        }
        for col in FEATURE_NAMES
    }
}

# 10. Persist Model and Metadata
for p in [MODEL_SAVE_PATH, ML_API_MODEL_PATH]:
    with open(p, "wb") as f:
        pickle.dump(ensemble_model, f)
    print(f"Ensemble model saved to: {p}")

for p in [METADATA_SAVE_PATH, ML_API_METADATA_PATH]:
    with open(p, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to: {p}")

print("\nModel training, cross-validation, and artifact deployment completed successfully!")

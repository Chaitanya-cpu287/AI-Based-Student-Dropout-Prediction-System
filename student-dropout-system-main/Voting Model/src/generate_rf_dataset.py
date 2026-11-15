import os
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.special import expit

np.random.seed(42)

n = 10000

print(f"Generating realistic educational dataset with {n} student records...")

# 1. Socioeconomic & Demographic Base
annual_income = np.random.lognormal(mean=12.6, sigma=0.6, size=n)
annual_income = np.clip(annual_income, 120000, 1500000).astype(int)

distance_from_home = np.random.gamma(shape=2.5, scale=4.0, size=n)
distance_from_home = np.clip(distance_from_home, 1.0, 35.0).round(1)

# 2. Behavioral & Academic Features with Realistic Domain Correlations
# Longer commute reduces available study hours
base_study = 4.5 - (distance_from_home / 20.0) + np.random.normal(0, 1.0, n)
study_hours = np.clip(base_study, 1.0, 10.0).round(1)

# Attendance influenced by distance and study habits
base_att = 78.0 - (distance_from_home * 0.7) + (study_hours * 2.5) + np.random.normal(0, 8.0, n)
attendance = np.clip(base_att, 25.0, 100.0).round(1)

# Prior academic foundation
previous_marks = np.random.normal(68.0, 14.0, n) + (study_hours * 1.5)
previous_marks = np.clip(previous_marks, 30.0, 100.0).round(1)

# Current academic marks strongly tied to attendance, study hours, and prior foundation
current_marks = (0.45 * previous_marks) + (0.35 * attendance) + (1.8 * study_hours) + np.random.normal(0, 6.0, n)
marks = np.clip(current_marks, 20.0, 100.0).round(1)

# Backlogs: high correlation with low marks and low attendance
backlog_risk = (100 - marks) * 0.05 + (100 - attendance) * 0.03 + np.random.exponential(0.5, n)
backlogs = np.where(backlog_risk > 3.8, np.random.randint(2, 6, n),
            np.where(backlog_risk > 2.5, np.random.randint(1, 3, n), 0))
backlogs = np.clip(backlogs, 0, 6)

# Assignments completed: correlates with attendance and study hours
base_assign = (0.6 * attendance) + (4.0 * study_hours) + np.random.normal(0, 8.0, n)
assignments_completed = np.clip(base_assign, 20.0, 100.0).round(1)

# Participation score: 1 to 10
base_part = (attendance / 15.0) + (study_hours / 3.0) + np.random.normal(0, 1.2, n)
participation = np.clip(base_part, 1.0, 10.0).round(1)

# 3. Logistic Dropout Latent Propensity (Multi-Factor Non-Linear Ground Truth)
# Domain coefficients based on educational research
z = -1.15 \
    - 0.055 * (attendance - 75.0) \
    - 0.050 * (marks - 60.0) \
    + 0.550 * backlogs \
    - 0.220 * (study_hours - 3.5) \
    - 0.025 * (assignments_completed - 70.0) \
    - 0.180 * (participation - 5.0) \
    - 0.018 * (previous_marks - 65.0) \
    + 0.040 * (distance_from_home - 10.0) \
    - 1.500 * (np.log(annual_income) - 12.6)

# Interaction effects (e.g. low attendance + high backlogs compound risk)
z += 0.08 * (backlogs * (attendance < 60))
z += 0.05 * ((distance_from_home > 18) * (attendance < 65))
z += 0.04 * ((annual_income < 250000) * (backlogs > 1))

# Convert logit to calibrated true probability via sigmoid
dropout_prob = expit(z)

# Add 3% realistic label noise (unforeseen life events, illness, relocation)
dropout = (np.random.rand(n) < dropout_prob).astype(int)

df = pd.DataFrame({
    "attendance": attendance,
    "marks": marks,
    "study_hours": study_hours,
    "distance_from_home": distance_from_home,
    "annual_income": annual_income,
    "previous_marks": previous_marks,
    "backlogs": backlogs,
    "assignments_completed": assignments_completed,
    "participation": participation,
    "dropout": dropout
})

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CSV_PATH = DATA_DIR / "rf_student_dropout_dataset.csv"

df.to_csv(CSV_PATH, index=False)

print(f"Dataset successfully created at: {CSV_PATH}")
print(f"Total Rows: {len(df)}")
print("Class Distribution:")
print(df["dropout"].value_counts(normalize=True))
print("\nCorrelation with Dropout:")
print(df.corr()["dropout"].sort_values(ascending=False))

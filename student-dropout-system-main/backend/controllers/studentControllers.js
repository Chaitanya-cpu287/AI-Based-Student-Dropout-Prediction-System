const db = require("../db");
const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5000";

function calculateFallbackRisk(s) {
  let score = 0;
  const attendance = Number(s.attendance || 0);
  const marks = Number(s.marks || 0);
  const backlogs = Number(s.backlogs || 0);
  const studyHours = Number(s.study_hours || 0);

  if (attendance < 60) score += 35;
  else if (attendance < 75) score += 15;

  if (marks < 40) score += 35;
  else if (marks < 55) score += 18;

  if (backlogs >= 3) score += 25;
  else if (backlogs > 0) score += 10;

  if (studyHours < 2) score += 10;

  const riskPercent = Math.min(Math.max(score, 5), 98);
  const riskLevel = riskPercent < 40 ? "Low" : riskPercent < 70 ? "Medium" : "High";
  const prediction = riskPercent >= 50 ? 1 : 0;

  return { prediction, risk_percent: riskPercent, risk_level: riskLevel };
}

exports.getStudentProfile = async (req, res) => {
  const { admission_id } = req.params;

  try {
    const result = await db.query(
      `SELECT s.*, m.name AS mentor_name, m.email AS mentor_email
       FROM students s
       LEFT JOIN mentor_students ms ON s.id = ms.student_id
       LEFT JOIN mentors m ON ms.mentor_id = m.id
       WHERE LOWER(s.admission_id) = LOWER($1)`,
      [admission_id.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get Student Profile Error:", err);
    res.status(500).json({ error: "Failed to load student profile" });
  }
};

exports.refreshStudentPrediction = async (req, res) => {
  const { admission_id } = req.params;

  try {
    const result = await db.query(
      "SELECT * FROM students WHERE LOWER(admission_id) = LOWER($1)",
      [admission_id.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const s = result.rows[0];
    const mlData = {
      attendance: Number(s.attendance || 0),
      marks: Number(s.marks || 0),
      study_hours: Number(s.study_hours || 0),
      distance_from_home: Number(s.distance_from_home || 0),
      annual_income: Number(s.annual_income || 0),
      previous_marks: Number(s.previous_marks || 0),
      backlogs: Number(s.backlogs || 0),
      assignments_completed: Number(s.assignments_completed || 0),
      participation: Number(s.participation || 0)
    };

    let prediction;
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/predict`, mlData, { timeout: 3000 });
      prediction = mlResponse.data;
    } catch (mlErr) {
      prediction = calculateFallbackRisk(s);
    }

    res.json({
      student: s,
      prediction: prediction
    });

  } catch (err) {
    console.error("Refresh Prediction Error:", err);
    res.status(500).json({ error: "Failed to refresh prediction" });
  }
};

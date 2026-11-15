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

exports.login = async (req, res) => {
  const { admission_id, date_of_birth } = req.body;

  if (!admission_id || !date_of_birth) {
    return res.status(400).json({ message: "Admission ID and Date of Birth are required" });
  }

  try {
    // Normalize date format YYYY-MM-DD
    const normalizedDob = String(date_of_birth).substring(0, 10);

    const result = await db.query(
      `SELECT * FROM students 
       WHERE LOWER(admission_id) = LOWER($1)
       AND DATE(date_of_birth) = DATE($2)`,
      [admission_id.trim(), normalizedDob]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Admission ID or Date of Birth" });
    }

    const student = result.rows[0];

    // Prepare data for ML model
    const mlData = {
      attendance: Number(student.attendance || 0),
      marks: Number(student.marks || 0),
      study_hours: Number(student.study_hours || 0),
      distance_from_home: Number(student.distance_from_home || 0),
      annual_income: Number(student.annual_income || 0),
      previous_marks: Number(student.previous_marks || 0),
      backlogs: Number(student.backlogs || 0),
      assignments_completed: Number(student.assignments_completed || 0),
      participation: Number(student.participation || 0)
    };

    let predictionResult;
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/predict`, mlData, {
        timeout: 3000,
        headers: { "Content-Type": "application/json" }
      });
      predictionResult = mlResponse.data;
    } catch (mlErr) {
      console.warn("ML API call failed during login, using heuristic estimation:", mlErr.message);
      predictionResult = calculateFallbackRisk(student);
    }

    res.json({
      message: "Login successful",
      student: student,
      prediction: predictionResult
    });

  } catch (err) {
    console.error("Student Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

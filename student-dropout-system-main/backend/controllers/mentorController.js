const db = require("../db");
const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5000";

// Fallback heuristic if ML API service is temporarily offline
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

// Mentor Login
exports.loginMentor = async (req, res) => {
  const { mentor_id, password } = req.body;

  if (!mentor_id || !password) {
    return res.status(400).json({ message: "Mentor ID and password are required" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM mentors WHERE mentor_id = $1 AND password = $2",
      [mentor_id, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid mentor ID or password" });
    }

    const mentor = result.rows[0];
    res.json({
      id: mentor.id,
      mentor_id: mentor.mentor_id,
      name: mentor.name,
      email: mentor.email
    });

  } catch (err) {
    console.error("Mentor Login Error:", err);
    res.status(500).json({ error: "Server error during mentor login" });
  }
};

// Get Mentor's Students + Batched ML Predictions
exports.getMentorStudents = async (req, res) => {
  const mentorId = req.params.id;

  try {
    const result = await db.query(
      `
      SELECT s.*
      FROM mentor_students ms
      JOIN students s ON ms.student_id = s.id
      JOIN mentors m ON ms.mentor_id = m.id
      WHERE m.mentor_id = $1
      ORDER BY s.id
      `,
      [mentorId]
    );

    const students = result.rows;
    if (students.length === 0) {
      return res.json([]);
    }

    // Build batch payload for all students
    const batchPayload = students.map(s => ({
      attendance: Number(s.attendance || 0),
      marks: Number(s.marks || 0),
      study_hours: Number(s.study_hours || 0),
      distance_from_home: Number(s.distance_from_home || 0),
      annual_income: Number(s.annual_income || 0),
      previous_marks: Number(s.previous_marks || 0),
      backlogs: Number(s.backlogs || 0),
      assignments_completed: Number(s.assignments_completed || 0),
      participation: Number(s.participation || 0)
    }));

    let predictions = [];

    try {
      // 1-call batch inference
      const mlRes = await axios.post(`${ML_API_URL}/predict`, batchPayload, {
        timeout: 3500,
        headers: { "Content-Type": "application/json" }
      });

      if (mlRes.data && Array.isArray(mlRes.data.predictions)) {
        predictions = mlRes.data.predictions;
      } else if (mlRes.data && mlRes.data.prediction !== undefined) {
        predictions = [mlRes.data];
      }
    } catch (mlErr) {
      console.warn("ML API unavailable or timed out. Using intelligent heuristic estimation:", mlErr.message);
      predictions = students.map(s => calculateFallbackRisk(s));
    }

    // Combine student data with predictions
    const finalData = students.map((s, index) => {
      const p = predictions[index] || calculateFallbackRisk(s);
      return {
        ...s,
        prediction: p.prediction,
        risk_percent: p.risk_percent,
        risk_level: p.risk_level,
        key_factors: p.key_factors || []
      };
    });

    res.json(finalData);

  } catch (err) {
    console.error("Get Mentor Students Error:", err);
    res.status(500).json({ error: "Failed to load mentor students" });
  }
};

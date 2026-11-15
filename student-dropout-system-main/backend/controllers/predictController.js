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

exports.predict = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: "No prediction data provided" });
    }

    try {
      const response = await axios.post(
        `${ML_API_URL}/predict`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 4000
        }
      );
      return res.json(response.data);
    } catch (mlErr) {
      console.warn("ML API unreachable, falling back to heuristic calculation:", mlErr.message);

      if (Array.isArray(payload)) {
        const predictions = payload.map(calculateFallbackRisk);
        return res.json({ count: predictions.length, predictions });
      } else {
        return res.json(calculateFallbackRisk(payload));
      }
    }
  } catch (err) {
    console.error("Predict Controller Error:", err);
    res.status(500).json({ error: "Prediction processing error" });
  }
};

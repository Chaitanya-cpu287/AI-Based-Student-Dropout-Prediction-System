const db = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

function generateSmartFallbackResponse(student, message, riskPercent, riskLevel) {
  const name = student.name ? student.name.split(' ')[0] : 'Student';
  const attendance = Number(student.attendance || 0);
  const marks = Number(student.marks || 0);
  const backlogs = Number(student.backlogs || 0);
  const studyHours = Number(student.study_hours || 0);
  const risk = Number(riskPercent || 0);

  let advice = [];

  if (riskLevel === 'High' || risk > 70) {
    advice.push(`🚨 Your current dropout risk is assessed at ${risk.toFixed(1)}% (${riskLevel}). We need an immediate action plan.`);
    if (backlogs > 0) {
      advice.push(`You currently have ${backlogs} active backlogs. Focus on clearing the prerequisite subjects first.`);
    }
    if (attendance < 75) {
      advice.push(`Your attendance is ${attendance.toFixed(1)}%, which is below the mandatory 75% threshold. Regular attendance is critical to exam eligibility.`);
    }
    advice.push(`I recommend meeting with your mentor this week and dedicating at least 2 extra hours daily to guided self-study.`);
  } else if (riskLevel === 'Medium' || risk >= 40) {
    advice.push(`⚠️ Your risk level is ${risk.toFixed(1)}% (Medium). You are making progress, but consistency is key.`);
    if (backlogs > 0) {
      advice.push(`Prioritize your ${backlogs} backlog(s) before the upcoming midterm cycle.`);
    }
    if (studyHours < 3) {
      advice.push(`Increasing your daily study time from ${studyHours}h to 3.5h will significantly improve your marks.`);
    }
    advice.push(`Review weekly lecture summaries and make use of campus tutoring resources.`);
  } else {
    advice.push(`✅ Great job, ${name}! Your risk level is ${risk.toFixed(1)}% (Low/Optimal).`);
    advice.push(`With ${attendance.toFixed(1)}% attendance, ${marks} average marks, and ${backlogs} backlogs, your academic profile is strong.`);
    advice.push(`To keep growing, consider peer tutoring, joining technical projects, or applying for summer research internships.`);
  }

  // Answer query context
  const lowerMsg = (message || '').toLowerCase();
  let contextualNote = '';

  if (lowerMsg.includes('attendance') || lowerMsg.includes('absent')) {
    contextualNote = ` Regarding attendance: your current standing is ${attendance.toFixed(1)}%. Aim for 85%+ to ensure full internal marks.`;
  } else if (lowerMsg.includes('backlog') || lowerMsg.includes('exam') || lowerMsg.includes('fail')) {
    contextualNote = ` Regarding exams and backlogs: schedule dedicated weekend revision blocks and practice previous 3 years' question papers.`;
  } else if (lowerMsg.includes('study') || lowerMsg.includes('time') || lowerMsg.includes('hour')) {
    contextualNote = ` Regarding study time: you're currently logging ~${studyHours} hours/day. The Pomodoro technique (25 min study, 5 min break) can help maximize focus.`;
  } else if (lowerMsg.includes('stress') || lowerMsg.includes('tired') || lowerMsg.includes('help')) {
    contextualNote = ` Remember that academic balance includes proper rest, regular breaks, and talking to your assigned mentor.`;
  }

  return `Hello ${name}! I am your AI Academic Counselor.\n\n` +
         advice.join('\n\n') +
         (contextualNote ? `\n\n💡${contextualNote}` : '') +
         `\n\nHow else can I assist you with your academic goals today?`;
}

exports.getChatResponse = async (req, res) => {
  const { admission_id, message, risk_percent, risk_level } = req.body;

  if (!admission_id || !message) {
    return res.status(400).json({ message: "Missing required fields: admission_id and message are required" });
  }

  try {
    // 1. Fetch student metrics
    const result = await db.query(
      "SELECT * FROM students WHERE admission_id = $1",
      [admission_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const s = result.rows[0];
    const riskVal = Number(risk_percent !== undefined ? risk_percent : 20.0);
    const riskCat = risk_level || (riskVal < 40 ? "Low" : riskVal < 70 ? "Medium" : "High");

    // 2. Check if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      // Use high-quality intelligent counselor response
      const fallbackReply = generateSmartFallbackResponse(s, message, riskVal, riskCat);
      return res.json({ reply: fallbackReply, source: "ai-counselor-heuristic" });
    }

    // 3. Use Gemini API with valid model name
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemPrompt = `
You are a professional Academic Success Counselor at a university.
Your goal is to guide and motivate ${s.name} to succeed academically and graduate on time.

STUDENT PROFILE & RISK METRICS:
- Student Name: ${s.name}
- AI-Calculated Dropout Risk: ${riskVal.toFixed(1)}% (${riskCat} Risk)
- Current Attendance: ${Number(s.attendance).toFixed(1)}%
- Academic Marks: ${s.marks}/100
- Active Backlogs: ${s.backlogs}
- Daily Study Hours: ${s.study_hours} hrs/day
- Assignment Completion: ${s.assignments_completed}%
- Campus Participation: ${s.participation}/10

GUIDELINES:
1. Address ${s.name} directly with empathy and actionable advice.
2. If risk is High (${riskVal}% > 70%), emphasize immediate steps: office hours, tutoring, backlog clearing.
3. If attendance is under 75%, warn gently about university exam eligibility rules.
4. Keep advice practical, concise, and encouraging. Avoid markdown formatting clutter.
`;

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: `Understood. I have reviewed ${s.name}'s profile and risk metrics. I am ready to advise them.` }] },
        ],
      });

      const resultAI = await chat.sendMessage(message);
      const responseText = resultAI.response.text();
      return res.json({ reply: responseText, source: "gemini" });

    } catch (geminiError) {
      console.warn("Gemini API call failed (falling back to intelligent counseling):", geminiError.message);
      const fallbackReply = generateSmartFallbackResponse(s, message, riskVal, riskCat);
      return res.json({ reply: fallbackReply, source: "ai-counselor-heuristic" });
    }

  } catch (err) {
    console.error("Chat Controller Error:", err);
    res.status(500).json({ error: "Academic Counselor service error" });
  }
};

require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

// Routes
const authRoutes = require("./routes/auth");              // Student Auth
const mentorRoutes = require("./routes/mentorRoutes");    // Mentor Portal
const adminRoutes = require("./routes/adminRoutes");      // Admin Portal
const studentRoutes = require("./routes/student");        // Student Self-Service
const predictRoutes = require("./routes/predict");        // ML Predict API
const chatController = require("./controllers/chatController");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend (Single-Port Hosting Support)
const FRONTEND_DIR = path.join(__dirname, "../frontend");
app.use(express.static(FRONTEND_DIR));

// Landing Page
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "Student Dropout Prediction Backend",
    database: db.getMode(),
    timestamp: new Date().toISOString()
  });
});

// AI Chatbot Route
app.post("/api/chat", chatController.getChatResponse);

// DB Diagnostics
app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM students LIMIT 5");
    res.json({
      database_mode: db.getMode(),
      students_count: result.rows.length,
      sample: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// API Routes
app.use("/api", authRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api", predictRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "API Route Not Found", path: req.path });
});

// Server Start
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
  ======================================================
  🎓 EDUGUARD - STUDENT DROPOUT PREDICTION SYSTEM
  ======================================================
  🚀 Backend Server running at: http://localhost:${PORT}
  📡 Mode: ${db.getMode().toUpperCase()}
  🔗 Health Check: http://localhost:${PORT}/health
  🔗 Database Test: http://localhost:${PORT}/test-db
  ======================================================
  `);
  });
}

module.exports = app;

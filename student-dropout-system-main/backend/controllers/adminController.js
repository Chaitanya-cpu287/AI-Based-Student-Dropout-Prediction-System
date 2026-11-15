const db = require("../db");

exports.loginAdmin = async (req, res) => {
  try {
    const { admin_id, password } = req.body;

    if (!admin_id || !password) {
      return res.status(400).json({ message: "Admin ID and password are required" });
    }

    const result = await db.query(
      "SELECT * FROM admins WHERE admin_id = $1 AND password = $2",
      [admin_id.trim(), password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const admin = result.rows[0];
    res.json({
      id: admin.id,
      admin_id: admin.admin_id,
      name: admin.name
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ error: "Server error during admin login" });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const {
      admission_id,
      name,
      email,
      date_of_birth,
      attendance,
      marks,
      study_hours,
      distance_from_home,
      annual_income,
      previous_marks,
      backlogs,
      assignments_completed,
      participation
    } = req.body;

    if (!admission_id || !name || !date_of_birth) {
      return res.status(400).json({ message: "Admission ID, Name, and Date of Birth are required" });
    }

    const result = await db.query(
      `INSERT INTO students 
      (admission_id, name, email, date_of_birth, attendance, marks, study_hours,
       distance_from_home, annual_income, previous_marks, backlogs,
       assignments_completed, participation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id`,
      [
        admission_id.trim(),
        name.trim(),
        email ? email.trim() : null,
        date_of_birth,
        Number(attendance || 75.0),
        Number(marks || 60.0),
        Number(study_hours || 3.0),
        Number(distance_from_home || 10.0),
        Number(annual_income || 300000.0),
        Number(previous_marks || 60.0),
        parseInt(backlogs || 0, 10),
        Number(assignments_completed || 70.0),
        Number(participation || 5.0)
      ]
    );

    res.json({
      message: "Student added successfully",
      student_id: result.rows[0].id
    });

  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ error: "Error adding student to database" });
  }
};

exports.assignMentor = async (req, res) => {
  try {
    const { student_id, mentor_id } = req.body;

    if (!student_id || !mentor_id) {
      return res.status(400).json({ message: "Both student_id and mentor_id are required" });
    }

    await db.query(
      `INSERT INTO mentor_students (mentor_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id)
       DO UPDATE SET mentor_id = EXCLUDED.mentor_id`,
      [parseInt(mentor_id, 10), parseInt(student_id, 10)]
    );

    res.json({ message: "Mentor assigned successfully" });

  } catch (err) {
    console.error("Assign Mentor Error:", err);
    res.status(500).json({ error: "Failed to assign mentor" });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id,
        s.admission_id,
        s.name,
        s.email,
        m.name AS mentor_name,
        m.mentor_id,
        m.id AS mentor_numeric_id
      FROM students s
      LEFT JOIN mentor_students ms ON s.id = ms.student_id
      LEFT JOIN mentors m ON ms.mentor_id = m.id
      ORDER BY s.id
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Get All Students Error:", err);
    res.status(500).json({ error: "Failed to fetch student directory" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await db.query("DELETE FROM mentor_students WHERE student_id=$1", [id]);
    await db.query("DELETE FROM students WHERE id=$1", [id]);

    res.json({ message: "Student removed successfully" });

  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ error: "Failed to delete student" });
  }
};

exports.getMentors = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, mentor_id, name, email FROM mentors ORDER BY id"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Get Mentors Error:", err);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

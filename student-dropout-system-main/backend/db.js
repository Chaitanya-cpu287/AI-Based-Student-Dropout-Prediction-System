const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Determine environment configuration
const pgConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'student_dropout_db',
  connectionTimeoutMillis: 2000
};

let activeMode = 'postgres'; // 'postgres' or 'fallback'
let pgPool = null;

// Embedded Persistent Store (used when PostgreSQL is not running)
const LOCAL_DATA_FILE = path.join(__dirname, 'data', 'local_db.json');

const INITIAL_DATA = {
  admins: [
    { id: 1, admin_id: 'admin', name: 'System Administrator', password: 'admin123', created_at: new Date().toISOString() },
    { id: 2, admin_id: 'admin2', name: 'Academic Dean', password: 'admin123', created_at: new Date().toISOString() }
  ],
  mentors: [
    { id: 1, mentor_id: 'MNT101', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@university.edu', password: 'mentor123', created_at: new Date().toISOString() },
    { id: 2, mentor_id: 'MNT102', name: 'Prof. Rajesh Sharma', email: 'rajesh.sharma@university.edu', password: 'mentor123', created_at: new Date().toISOString() },
    { id: 3, mentor_id: 'MNT103', name: 'Dr. Elena Rostova', email: 'elena.rostova@university.edu', password: 'mentor123', created_at: new Date().toISOString() }
  ],
  students: [
    { id: 1, admission_id: 'ADM101', name: 'Aarav Patel', email: 'aarav.patel@student.edu', date_of_birth: '2004-05-15', attendance: 92.5, marks: 88.0, study_hours: 5.5, distance_from_home: 4.0, annual_income: 650000.0, previous_marks: 85.0, backlogs: 0, assignments_completed: 95.0, participation: 8.5 },
    { id: 2, admission_id: 'ADM102', name: 'Diya Sharma', email: 'diya.sharma@student.edu', date_of_birth: '2003-11-20', attendance: 68.0, marks: 58.0, study_hours: 2.5, distance_from_home: 12.0, annual_income: 320000.0, previous_marks: 62.0, backlogs: 1, assignments_completed: 65.0, participation: 5.0 },
    { id: 3, admission_id: 'ADM103', name: 'Rohan Kumar', email: 'rohan.kumar@student.edu', date_of_birth: '2004-02-10', attendance: 42.0, marks: 35.0, study_hours: 1.0, distance_from_home: 18.0, annual_income: 180000.0, previous_marks: 40.0, backlogs: 4, assignments_completed: 38.0, participation: 2.0 },
    { id: 4, admission_id: 'ADM104', name: 'Ananya Verma', email: 'ananya.verma@student.edu', date_of_birth: '2003-08-25', attendance: 88.0, marks: 82.0, study_hours: 4.0, distance_from_home: 6.0, annual_income: 540000.0, previous_marks: 80.0, backlogs: 0, assignments_completed: 90.0, participation: 7.5 },
    { id: 5, admission_id: 'ADM105', name: 'Vikram Singh', email: 'vikram.singh@student.edu', date_of_birth: '2004-09-12', attendance: 64.0, marks: 52.0, study_hours: 2.0, distance_from_home: 15.0, annual_income: 280000.0, previous_marks: 55.0, backlogs: 2, assignments_completed: 58.0, participation: 4.0 },
    { id: 6, admission_id: 'ADM106', name: 'Sneha Reddy', email: 'sneha.reddy@student.edu', date_of_birth: '2004-01-30', attendance: 95.0, marks: 91.0, study_hours: 6.0, distance_from_home: 3.0, annual_income: 780000.0, previous_marks: 92.0, backlogs: 0, assignments_completed: 98.0, participation: 9.0 },
    { id: 7, admission_id: 'ADM107', name: 'Karan Mehta', email: 'karan.mehta@student.edu', date_of_birth: '2003-12-05', attendance: 38.0, marks: 32.0, study_hours: 1.0, distance_from_home: 22.0, annual_income: 150000.0, previous_marks: 36.0, backlogs: 5, assignments_completed: 30.0, participation: 1.5 },
    { id: 8, admission_id: 'ADM108', name: 'Pooja Nair', email: 'pooja.nair@student.edu', date_of_birth: '2004-07-18', attendance: 84.0, marks: 78.0, study_hours: 3.5, distance_from_home: 8.0, annual_income: 460000.0, previous_marks: 75.0, backlogs: 0, assignments_completed: 85.0, participation: 7.0 }
  ],
  mentor_students: [
    { id: 1, mentor_id: 1, student_id: 1 },
    { id: 2, mentor_id: 1, student_id: 2 },
    { id: 3, mentor_id: 1, student_id: 3 },
    { id: 4, mentor_id: 1, student_id: 4 },
    { id: 5, mentor_id: 2, student_id: 5 },
    { id: 6, mentor_id: 2, student_id: 6 },
    { id: 7, mentor_id: 2, student_id: 7 },
    { id: 8, mentor_id: 2, student_id: 8 }
  ]
};

function loadLocalStore() {
  try {
    if (!fs.existsSync(path.dirname(LOCAL_DATA_FILE))) {
      fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
    }
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const content = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[DB] Failed reading local_db.json, re-initializing:', e.message);
  }
  saveLocalStore(INITIAL_DATA);
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveLocalStore(data) {
  try {
    if (!fs.existsSync(path.dirname(LOCAL_DATA_FILE))) {
      fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Failed saving local_db.json:', e.message);
  }
}

// Emulate PostgreSQL queries on the local store
function executeLocalQuery(text, params = []) {
  const store = loadLocalStore();
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // 1. SELECT FROM admins WHERE admin_id=$1 AND password=$2
  if (upper.includes('FROM ADMINS') && upper.includes('ADMIN_ID')) {
    const adminId = params[0];
    const password = params[1];
    const match = store.admins.filter(a => a.admin_id === adminId && a.password === password);
    return { rows: match, rowCount: match.length };
  }

  // 1b. Generic SELECT FROM admins
  if (upper.includes('FROM ADMINS') && !upper.includes('WHERE')) {
    return { rows: store.admins, rowCount: store.admins.length };
  }

  // 2. SELECT FROM mentors WHERE mentor_id = $1 AND password = $2
  if (upper.includes('FROM MENTORS') && upper.includes('MENTOR_ID = $1') && upper.includes('PASSWORD = $2')) {
    const mentorId = params[0];
    const password = params[1];
    const match = store.mentors.filter(m => m.mentor_id === mentorId && m.password === password);
    return { rows: match, rowCount: match.length };
  }

  // 3. SELECT id, mentor_id, name FROM mentors
  if (upper.includes('FROM MENTORS') && !upper.includes('JOIN') && !upper.includes('PASSWORD')) {
    const rows = store.mentors.map(m => ({ id: m.id, mentor_id: m.mentor_id, name: m.name, email: m.email }));
    return { rows, rowCount: rows.length };
  }

  // 4. Student login query:
  // SELECT * FROM students WHERE LOWER(admission_id) = LOWER($1) AND DATE(date_of_birth) = DATE($2)
  if (upper.includes('FROM STUDENTS') && upper.includes('ADMISSION_ID') && upper.includes('DATE_OF_BIRTH')) {
    const admissionId = String(params[0] || '').toLowerCase().trim();
    // Normalize date format YYYY-MM-DD
    const dobInput = String(params[1] || '').substring(0, 10);
    const match = store.students.filter(s => {
      const sAdm = String(s.admission_id).toLowerCase().trim();
      const sDob = String(s.date_of_birth).substring(0, 10);
      return sAdm === admissionId && sDob === dobInput;
    });
    return { rows: match, rowCount: match.length };
  }

  // 5. SELECT * FROM students WHERE admission_id = $1 (Chat lookup)
  if (upper.includes('FROM STUDENTS') && upper.includes('WHERE ADMISSION_ID = $1')) {
    const admId = String(params[0] || '').toLowerCase().trim();
    const match = store.students.filter(s => String(s.admission_id).toLowerCase().trim() === admId);
    return { rows: match, rowCount: match.length };
  }

  // 6. Mentor Students Join:
  // SELECT s.* FROM mentor_students ms JOIN students s ... WHERE m.mentor_id = $1
  if (upper.includes('MENTOR_STUDENTS') && upper.includes('WHERE M.MENTOR_ID = $1')) {
    const mentorCode = String(params[0] || '');
    const mentor = store.mentors.find(m => m.mentor_id === mentorCode);
    if (!mentor) return { rows: [], rowCount: 0 };

    const assignedIds = store.mentor_students
      .filter(ms => ms.mentor_id === mentor.id)
      .map(ms => ms.student_id);

    const rows = store.students.filter(s => assignedIds.includes(s.id));
    return { rows, rowCount: rows.length };
  }

  // 7. Admin All Students List:
  // SELECT s.id, s.admission_id, s.name, s.email, m.name AS mentor_name, m.mentor_id ...
  if (upper.includes('FROM STUDENTS S') && upper.includes('LEFT JOIN MENTOR_STUDENTS')) {
    const rows = store.students.map(s => {
      const link = store.mentor_students.find(ms => ms.student_id === s.id);
      const mentor = link ? store.mentors.find(m => m.id === link.mentor_id) : null;
      return {
        id: s.id,
        admission_id: s.admission_id,
        name: s.name,
        email: s.email,
        mentor_name: mentor ? mentor.name : null,
        mentor_id: mentor ? mentor.mentor_id : null,
        mentor_numeric_id: mentor ? mentor.id : null
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 8. INSERT INTO students ... RETURNING id
  if (upper.startsWith('INSERT INTO STUDENTS')) {
    const newId = store.students.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
    const newStudent = {
      id: newId,
      admission_id: params[0],
      name: params[1],
      email: params[2],
      date_of_birth: String(params[3]).substring(0, 10),
      attendance: Number(params[4]),
      marks: Number(params[5]),
      study_hours: Number(params[6]),
      distance_from_home: Number(params[7]),
      annual_income: Number(params[8]),
      previous_marks: Number(params[9]),
      backlogs: Number(params[10]),
      assignments_completed: Number(params[11]),
      participation: Number(params[12]),
      created_at: new Date().toISOString()
    };
    store.students.push(newStudent);
    saveLocalStore(store);
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // 9. Assign Mentor:
  // INSERT INTO mentor_students (mentor_id, student_id) ... ON CONFLICT
  if (upper.includes('INTO MENTOR_STUDENTS')) {
    const mentorId = parseInt(params[0], 10);
    const studentId = parseInt(params[1], 10);

    const existingIdx = store.mentor_students.findIndex(ms => ms.student_id === studentId);
    if (existingIdx >= 0) {
      store.mentor_students[existingIdx].mentor_id = mentorId;
    } else {
      const newId = store.mentor_students.reduce((max, ms) => Math.max(max, ms.id || 0), 0) + 1;
      store.mentor_students.push({ id: newId, mentor_id: mentorId, student_id: studentId });
    }
    saveLocalStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 10. DELETE FROM mentor_students WHERE student_id=$1
  if (upper.startsWith('DELETE FROM MENTOR_STUDENTS WHERE STUDENT_ID')) {
    const studentId = parseInt(params[0], 10);
    store.mentor_students = store.mentor_students.filter(ms => ms.student_id !== studentId);
    saveLocalStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 11. DELETE FROM students WHERE id=$1
  if (upper.startsWith('DELETE FROM STUDENTS WHERE ID')) {
    const studentId = parseInt(params[0], 10);
    store.students = store.students.filter(s => s.id !== studentId);
    saveLocalStore(store);
    return { rows: [], rowCount: 1 };
  }

  // 12. Generic SELECT FROM students (e.g. test-db)
  if (upper.includes('FROM STUDENTS')) {
    return { rows: store.students.slice(0, 10), rowCount: store.students.length };
  }

  return { rows: [], rowCount: 0 };
}

// Attempt PostgreSQL initialization
try {
  pgPool = new Pool(pgConfig);

  // Test connection asynchronously
  pgPool.query('SELECT 1', (err) => {
    if (err) {
      activeMode = 'fallback';
      console.log(`[DB] ℹ️ PostgreSQL offline at ${pgConfig.host}:${pgConfig.port} (${err.code || err.message}).`);
      console.log(`[DB] ✅ Seamlessly switched to persistent local database storage.`);
      loadLocalStore();
    } else {
      activeMode = 'postgres';
      console.log(`[DB] ✅ Connected to PostgreSQL database: ${pgConfig.database} on ${pgConfig.host}:${pgConfig.port}`);
      // Auto-initialize schema in postgres
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      pgPool.query(schemaSql).catch(schemaErr => console.warn('[DB] Schema check warning:', schemaErr.message));
    }
  });
} catch (e) {
  activeMode = 'fallback';
  console.log(`[DB] Using persistent local database storage.`);
}

/**
 * Universal query runner with automatic error recovery
 */
async function query(text, params = []) {
  if (activeMode === 'postgres' && pgPool) {
    try {
      return await pgPool.query(text, params);
    } catch (err) {
      // If Postgres connection fails or is refused, immediately fall back
      console.warn(`[DB] PostgreSQL connection issue (${err.code || err.name || 'unreachable'}). Seamlessly using persistent local storage.`);
      activeMode = 'fallback';
      return executeLocalQuery(text, params);
    }
  } else {
    return executeLocalQuery(text, params);
  }
}

module.exports = {
  query,
  getMode: () => activeMode
};

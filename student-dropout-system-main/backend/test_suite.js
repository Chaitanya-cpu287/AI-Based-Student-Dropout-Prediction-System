/**
 * Comprehensive Multi-Phase End-to-End Test Suite
 * Tests DB, Auth, Admin, Mentor, Student, ML Prediction, and AI Counselor
 */

const db = require('./db');
const auth = require('./controllers/authControllers');
const admin = require('./controllers/adminController');
const mentor = require('./controllers/mentorController');
const chat = require('./controllers/chatController');
const predict = require('./controllers/predictController');
const axios = require('axios');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 EDUGUARD COMPREHENSIVE END-TO-END TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Phase 1: Database Connectivity & Core Reads
  // -------------------------------------------------------------
  console.log('[PHASE 1] Database Engine & Pre-Seeded Records');
  const students = await db.query('SELECT * FROM students');
  assert(students.rows.length >= 8, 'Students table has pre-seeded records', `Count: ${students.rows.length}`);

  const mentors = await db.query('SELECT * FROM mentors');
  assert(mentors.rows.length >= 3, 'Mentors table has pre-seeded records', `Count: ${mentors.rows.length}`);

  const admins = await db.query('SELECT * FROM admins');
  assert(admins.rows.length >= 2, 'Admins table has pre-seeded records', `Count: ${admins.rows.length}`);

  // -------------------------------------------------------------
  // Test Phase 2: Authentication Flows
  // -------------------------------------------------------------
  console.log('\n[PHASE 2] Authentication Flows');

  // Student Login (Positive)
  let studentLoginRes = null;
  await auth.login(
    { body: { admission_id: 'ADM101', date_of_birth: '2004-05-15' } },
    {
      json: d => { studentLoginRes = d; },
      status: s => ({ json: err => { studentLoginRes = { status: s, ...err }; } })
    }
  );
  assert(studentLoginRes && studentLoginRes.student && studentLoginRes.student.name === 'Aarav Patel', 'Student Login (Valid Credentials)');
  assert(studentLoginRes && studentLoginRes.prediction && studentLoginRes.prediction.risk_level !== undefined, 'Student Login includes instant ML Risk Assessment');

  // Student Login (Negative)
  let studentInvalidRes = null;
  await auth.login(
    { body: { admission_id: 'ADM101', date_of_birth: '1999-01-01' } },
    {
      json: d => { studentInvalidRes = d; },
      status: s => ({ json: err => { studentInvalidRes = { status: s, ...err }; } })
    }
  );
  assert(studentInvalidRes && studentInvalidRes.status === 401, 'Student Login (Invalid DOB rejected with 401)');

  // Mentor Login (Positive)
  let mentorLoginRes = null;
  await mentor.loginMentor(
    { body: { mentor_id: 'MNT101', password: 'mentor123' } },
    {
      json: d => { mentorLoginRes = d; },
      status: s => ({ json: err => { mentorLoginRes = { status: s, ...err }; } })
    }
  );
  assert(mentorLoginRes && mentorLoginRes.mentor_id === 'MNT101', 'Mentor Login (Valid Credentials)');

  // Admin Login (Positive)
  let adminLoginRes = null;
  await admin.loginAdmin(
    { body: { admin_id: 'admin', password: 'admin123' } },
    {
      json: d => { adminLoginRes = d; },
      status: s => ({ json: err => { adminLoginRes = { status: s, ...err }; } })
    }
  );
  assert(adminLoginRes && adminLoginRes.admin_id === 'admin', 'Admin Login (Valid Credentials)');

  // -------------------------------------------------------------
  // Test Phase 3: Admin Management Operations
  // -------------------------------------------------------------
  console.log('\n[PHASE 3] Admin Management Operations (CRUD & Mentor Assignment)');

  // Add Student
  let newStudentId = null;
  await admin.addStudent(
    {
      body: {
        admission_id: 'TEST_ADM999',
        name: 'Unit Test Student',
        email: 'test@student.edu',
        date_of_birth: '2004-06-01',
        attendance: 80,
        marks: 75,
        study_hours: 3.5,
        distance_from_home: 8,
        annual_income: 400000,
        previous_marks: 70,
        backlogs: 0,
        assignments_completed: 85,
        participation: 7
      }
    },
    {
      json: d => { newStudentId = d.student_id; },
      status: s => ({ json: err => console.error('Add student failed:', err) })
    }
  );
  assert(newStudentId !== null, 'Admin add student record', `Generated ID: ${newStudentId}`);

  // Assign Mentor to New Student
  let assignRes = null;
  await admin.assignMentor(
    { body: { student_id: newStudentId, mentor_id: 1 } },
    {
      json: d => { assignRes = d; },
      status: s => ({ json: err => console.error('Assign mentor failed:', err) })
    }
  );
  assert(assignRes && assignRes.message.includes('successfully'), 'Admin assign mentor to student');

  // Verify Assignment in Directory
  let allStudents = [];
  await admin.getAllStudents({}, { json: d => { allStudents = d; }, status: () => ({ json: () => {} }) });
  const addedMatch = allStudents.find(s => s.id === newStudentId);
  assert(addedMatch && addedMatch.mentor_numeric_id === 1, 'Directory reflects assigned mentor correctly');

  // Delete New Student
  let deleteRes = null;
  await admin.deleteStudent(
    { params: { id: newStudentId } },
    {
      json: d => { deleteRes = d; },
      status: s => ({ json: err => console.error('Delete student failed:', err) })
    }
  );
  assert(deleteRes && deleteRes.message.includes('successfully'), 'Admin delete student record');

  // -------------------------------------------------------------
  // Test Phase 4: Mentor Portal & Batch Prediction
  // -------------------------------------------------------------
  console.log('\n[PHASE 4] Mentor Operations & Batch Inference');
  let menteesList = [];
  await mentor.getMentorStudents(
    { params: { id: 'MNT101' } },
    {
      json: d => { menteesList = d; },
      status: s => ({ json: err => console.error('Get mentees failed:', err) })
    }
  );
  assert(Array.isArray(menteesList) && menteesList.length >= 4, 'Mentor mentees retrieval with ML assessment', `Mentees: ${menteesList.length}`);
  const hasRiskProperties = menteesList.every(m => m.risk_percent !== undefined && m.risk_level !== undefined);
  assert(hasRiskProperties, 'All mentees possess calibrated risk probability and tier categorization');

  // -------------------------------------------------------------
  // Test Phase 5: AI Academic Counselor
  // -------------------------------------------------------------
  console.log('\n[PHASE 5] AI Counselor & Intelligent Heuristic Advice');
  let chatRes = null;
  await chat.getChatResponse(
    {
      body: {
        admission_id: 'ADM103', // High risk student
        message: 'I have 4 backlogs and my attendance is low. What should I do?',
        risk_percent: 85.0,
        risk_level: 'High'
      }
    },
    {
      json: d => { chatRes = d; },
      status: s => ({ json: err => console.error('Chat error:', err) })
    }
  );
  assert(chatRes && chatRes.reply && chatRes.reply.length > 50, 'AI Counselor returns structured counseling response', `Reply length: ${chatRes?.reply?.length}`);
  assert(chatRes && (chatRes.reply.includes('backlogs') || chatRes.reply.includes('attendance')), 'AI Counselor personalizes guidance based on student metrics');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL SYSTEM MODULES ARE 100% OPERATIONAL & READY FOR HOSTING!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Inspect the logs above.');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

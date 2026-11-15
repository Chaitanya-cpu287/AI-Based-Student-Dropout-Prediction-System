-- Seed Data for Student Dropout Prediction System

-- Default Admins
INSERT INTO admins (admin_id, name, password) VALUES
('admin', 'System Administrator', 'admin123'),
('admin2', 'Academic Dean', 'admin123')
ON CONFLICT (admin_id) DO NOTHING;

-- Default Mentors
INSERT INTO mentors (mentor_id, name, email, password) VALUES
('MNT101', 'Dr. Sarah Jenkins', 'sarah.jenkins@university.edu', 'mentor123'),
('MNT102', 'Prof. Rajesh Sharma', 'rajesh.sharma@university.edu', 'mentor123'),
('MNT103', 'Dr. Elena Rostova', 'elena.rostova@university.edu', 'mentor123')
ON CONFLICT (mentor_id) DO NOTHING;

-- Default Students
INSERT INTO students (admission_id, name, email, date_of_birth, attendance, marks, study_hours, distance_from_home, annual_income, previous_marks, backlogs, assignments_completed, participation) VALUES
('ADM101', 'Aarav Patel', 'aarav.patel@student.edu', '2004-05-15', 92.5, 88.0, 5.5, 4.0, 650000.0, 85.0, 0, 95.0, 8.5),
('ADM102', 'Diya Sharma', 'diya.sharma@student.edu', '2003-11-20', 68.0, 58.0, 2.5, 12.0, 320000.0, 62.0, 1, 65.0, 5.0),
('ADM103', 'Rohan Kumar', 'rohan.kumar@student.edu', '2004-02-10', 42.0, 35.0, 1.0, 18.0, 180000.0, 40.0, 4, 38.0, 2.0),
('ADM104', 'Ananya Verma', 'ananya.verma@student.edu', '2003-08-25', 88.0, 82.0, 4.0, 6.0, 540000.0, 80.0, 0, 90.0, 7.5),
('ADM105', 'Vikram Singh', 'vikram.singh@student.edu', '2004-09-12', 64.0, 52.0, 2.0, 15.0, 280000.0, 55.0, 2, 58.0, 4.0),
('ADM106', 'Sneha Reddy', 'sneha.reddy@student.edu', '2004-01-30', 95.0, 91.0, 6.0, 3.0, 780000.0, 92.0, 0, 98.0, 9.0),
('ADM107', 'Karan Mehta', 'karan.mehta@student.edu', '2003-12-05', 38.0, 32.0, 1.0, 22.0, 150000.0, 36.0, 5, 30.0, 1.5),
('ADM108', 'Pooja Nair', 'pooja.nair@student.edu', '2004-07-18', 84.0, 78.0, 3.5, 8.0, 460000.0, 75.0, 0, 85.0, 7.0)
ON CONFLICT (admission_id) DO NOTHING;

-- Assign students to mentors
INSERT INTO mentor_students (mentor_id, student_id)
SELECT m.id, s.id
FROM mentors m, students s
WHERE m.mentor_id = 'MNT101' AND s.admission_id IN ('ADM101', 'ADM102', 'ADM103', 'ADM104')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO mentor_students (mentor_id, student_id)
SELECT m.id, s.id
FROM mentors m, students s
WHERE m.mentor_id = 'MNT102' AND s.admission_id IN ('ADM105', 'ADM106', 'ADM107', 'ADM108')
ON CONFLICT (student_id) DO NOTHING;

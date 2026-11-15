-- Student Dropout Prediction System
-- Database Schema for PostgreSQL

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentors (
    id SERIAL PRIMARY KEY,
    mentor_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    admission_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    date_of_birth DATE NOT NULL,
    attendance NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    marks NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    study_hours NUMERIC(4, 2) NOT NULL DEFAULT 3.0,
    distance_from_home NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    annual_income NUMERIC(12, 2) NOT NULL DEFAULT 300000.0,
    previous_marks NUMERIC(5, 2) NOT NULL DEFAULT 60.0,
    backlogs INT NOT NULL DEFAULT 0,
    assignments_completed NUMERIC(5, 2) NOT NULL DEFAULT 70.0,
    participation NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentor_students (
    id SERIAL PRIMARY KEY,
    mentor_id INT REFERENCES mentors(id) ON DELETE CASCADE,
    student_id INT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(LOWER(admission_id));
CREATE INDEX IF NOT EXISTS idx_mentors_id ON mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_students_mentor ON mentor_students(mentor_id);

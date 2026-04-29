-- ============================================================
-- EduTrack - Attendance & Performance Tracker
-- Database Schema (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS edutrack;
USE edutrack;

-- ---- Users Table (Admin, Teachers, Students login) ----
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,   -- bcrypt hashed
  role        ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---- Students Table ----
CREATE TABLE students (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,                          -- nullable; links to users table if student has login
  name        VARCHAR(100) NOT NULL,
  roll_number VARCHAR(20)  NOT NULL UNIQUE,
  class       VARCHAR(20)  NOT NULL,         -- e.g. "10-A", "10-B"
  email       VARCHAR(150),
  phone       VARCHAR(15),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---- Attendance Table ----
CREATE TABLE attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  subject     VARCHAR(100) NOT NULL,
  date        DATE NOT NULL,
  status      ENUM('present','absent','late') NOT NULL,
  marked_by   INT,                           -- teacher user_id
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_att (student_id, subject, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ---- Marks/Performance Table ----
CREATE TABLE marks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  subject     VARCHAR(100) NOT NULL,
  exam_type   VARCHAR(50)  NOT NULL,         -- 'Midterm', 'Final', 'Unit Test 1', etc.
  marks       DECIMAL(6,2) NOT NULL,
  max_marks   DECIMAL(6,2) NOT NULL DEFAULT 100,
  grade       VARCHAR(5),                    -- A+, A, B, C, D, F
  added_by    INT,                           -- teacher user_id
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by)   REFERENCES users(id)    ON DELETE SET NULL
);

-- ============================================================
-- Sample Data
-- ============================================================

-- Users (passwords are bcrypt of the plain-text shown in comments)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User',   'admin@school.com',   '$2b$10$YourHashedPasswordHere1', 'admin'),
  ('Mrs. Sharma',  'teacher@school.com', '$2b$10$YourHashedPasswordHere2', 'teacher'),
  ('Arjun Patel',  'arjun@school.com',   '$2b$10$YourHashedPasswordHere3', 'student');

-- Students
INSERT INTO students (user_id, name, roll_number, class, email, phone) VALUES
  (3,    'Arjun Patel',   'CS101', '10-A', 'arjun@school.com',   '9876543210'),
  (NULL, 'Sneha Reddy',   'CS102', '10-A', 'sneha@school.com',   '9876543211'),
  (NULL, 'Rohan Mehta',   'CS103', '10-A', 'rohan@school.com',   '9876543212'),
  (NULL, 'Priya Singh',   'CS104', '10-B', 'priya@school.com',   '9876543213'),
  (NULL, 'Karthik Nair',  'CS105', '10-B', 'karthik@school.com', '9876543214'),
  (NULL, 'Divya Rao',     'CS106', '10-B', 'divya@school.com',   '9876543215');

-- Attendance
INSERT INTO attendance (student_id, subject, date, status, marked_by) VALUES
  (1, 'Mathematics', '2026-04-20', 'present', 2),
  (2, 'Mathematics', '2026-04-20', 'present', 2),
  (3, 'Mathematics', '2026-04-20', 'absent',  2),
  (4, 'Mathematics', '2026-04-20', 'late',    2),
  (5, 'Mathematics', '2026-04-20', 'present', 2),
  (6, 'Mathematics', '2026-04-20', 'present', 2),
  (1, 'Science',     '2026-04-21', 'present', 2),
  (2, 'Science',     '2026-04-21', 'absent',  2),
  (3, 'Science',     '2026-04-21', 'present', 2);

-- Marks
INSERT INTO marks (student_id, subject, exam_type, marks, max_marks, grade, added_by) VALUES
  (1, 'Mathematics', 'Midterm', 88, 100, 'A',  2),
  (2, 'Mathematics', 'Midterm', 76, 100, 'B',  2),
  (3, 'Mathematics', 'Midterm', 92, 100, 'A+', 2),
  (4, 'Mathematics', 'Midterm', 65, 100, 'C',  2),
  (5, 'Mathematics', 'Midterm', 81, 100, 'A',  2),
  (6, 'Mathematics', 'Midterm', 54, 100, 'D',  2),
  (1, 'Science',     'Midterm', 79, 100, 'B',  2),
  (2, 'Science',     'Midterm', 85, 100, 'A',  2),
  (3, 'Science',     'Midterm', 68, 100, 'B',  2);

-- Useful views
CREATE VIEW attendance_summary AS
  SELECT
    s.id           AS student_id,
    s.name         AS student_name,
    s.roll_number,
    s.class,
    COUNT(*)                                           AS total_classes,
    SUM(a.status = 'present')                          AS present_count,
    SUM(a.status = 'absent')                           AS absent_count,
    SUM(a.status = 'late')                             AS late_count,
    ROUND(SUM(a.status = 'present') / COUNT(*) * 100, 2) AS attendance_pct
  FROM students s
  LEFT JOIN attendance a ON a.student_id = s.id
  GROUP BY s.id;

CREATE VIEW performance_summary AS
  SELECT
    s.id           AS student_id,
    s.name         AS student_name,
    s.roll_number,
    m.subject,
    m.exam_type,
    m.marks,
    m.max_marks,
    ROUND(m.marks / m.max_marks * 100, 2) AS percentage,
    m.grade
  FROM students s
  JOIN marks m ON m.student_id = s.id;

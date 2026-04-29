// routes/marks.js - Add and view marks/performance

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Helper: calculate grade from percentage
const calcGrade = (marks, maxMarks) => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

// ---- POST /api/marks ---- (Admin, Teacher)
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { student_id, subject, exam_type, marks, max_marks = 100 } = req.body;
    if (!student_id || !subject || !exam_type || marks == null) {
      return res.status(400).json({ success: false, message: 'student_id, subject, exam_type and marks are required' });
    }
    if (marks < 0 || marks > max_marks) {
      return res.status(400).json({ success: false, message: `Marks must be between 0 and ${max_marks}` });
    }
    const grade = calcGrade(marks, max_marks);
    const [result] = await db.query(
      'INSERT INTO marks (student_id, subject, exam_type, marks, max_marks, grade, added_by) VALUES (?,?,?,?,?,?,?)',
      [student_id, subject, exam_type, marks, max_marks, grade, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Marks added', data: { id: result.insertId, grade } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/marks ---- Filter by student_id, subject, exam_type
router.get('/', async (req, res) => {
  try {
    const { student_id, subject, exam_type } = req.query;
    let sql = `
      SELECT m.*, s.name AS student_name, s.roll_number, s.class,
        ROUND(m.marks/m.max_marks*100, 1) AS percentage
      FROM marks m
      JOIN students s ON s.id = m.student_id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'student') {
      const [self] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (self.length) { sql += ' AND m.student_id = ?'; params.push(self[0].id); }
    } else if (student_id) {
      sql += ' AND m.student_id = ?'; params.push(student_id);
    }

    if (subject)   { sql += ' AND m.subject = ?';    params.push(subject); }
    if (exam_type) { sql += ' AND m.exam_type = ?'; params.push(exam_type); }
    sql += ' ORDER BY s.name, m.subject';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/marks/report ---- Full performance report (Admin, Teacher)
router.get('/report', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id, s.name, s.roll_number, s.class,
        ROUND(AVG(m.marks/m.max_marks*100), 1) AS avg_percentage,
        MIN(m.marks/m.max_marks*100)            AS min_pct,
        MAX(m.marks/m.max_marks*100)            AS max_pct,
        COUNT(m.id)                             AS total_exams
      FROM students s
      LEFT JOIN marks m ON m.student_id = s.id
      GROUP BY s.id
      ORDER BY avg_percentage DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- PUT /api/marks/:id ---- (Admin, Teacher)
router.put('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { marks, max_marks } = req.body;
    const grade = calcGrade(marks, max_marks);
    await db.query('UPDATE marks SET marks=?, max_marks=?, grade=? WHERE id=?',
      [marks, max_marks, grade, req.params.id]);
    res.json({ success: true, message: 'Marks updated', grade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

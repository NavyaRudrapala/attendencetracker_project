// routes/attendance.js - Mark and view attendance

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// ---- POST /api/attendance/mark ---- (Teacher, Admin)
// Body: { records: [{ student_id, status }], subject, date }
router.post('/mark', requireRole('admin', 'teacher'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { records, subject, date } = req.body;
    if (!records || !subject || !date) {
      return res.status(400).json({ success: false, message: 'records, subject and date are required' });
    }

    await conn.beginTransaction();

    for (const r of records) {
      // INSERT ... ON DUPLICATE KEY UPDATE allows re-marking same day
      await conn.query(
        `INSERT INTO attendance (student_id, subject, date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
        [r.student_id, subject, date, r.status, req.user.id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: `Attendance marked for ${records.length} student(s)` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ---- GET /api/attendance ---- Filter by date, subject, student_id
router.get('/', async (req, res) => {
  try {
    const { date, subject, student_id, class: cls } = req.query;
    let sql = `
      SELECT a.*, s.name AS student_name, s.roll_number, s.class
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      WHERE 1=1
    `;
    const params = [];

    // Students can only see their own records
    if (req.user.role === 'student') {
      const [self] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (self.length) { sql += ' AND a.student_id = ?'; params.push(self[0].id); }
    } else if (student_id) {
      sql += ' AND a.student_id = ?'; params.push(student_id);
    }

    if (date)    { sql += ' AND a.date = ?';    params.push(date); }
    if (subject) { sql += ' AND a.subject = ?'; params.push(subject); }
    if (cls)     { sql += ' AND s.class = ?';   params.push(cls); }

    sql += ' ORDER BY a.date DESC, s.name';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/attendance/summary ---- Attendance % per student
router.get('/summary', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls } = req.query;
    let sql = `
      SELECT
        s.id, s.name, s.roll_number, s.class,
        COUNT(a.id)                               AS total_classes,
        SUM(a.status = 'present')                 AS present,
        SUM(a.status = 'absent')                  AS absent,
        SUM(a.status = 'late')                    AS late,
        ROUND(SUM(a.status='present')/COUNT(*)*100,1) AS attendance_pct
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id
    `;
    const params = [];
    if (cls) { sql += ' WHERE s.class = ?'; params.push(cls); }
    sql += ' GROUP BY s.id ORDER BY s.name';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

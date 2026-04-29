// routes/students.js - CRUD for students

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// ---- GET /api/students ---- (Admin, Teacher)
router.get('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { class: cls } = req.query; // optional ?class=10-A filter
    let sql = 'SELECT * FROM students';
    const params = [];
    if (cls) { sql += ' WHERE class = ?'; params.push(cls); }
    sql += ' ORDER BY name';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/students/:id ---- (Admin, Teacher, or own Student)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Students can only view their own profile
    if (req.user.role === 'student') {
      const [self] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!self.length || self[0].id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- POST /api/students ---- (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, roll_number, class: cls, email, phone, user_id } = req.body;
    if (!name || !roll_number || !cls) {
      return res.status(400).json({ success: false, message: 'Name, roll_number and class are required' });
    }
    const [result] = await db.query(
      'INSERT INTO students (name, roll_number, class, email, phone, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, roll_number, cls, email || null, phone || null, user_id || null]
    );
    res.status(201).json({ success: true, message: 'Student added', data: { id: result.insertId, name, roll_number, class: cls, email, phone } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Roll number already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- PUT /api/students/:id ---- (Admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name, class: cls, email, phone } = req.body;
    await db.query('UPDATE students SET name=?, class=?, email=?, phone=? WHERE id=?',
      [name, cls, email, phone, req.params.id]);
    res.json({ success: true, message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- DELETE /api/students/:id ---- (Admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

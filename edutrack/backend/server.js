// server.js - EduTrack Express Backend Entry Point

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ---- Middleware ----
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (simple)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ---- Routes ----
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/marks',      require('./routes/marks'));

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EduTrack API is running', timestamp: new Date() });
});

// ---- 404 handler ----
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Global error handler ----
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EduTrack API running on http://localhost:${PORT}`);
});

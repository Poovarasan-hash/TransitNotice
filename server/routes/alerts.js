const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/alerts
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { limit = 30 } = req.query;

    const alerts = db.prepare(`
      SELECT a.*, n.title as notice_title, n.transport_type, n.notice_type, n.state, n.district
      FROM alerts a
      LEFT JOIN notices n ON a.notice_id = n.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(parseInt(limit, 10));

    const unreadCountRow = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0').get();

    res.json({
      alerts,
      unreadCount: unreadCountRow ? unreadCountRow.count : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/read/:id
router.post('/read/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/mark-all-read
router.post('/mark-all-read', (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE alerts SET is_read = 1').run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

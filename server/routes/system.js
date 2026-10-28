const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const scheduler = require('../services/scheduler');

// GET /api/system/health
router.get('/health', (req, res) => {
  try {
    const db = getDb();

    const activeNoticesRow = db.prepare(`SELECT COUNT(*) as count FROM notices WHERE status IN ('active', 'revised')`).get();
    const upcomingNoticesRow = db.prepare(`SELECT COUNT(*) as count FROM notices WHERE status = 'upcoming'`).get();
    const expiredNoticesRow = db.prepare(`SELECT COUNT(*) as count FROM notices WHERE status = 'expired'`).get();
    const routesRow = db.prepare('SELECT COUNT(*) as count FROM routes').get();
    const agenciesRow = db.prepare('SELECT COUNT(*) as count FROM agencies').get();
    const vehiclesRow = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();

    const agencies = db.prepare(`
      SELECT id, name, full_name, feed_type, last_checked_at, status_message, requires_api_key
      FROM agencies
    `).all();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      metrics: {
        activeNotices: activeNoticesRow ? activeNoticesRow.count : 0,
        upcomingNotices: upcomingNoticesRow ? upcomingNoticesRow.count : 0,
        expiredNotices: expiredNoticesRow ? expiredNoticesRow.count : 0,
        monitoredRoutes: routesRow ? routesRow.count : 0,
        connectedAgencies: agenciesRow ? agenciesRow.count : 0,
        trackedVehicles: vehiclesRow ? vehiclesRow.count : 0
      },
      scheduler: scheduler.getLastStatus(),
      agencies
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/system/refresh-logs
router.get('/refresh-logs', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare(`
      SELECT l.*, a.name as agency_name
      FROM refresh_logs l
      LEFT JOIN agencies a ON l.agency_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 50
    `).all();

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/system/refresh (manual refresh trigger)
router.post('/refresh', async (req, res) => {
  try {
    const result = await scheduler.runAllRefreshes();
    res.json({
      message: 'Scheduled refresh completed successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/agencies
router.get('/agencies', (req, res) => {
  try {
    const db = getDb();
    const agencies = db.prepare('SELECT * FROM agencies ORDER BY name ASC').all();
    res.json({
      agencies: agencies.map(a => ({
        ...a,
        transport_types: JSON.parse(a.transport_types || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/routes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { state, district, transport_type } = req.query;

    let query = `
      SELECT r.*, a.name as agency_name, a.feed_type
      FROM routes r
      LEFT JOIN agencies a ON r.agency_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (state && state !== 'All') {
      query += ` AND LOWER(r.state) = LOWER(?)`;
      params.push(state);
    }
    if (district && district !== 'All') {
      query += ` AND LOWER(r.district) = LOWER(?)`;
      params.push(district);
    }
    if (transport_type && transport_type !== 'All') {
      query += ` AND LOWER(r.transport_type) = LOWER(?)`;
      params.push(transport_type);
    }

    query += ` ORDER BY r.route_short_name ASC`;
    const rows = db.prepare(query).all(...params);

    const routes = rows.map(r => ({
      ...r,
      coordinates: r.coordinates ? JSON.parse(r.coordinates) : []
    }));

    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/routes/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const route = db.prepare(`
      SELECT r.*, a.name as agency_name, a.feed_type, a.source_url as agency_source_url
      FROM routes r
      LEFT JOIN agencies a ON r.agency_id = a.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const stops = db.prepare(`
      SELECT * FROM stops WHERE route_id = ? ORDER BY stop_sequence ASC
    `).all(req.params.id);

    const vehicles = db.prepare(`
      SELECT * FROM vehicles WHERE route_id = ?
    `).all(req.params.id);

    const notices = db.prepare(`
      SELECT * FROM notices WHERE route_id = ? AND status IN ('active', 'revised', 'upcoming')
    `).all(req.params.id);

    res.json({
      route: {
        ...route,
        coordinates: route.coordinates ? JSON.parse(route.coordinates) : []
      },
      stops,
      vehicles,
      activeNotices: notices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles
router.get('/vehicles/all', (req, res) => {
  try {
    const db = getDb();
    const { route_id, agency_id } = req.query;

    let query = `
      SELECT v.*, r.route_short_name, r.route_long_name, r.transport_type, a.name as agency_name
      FROM vehicles v
      LEFT JOIN routes r ON v.route_id = r.id
      LEFT JOIN agencies a ON v.agency_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (route_id) {
      query += ` AND v.route_id = ?`;
      params.push(route_id);
    }
    if (agency_id) {
      query += ` AND v.agency_id = ?`;
      params.push(agency_id);
    }

    const vehicles = db.prepare(query).all(...params);
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

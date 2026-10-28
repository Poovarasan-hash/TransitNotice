const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { refreshNoticeStatuses } = require('../services/noticeEngine');

// GET /api/notices
router.get('/', (req, res) => {
  try {
    const db = getDb();

    // Trigger status transition on query to ensure expired ones are never returned as active
    refreshNoticeStatuses(db);

    const {
      state,
      district,
      route_id,
      agency_id,
      transport_type,
      notice_type,
      status,
      q,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT n.*, a.name as agency_name, a.feed_type, a.source_url as agency_source_url,
             r.route_short_name, r.route_long_name, r.origin, r.destination
      FROM notices n
      LEFT JOIN agencies a ON n.agency_id = a.id
      LEFT JOIN routes r ON n.route_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (state && state !== 'All') {
      query += ` AND LOWER(n.state) = LOWER(?)`;
      params.push(state);
    }

    if (district && district !== 'All') {
      query += ` AND LOWER(n.district) = LOWER(?)`;
      params.push(district);
    }

    if (route_id && route_id !== 'All') {
      query += ` AND n.route_id = ?`;
      params.push(route_id);
    }

    if (agency_id && agency_id !== 'All') {
      query += ` AND n.agency_id = ?`;
      params.push(agency_id);
    }

    if (transport_type && transport_type !== 'All') {
      query += ` AND LOWER(n.transport_type) = LOWER(?)`;
      params.push(transport_type);
    }

    if (notice_type && notice_type !== 'All') {
      query += ` AND LOWER(n.notice_type) = LOWER(?)`;
      params.push(notice_type);
    }

    if (status && status !== 'All') {
      query += ` AND LOWER(n.status) = LOWER(?)`;
      params.push(status);
    }

    if (q) {
      const term = `%${q.trim()}%`;
      query += ` AND (n.title LIKE ? OR n.summary LIKE ? OR n.affected_area LIKE ? OR n.id LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY 
      CASE n.status 
        WHEN 'active' THEN 1 
        WHEN 'revised' THEN 2 
        WHEN 'upcoming' THEN 3 
        WHEN 'cancelled' THEN 4
        WHEN 'expired' THEN 5 
        ELSE 6 
      END,
      n.published_time DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = db.prepare(query).all(...params);

    const notices = rows.map(r => ({
      ...r,
      geojson: r.geojson ? JSON.parse(r.geojson) : null
    }));

    res.json({
      count: notices.length,
      notices
    });
  } catch (err) {
    console.error('[Notices] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notices/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    refreshNoticeStatuses(db);

    const row = db.prepare(`
      SELECT n.*, a.name as agency_name, a.full_name as agency_full_name, a.feed_type,
             a.last_checked_at as agency_last_checked, a.source_url as agency_source_url,
             r.route_short_name, r.route_long_name, r.origin, r.destination, r.coordinates as route_coordinates
      FROM notices n
      LEFT JOIN agencies a ON n.agency_id = a.id
      LEFT JOIN routes r ON n.route_id = r.id
      WHERE n.id = ?
    `).get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const revisions = db.prepare(`
      SELECT * FROM notice_revisions
      WHERE notice_id = ?
      ORDER BY revision_id DESC
    `).all(req.params.id);

    res.json({
      notice: {
        ...row,
        geojson: row.geojson ? JSON.parse(row.geojson) : null,
        route_coordinates: row.route_coordinates ? JSON.parse(row.route_coordinates) : null
      },
      revisions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notices/:id/revisions
router.get('/:id/revisions', (req, res) => {
  try {
    const db = getDb();
    const revisions = db.prepare(`
      SELECT * FROM notice_revisions
      WHERE notice_id = ?
      ORDER BY revision_id ASC
    `).all(req.params.id);

    res.json({ revisions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

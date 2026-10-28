const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { STATES_AND_DISTRICTS, getCoverageForDistrict } = require('../services/coverageRegistry');

// GET /api/coverage/states
router.get('/states', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM coverage_registry ORDER BY state ASC, district ASC').all();

    const coverageMap = {};
    for (const row of rows) {
      if (!coverageMap[row.state]) {
        coverageMap[row.state] = [];
      }
      coverageMap[row.state].push({
        district: row.district,
        coverage_level: row.coverage_level,
        modes: JSON.parse(row.transport_modes || '[]'),
        notes: row.notes,
        last_verified_at: row.last_verified_at
      });
    }

    res.json({
      states: STATES_AND_DISTRICTS.map(s => s.state),
      registry: coverageMap,
      rawList: STATES_AND_DISTRICTS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coverage/check
router.get('/check', (req, res) => {
  try {
    const { state, district } = req.query;
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }

    const verdict = getCoverageForDistrict(state, district);

    // Also count active notices for this state/district if any
    const db = getDb();
    let noticeCount = 0;
    if (district) {
      const row = db.prepare(`
        SELECT COUNT(*) as count FROM notices 
        WHERE LOWER(state) LIKE ? AND LOWER(district) LIKE ? AND status IN ('active', 'revised', 'upcoming')
      `).get(`%${state.toLowerCase()}%`, `%${district.toLowerCase()}%`);
      noticeCount = row ? row.count : 0;
    }

    res.json({
      ...verdict,
      active_advisories_count: noticeCount,
      last_checked: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db/database');

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.trim().toLowerCase(), username.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email or username already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, 'commuter', ?)
    `).run(userId, username.trim(), email.trim().toLowerCase(), passwordHash, nowIso);

    // Default preferences
    db.prepare(`
      INSERT INTO user_preferences (id, user_id, state, district, route_id, agency_id, alert_types, created_at)
      VALUES (?, ?, 'Delhi (NCT)', 'New Delhi', 'DTC-534', 'delhi_otd', ?, ?)
    `).run(crypto.randomUUID(), userId, JSON.stringify(['diversion', 'delay', 'cancellation']), nowIso);

    const token = jwt.sign(
      { id: userId, username: username.trim(), email: email.trim().toLowerCase(), role: 'commuter' },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      user: { id: userId, username: username.trim(), email: email.trim().toLowerCase(), role: 'commuter' },
      token
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed due to an internal error' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const db = getDb();
    const identifier = emailOrUsername.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?
    `).get(identifier, identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed due to an internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pref = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);

    res.json({
      user,
      preferences: pref ? {
        ...pref,
        alert_types: JSON.parse(pref.alert_types || '[]')
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/preferences
router.put('/preferences', authenticateToken, (req, res) => {
  try {
    const { state, district, route_id, agency_id, alert_types } = req.body;
    const db = getDb();
    const nowIso = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE user_preferences
        SET state = ?, district = ?, route_id = ?, agency_id = ?, alert_types = ?
        WHERE user_id = ?
      `).run(
        state || null,
        district || null,
        route_id || null,
        agency_id || null,
        JSON.stringify(alert_types || ['diversion', 'delay', 'cancellation']),
        req.user.id
      );
    } else {
      db.prepare(`
        INSERT INTO user_preferences (id, user_id, state, district, route_id, agency_id, alert_types, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        req.user.id,
        state || null,
        district || null,
        route_id || null,
        agency_id || null,
        JSON.stringify(alert_types || ['diversion', 'delay', 'cancellation']),
        nowIso
      );
    }

    res.json({ message: 'Preferences updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  router,
  authenticateToken
};

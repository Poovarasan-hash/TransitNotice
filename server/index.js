const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { getDb } = require('./db/database');
const { seedDatabase } = require('./db/seed');
const scheduler = require('./services/scheduler');

const authRoutes = require('./routes/auth');
const noticeRoutes = require('./routes/notices');
const routeRoutes = require('./routes/routes');
const coverageRoutes = require('./routes/coverage');
const alertRoutes = require('./routes/alerts');
const systemRoutes = require('./routes/system');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database & Seed
const db = getDb();
seedDatabase(db);

// Mount API Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/notices', noticeRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/coverage', coverageRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/system', systemRoutes);

// In production, serve built client assets if available
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start Scheduler
scheduler.startScheduler(config.REFRESH_INTERVAL_MS);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start listening
const server = app.listen(config.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚆 TransitNotice Server running on http://localhost:${config.PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`⏱️  Refresh Interval: ${config.REFRESH_INTERVAL_MS}ms`);
  console.log(`=======================================================`);
});

// Graceful termination
process.on('SIGTERM', () => {
  scheduler.stopScheduler();
  server.close(() => console.log('[Server] Closed on SIGTERM'));
});

process.on('SIGINT', () => {
  scheduler.stopScheduler();
  server.close(() => console.log('[Server] Closed on SIGINT'));
});

module.exports = app;

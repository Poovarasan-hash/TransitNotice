const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'transitnotice_super_secret_jwt_key_2026',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'data', 'transitnotice.sqlite'),
  REFRESH_INTERVAL_MS: parseInt(process.env.REFRESH_INTERVAL_MS, 10) || 120000, // 2 minutes
  FETCH_TIMEOUT_MS: parseInt(process.env.FETCH_TIMEOUT_MS, 10) || 8000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES, 10) || 3,
  DEMO_ALERTS_ENABLED: process.env.DEMO_ALERTS_ENABLED !== 'false',
  DELHI_OTD_API_KEY: process.env.DELHI_OTD_API_KEY || null,
  DATA_GOV_IN_API_KEY: process.env.DATA_GOV_IN_API_KEY || null,
  BMTC_ITS_API_KEY: process.env.BMTC_ITS_API_KEY || null,
};

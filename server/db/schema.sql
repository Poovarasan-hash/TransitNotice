-- TransitNotice SQLite Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'commuter',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  state TEXT,
  district TEXT,
  route_id TEXT,
  agency_id TEXT,
  alert_types TEXT, -- JSON array of notice types
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  transport_types TEXT NOT NULL, -- JSON array e.g. ["bus", "metro"]
  feed_type TEXT NOT NULL, -- 'live_gtfs', 'advisory_verified', 'schedule_only'
  source_url TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_checked_at TEXT,
  status_message TEXT,
  requires_api_key INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  route_short_name TEXT NOT NULL,
  route_long_name TEXT NOT NULL,
  transport_type TEXT NOT NULL, -- 'bus', 'metro', 'rail', 'ferry'
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  coordinates TEXT, -- JSON GeoJSON LineString coordinates [[lng, lat], ...]
  color TEXT DEFAULT '#06B6D4',
  FOREIGN KEY (agency_id) REFERENCES agencies (id)
);

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  stop_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  stop_sequence INTEGER NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes (id)
);

CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  route_id TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  transport_type TEXT NOT NULL,
  notice_type TEXT NOT NULL, -- 'diversion', 'delay', 'cancellation', 'interruption', 'advisory'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  affected_area TEXT,
  source_url TEXT NOT NULL,
  published_time TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  observed_time TEXT NOT NULL,
  last_confirmed_time TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  revision_id INTEGER DEFAULT 1,
  change_summary TEXT DEFAULT 'Initial notice publication',
  status TEXT NOT NULL, -- 'active', 'upcoming', 'expired', 'revised', 'withdrawn', 'cancelled'
  geojson TEXT, -- JSON GeoJSON Feature for affected zone or diversion path
  FOREIGN KEY (agency_id) REFERENCES agencies (id)
);

CREATE INDEX IF NOT EXISTS idx_notices_status ON notices (status);
CREATE INDEX IF NOT EXISTS idx_notices_state_district ON notices (state, district);
CREATE INDEX IF NOT EXISTS idx_notices_agency ON notices (agency_id);

CREATE TABLE IF NOT EXISTS notice_revisions (
  id TEXT PRIMARY KEY,
  notice_id TEXT NOT NULL,
  revision_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  content_hash TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'revised', 'extended', 'withdrawn', 'cancelled'
  change_summary TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (notice_id) REFERENCES notices (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notice_revisions_notice ON notice_revisions (notice_id);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  vehicle_label TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  bearing REAL DEFAULT 0,
  speed_kmh REAL DEFAULT 0,
  status TEXT DEFAULT 'in_transit', -- 'in_transit', 'delayed', 'normal'
  last_updated_at TEXT NOT NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies (id),
  FOREIGN KEY (route_id) REFERENCES routes (id)
);

CREATE TABLE IF NOT EXISTS refresh_logs (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  items_found INTEGER DEFAULT 0,
  new_count INTEGER DEFAULT 0,
  revised_count INTEGER DEFAULT 0,
  withdrawn_count INTEGER DEFAULT 0,
  error_message TEXT,
  response_time_ms INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies (id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  notice_id TEXT NOT NULL,
  user_id TEXT, -- NULL for broadcast to all users
  event_type TEXT NOT NULL, -- 'new', 'revised', 'withdrawn', 'cancelled'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  dedup_key TEXT UNIQUE NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coverage_registry (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  coverage_level TEXT NOT NULL, -- 'live_rt', 'advisory_verified', 'schedule_only', 'unintegrated'
  transport_modes TEXT NOT NULL, -- JSON array
  notes TEXT,
  last_verified_at TEXT NOT NULL
);

const crypto = require('crypto');
const config = require('../config');
const { getDb } = require('../db/database');
const { processNoticeBatch, refreshNoticeStatuses } = require('./noticeEngine');

const DelhiOtdAdapter = require('../adapters/delhiOtdAdapter');
const BmtcAdapter = require('../adapters/bmtcAdapter');
const BestMumbaiAdapter = require('../adapters/bestMumbaiAdapter');
const MtcChennaiAdapter = require('../adapters/mtcChennaiAdapter');
const KsrtcAdapter = require('../adapters/ksrtcAdapter');
const NtesRailAdapter = require('../adapters/ntesRailAdapter');

class SchedulerService {
  constructor() {
    this.adapters = [
      new DelhiOtdAdapter(),
      new BmtcAdapter(),
      new BestMumbaiAdapter(),
      new MtcChennaiAdapter(),
      new KsrtcAdapter(),
      new NtesRailAdapter()
    ];
    this.intervalHandle = null;
    this.isRefreshing = false;
    this.lastRefreshTimestamp = null;
  }

  async runSingleAdapter(adapter, db = getDb()) {
    const startTime = Date.now();
    const agencyId = adapter.agencyId;
    const nowIso = new Date().toISOString();

    const agencyStmt = db.prepare('SELECT * FROM agencies WHERE id = ?');
    let agency = agencyStmt.get(agencyId);

    // If agency not yet in DB, create it
    if (!agency) {
      db.prepare(`
        INSERT INTO agencies (
          id, name, full_name, state, district, transport_types,
          feed_type, source_url, is_active, last_checked_at, status_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'Active')
      `).run(
        agencyId,
        adapter.agencyName,
        adapter.agencyName,
        'India',
        'National/Regional',
        JSON.stringify(['bus', 'metro', 'rail']),
        'advisory_verified',
        adapter.sourceUrl,
        nowIso
      );
      agency = agencyStmt.get(agencyId);
    }

    try {
      // 1. Fetch notices with retry/backoff
      const rawNotices = await adapter.fetchNotices();
      const processResult = processNoticeBatch(db, rawNotices, agency);

      // 2. Fetch live vehicles if supported
      const rawVehicles = await adapter.fetchVehicles();
      if (Array.isArray(rawVehicles) && rawVehicles.length > 0) {
        const upsertVehicle = db.prepare(`
          INSERT INTO vehicles (id, agency_id, route_id, vehicle_label, lat, lng, bearing, speed_kmh, status, last_updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            lat = excluded.lat,
            lng = excluded.lng,
            bearing = excluded.bearing,
            speed_kmh = excluded.speed_kmh,
            status = excluded.status,
            last_updated_at = excluded.last_updated_at
        `);

        for (const v of rawVehicles) {
          upsertVehicle.run(
            v.id, v.agency_id, v.route_id, v.vehicle_label,
            v.lat, v.lng, v.bearing || 0, v.speed_kmh || 0,
            v.status || 'in_transit', v.last_updated_at || nowIso
          );
        }
      }

      const responseTime = Date.now() - startTime;

      // Log success
      const logId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO refresh_logs (
          id, agency_id, status, items_found, new_count, revised_count,
          withdrawn_count, error_message, response_time_ms, created_at
        ) VALUES (?, ?, 'success', ?, ?, ?, ?, NULL, ?, ?)
      `).run(
        logId, agencyId, processResult.itemsFound, processResult.newCount,
        processResult.revisedCount, processResult.withdrawnCount,
        responseTime, nowIso
      );

      return {
        agencyId,
        status: 'success',
        ...processResult,
        responseTime
      };
    } catch (err) {
      const responseTime = Date.now() - startTime;
      console.error(`[Scheduler] Refresh failed for agency ${agencyId}:`, err.message);

      // Log failure
      const logId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO refresh_logs (
          id, agency_id, status, items_found, new_count, revised_count,
          withdrawn_count, error_message, response_time_ms, created_at
        ) VALUES (?, ?, 'failed', 0, 0, 0, 0, ?, ?, ?)
      `).run(
        logId, agencyId, err.message, responseTime, nowIso
      );

      db.prepare(`UPDATE agencies SET last_checked_at = ?, status_message = ? WHERE id = ?`)
        .run(nowIso, `Degraded - ${err.message.slice(0, 50)}`, agencyId);

      return {
        agencyId,
        status: 'failed',
        error: err.message,
        responseTime
      };
    }
  }

  async runAllRefreshes() {
    if (this.isRefreshing) {
      return { skipped: true, message: 'Refresh already in progress' };
    }

    this.isRefreshing = true;
    const db = getDb();
    const results = [];

    try {
      for (const adapter of this.adapters) {
        const res = await this.runSingleAdapter(adapter, db);
        results.push(res);
      }

      // Check expired statuses globally
      const transitions = refreshNoticeStatuses(db);
      this.lastRefreshTimestamp = new Date().toISOString();

      return {
        success: true,
        refreshedAt: this.lastRefreshTimestamp,
        adaptersCount: this.adapters.length,
        results,
        transitions
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  startScheduler(intervalMs = config.REFRESH_INTERVAL_MS) {
    if (this.intervalHandle) return;

    // Run initial pass
    this.runAllRefreshes().catch(err => {
      console.error('[Scheduler] Initial refresh failed:', err);
    });

    this.intervalHandle = setInterval(() => {
      this.runAllRefreshes().catch(err => {
        console.error('[Scheduler] Scheduled refresh error:', err);
      });
    }, intervalMs);

    console.log(`[Scheduler] Started background refresh service (Interval: ${intervalMs}ms)`);
  }

  stopScheduler() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[Scheduler] Background refresh service stopped.');
    }
  }

  getLastStatus() {
    return {
      lastRefreshTimestamp: this.lastRefreshTimestamp,
      isRefreshing: this.isRefreshing,
      adapters: this.adapters.map(a => ({ id: a.agencyId, name: a.agencyName }))
    };
  }
}

const schedulerInstance = new SchedulerService();

module.exports = schedulerInstance;

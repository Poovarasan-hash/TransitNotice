const crypto = require('crypto');

/**
 * Computes deterministic SHA-256 hash from canonical representation of notice content
 */
function computeContentHash(data) {
  const canonical = [
    (data.title || '').trim(),
    (data.summary || '').trim(),
    (data.notice_type || '').trim().toLowerCase(),
    (data.affected_area || '').trim(),
    data.valid_from ? new Date(data.valid_from).toISOString() : '',
    data.valid_to ? new Date(data.valid_to).toISOString() : '',
    (data.route_id || '').trim(),
    (data.transport_type || '').trim().toLowerCase()
  ].join('|');

  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Normalizes an incoming raw notice from any adapter or feed
 */
function normalizeNotice(raw, agency) {
  if (!raw || typeof raw !== 'object') return null;

  const rawTitle = raw.title || raw.header || raw.subject || 'Transit Advisory';
  const title = String(rawTitle).trim();
  const rawSummary = raw.summary || raw.description || raw.text || raw.content || title;
  const summary = String(rawSummary).trim();
  const notice_type = String(raw.notice_type || raw.type || 'advisory').toLowerCase().trim();
  const valid_notice_types = ['diversion', 'delay', 'cancellation', 'interruption', 'advisory'];
  const finalType = valid_notice_types.includes(notice_type) ? notice_type : 'advisory';

  // ID determination: use supplied ID or generate deterministic ID from agency & external id
  const rawId = raw.id || raw.notice_id || raw.advisory_id || `${agency.id}-${crypto.createHash('md5').update(title).digest('hex').substring(0, 8)}`;
  const id = String(rawId).trim();

  // Parse timestamps
  const nowIso = new Date().toISOString();
  let published_time = nowIso;
  if (raw.published_time || raw.publish_date || raw.timestamp) {
    const d = new Date(raw.published_time || raw.publish_date || raw.timestamp);
    if (!isNaN(d.getTime())) published_time = d.toISOString();
  }

  let valid_from = published_time;
  if (raw.valid_from || raw.start_time || raw.effective_from) {
    const d = new Date(raw.valid_from || raw.start_time || raw.effective_from);
    if (!isNaN(d.getTime())) valid_from = d.toISOString();
  }

  let valid_to = null;
  if (raw.valid_to || raw.end_time || raw.effective_to) {
    const d = new Date(raw.valid_to || raw.end_time || raw.effective_to);
    if (!isNaN(d.getTime())) valid_to = d.toISOString();
  }

  const normalized = {
    id,
    agency_id: agency.id,
    route_id: raw.route_id ? String(raw.route_id).trim() : (raw.route ? String(raw.route).trim() : null),
    state: raw.state ? String(raw.state).trim() : (agency.state || 'India'),
    district: raw.district ? String(raw.district).trim() : (agency.district || 'Unspecified'),
    transport_type: String(raw.transport_type || (agency.transport_types && agency.transport_types[0]) || 'bus').toLowerCase().trim(),
    notice_type: finalType,
    title,
    summary,
    affected_area: raw.affected_area ? String(raw.affected_area).trim() : (raw.area ? String(raw.area).trim() : (agency.district || 'All Routes')),
    source_url: raw.source_url ? String(raw.source_url).trim() : (agency.source_url || 'https://transitnotice.gov.in'),
    published_time,
    valid_from,
    valid_to,
    observed_time: nowIso,
    last_confirmed_time: nowIso,
    geojson: raw.geojson ? (typeof raw.geojson === 'string' ? raw.geojson : JSON.stringify(raw.geojson)) : null
  };

  normalized.content_hash = computeContentHash(normalized);
  return normalized;
}

/**
 * Calculates the notice status based on timestamps and operational flags
 */
function calculateStatus(notice, currentTime = new Date()) {
  if (notice.is_withdrawn || notice.status === 'withdrawn') {
    return 'withdrawn';
  }
  if (notice.is_cancelled || notice.status === 'cancelled' || notice.notice_type === 'cancellation') {
    // If it's a cancellation notice itself, status is active during valid window
    if (notice.status === 'cancelled') return 'cancelled';
  }

  const nowTime = currentTime.getTime();
  const fromTime = notice.valid_from ? new Date(notice.valid_from).getTime() : 0;
  const toTime = notice.valid_to ? new Date(notice.valid_to).getTime() : Infinity;

  // Expired check: valid_to has passed
  if (notice.valid_to && nowTime > toTime) {
    return 'expired';
  }

  // Upcoming check: valid_from is in the future
  if (fromTime > nowTime) {
    return 'upcoming';
  }

  // Active / Revised
  if (notice.revision_id && notice.revision_id > 1) {
    return 'revised';
  }

  return 'active';
}

/**
 * Re-evaluates all existing stored notices to transition expired or newly active ones
 */
function refreshNoticeStatuses(db, currentTime = new Date()) {
  const nowIso = currentTime.toISOString();
  
  // 1. Mark expired notices: any active, revised, or upcoming notice whose valid_to <= now
  const markExpiredStmt = db.prepare(`
    UPDATE notices 
    SET status = 'expired', last_confirmed_time = ?
    WHERE valid_to IS NOT NULL 
      AND valid_to <= ? 
      AND status NOT IN ('expired', 'withdrawn', 'cancelled')
  `);
  const expiredRes = markExpiredStmt.run(nowIso, nowIso);

  // 2. Mark upcoming notices that have now started
  const markActiveStmt = db.prepare(`
    UPDATE notices 
    SET status = CASE WHEN revision_id > 1 THEN 'revised' ELSE 'active' END, 
        last_confirmed_time = ?
    WHERE valid_from <= ? 
      AND (valid_to IS NULL OR valid_to > ?)
      AND status = 'upcoming'
  `);
  const activeRes = markActiveStmt.run(nowIso, nowIso, nowIso);

  return {
    expiredTransitioned: expiredRes.changes,
    activeTransitioned: activeRes.changes
  };
}

/**
 * Idempotently processes an incoming batch of notices for an agency.
 * Returns { newCount, revisedCount, confirmedCount, withdrawnCount, alertsCreated }
 */
function processNoticeBatch(db, rawNotices, agency, currentTime = new Date()) {
  const nowIso = currentTime.toISOString();
  let newCount = 0;
  let revisedCount = 0;
  let confirmedCount = 0;
  let withdrawnCount = 0;
  const alertsCreated = [];

  // Deduplicate incoming raw notices by ID in the same batch
  const seenIds = new Set();
  const validIncoming = [];
  for (const raw of rawNotices) {
    const norm = normalizeNotice(raw, agency);
    if (norm && !seenIds.has(norm.id)) {
      seenIds.add(norm.id);
      validIncoming.push(norm);
    }
  }

  const findNoticeStmt = db.prepare('SELECT * FROM notices WHERE id = ?');
  const insertNoticeStmt = db.prepare(`
    INSERT INTO notices (
      id, agency_id, route_id, state, district, transport_type,
      notice_type, title, summary, affected_area, source_url,
      published_time, valid_from, valid_to, observed_time,
      last_confirmed_time, content_hash, revision_id, change_summary,
      status, geojson
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const updateNoticeStmt = db.prepare(`
    UPDATE notices SET
      route_id = ?,
      state = ?,
      district = ?,
      transport_type = ?,
      notice_type = ?,
      title = ?,
      summary = ?,
      affected_area = ?,
      source_url = ?,
      valid_from = ?,
      valid_to = ?,
      last_confirmed_time = ?,
      content_hash = ?,
      revision_id = ?,
      change_summary = ?,
      status = ?,
      geojson = ?
    WHERE id = ?
  `);

  const touchNoticeStmt = db.prepare(`
    UPDATE notices SET last_confirmed_time = ? WHERE id = ?
  `);

  const insertRevisionStmt = db.prepare(`
    INSERT INTO notice_revisions (
      id, notice_id, revision_id, title, summary, valid_from, valid_to,
      content_hash, change_type, change_summary, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAlertStmt = db.prepare(`
    INSERT OR IGNORE INTO alerts (
      id, notice_id, user_id, event_type, title, message, dedup_key, is_read, created_at
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, 0, ?)
  `);

  for (const item of validIncoming) {
    const existing = findNoticeStmt.get(item.id);

    if (!existing) {
      // BRAND NEW NOTICE
      const status = calculateStatus(item, currentTime);
      item.status = status;
      item.revision_id = 1;
      item.change_summary = 'Initial notice publication';

      insertNoticeStmt.run(
        item.id, item.agency_id, item.route_id, item.state, item.district, item.transport_type,
        item.notice_type, item.title, item.summary, item.affected_area, item.source_url,
        item.published_time, item.valid_from, item.valid_to, nowIso,
        nowIso, item.content_hash, 1, item.change_summary,
        status, item.geojson
      );

      // Record first revision
      const revId = `${item.id}-rev1`;
      insertRevisionStmt.run(
        revId, item.id, 1, item.title, item.summary, item.valid_from, item.valid_to,
        item.content_hash, 'created', item.change_summary, nowIso
      );

      // Create alert with dedup_key
      const dedupKey = `alert-${item.id}-rev1`;
      const alertId = crypto.randomUUID();
      const alertTitle = `[New ${item.transport_type.toUpperCase()}] ${item.title}`;
      const alertMsg = `${agency.name}: ${item.summary.slice(0, 140)}${item.summary.length > 140 ? '...' : ''}`;
      
      insertAlertStmt.run(alertId, item.id, 'new', alertTitle, alertMsg, dedupKey, nowIso);
      alertsCreated.push({ id: alertId, event_type: 'new', title: alertTitle });
      newCount++;
    } else {
      // EXISTING NOTICE - CHECK HASH FOR CHANGES
      if (existing.content_hash === item.content_hash) {
        // Idempotent refresh: exactly identical, touch last_confirmed_time
        touchNoticeStmt.run(nowIso, existing.id);
        confirmedCount++;
      } else {
        // Content changed! Determine change nature
        const nextRev = (existing.revision_id || 1) + 1;
        let changeType = 'revised';
        let changeSummary = 'Advisory details updated by agency';

        // Check if valid_to was extended
        if (existing.valid_to && item.valid_to && new Date(item.valid_to) > new Date(existing.valid_to)) {
          changeType = 'extended';
          changeSummary = `Validity period extended to ${new Date(item.valid_to).toLocaleDateString()}`;
        } else if (item.notice_type === 'cancellation') {
          changeType = 'cancelled';
          changeSummary = 'Service cancelled';
        }

        item.revision_id = nextRev;
        const status = calculateStatus(item, currentTime);
        item.status = status;

        updateNoticeStmt.run(
          item.route_id, item.state, item.district, item.transport_type,
          item.notice_type, item.title, item.summary, item.affected_area, item.source_url,
          item.valid_from, item.valid_to, nowIso,
          item.content_hash, nextRev, changeSummary,
          status, item.geojson,
          item.id
        );

        // Record revision
        const revId = `${item.id}-rev${nextRev}`;
        insertRevisionStmt.run(
          revId, item.id, nextRev, item.title, item.summary, item.valid_from, item.valid_to,
          item.content_hash, changeType, changeSummary, nowIso
        );

        // Alert
        const dedupKey = `alert-${item.id}-rev${nextRev}`;
        const alertId = crypto.randomUUID();
        const alertTitle = `[${changeType.toUpperCase()}] ${item.title}`;
        const alertMsg = `${agency.name}: ${changeSummary} - ${item.summary.slice(0, 120)}`;
        
        insertAlertStmt.run(alertId, item.id, changeType, alertTitle, alertMsg, dedupKey, nowIso);
        alertsCreated.push({ id: alertId, event_type: changeType, title: alertTitle });
        revisedCount++;
      }
    }
  }

  // Update agency's last checked timestamp
  db.prepare(`UPDATE agencies SET last_checked_at = ?, status_message = 'Operational - Feed verified' WHERE id = ?`)
    .run(nowIso, agency.id);

  // Transition any expired notices
  refreshNoticeStatuses(db, currentTime);

  return {
    itemsFound: validIncoming.length,
    newCount,
    revisedCount,
    confirmedCount,
    withdrawnCount,
    alertsCreated
  };
}

module.exports = {
  computeContentHash,
  normalizeNotice,
  calculateStatus,
  refreshNoticeStatuses,
  processNoticeBatch
};

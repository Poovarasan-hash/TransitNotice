const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const {
  computeContentHash,
  normalizeNotice,
  calculateStatus,
  refreshNoticeStatuses,
  processNoticeBatch
} = require('../services/noticeEngine');

const mockAgency = {
  id: 'test_agency',
  name: 'Test Transit Agency',
  state: 'Delhi (NCT)',
  district: 'Central Delhi',
  transport_types: ['bus'],
  source_url: 'https://test-transit.gov.in'
};

function createTestDb() {
  const db = new DatabaseSync(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  // Insert mock agency
  db.prepare(`
    INSERT INTO agencies (id, name, full_name, state, district, transport_types, feed_type, source_url)
    VALUES (?, ?, ?, ?, ?, ?, 'advisory_verified', ?)
  `).run(
    mockAgency.id, mockAgency.name, mockAgency.name,
    mockAgency.state, mockAgency.district,
    JSON.stringify(mockAgency.transport_types),
    mockAgency.source_url
  );

  return db;
}

test('1. Deterministic Content Hashing', () => {
  const noticeA = {
    title: 'Route 101 Diversion',
    summary: 'Diverted via Outer Ring Road',
    notice_type: 'diversion',
    affected_area: 'Outer Ring Road',
    valid_from: '2026-10-01T00:00:00.000Z',
    valid_to: '2026-10-15T00:00:00.000Z',
    route_id: 'R-101',
    transport_type: 'bus'
  };

  const noticeB = { ...noticeA };
  const noticeModified = { ...noticeA, summary: 'Diverted via Central Boulevard instead' };

  const hashA = computeContentHash(noticeA);
  const hashB = computeContentHash(noticeB);
  const hashMod = computeContentHash(noticeModified);

  assert.strictEqual(hashA, hashB, 'Identical content must yield identical hash');
  assert.notStrictEqual(hashA, hashMod, 'Altered content must produce different hash');
  assert.strictEqual(hashA.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
});

test('2. Missing Fields Normalization', () => {
  const fixturesPath = path.join(__dirname, 'fixtures/missing_fields.json');
  const missingFixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

  const norm1 = normalizeNotice(missingFixtures[0], mockAgency);
  assert.ok(norm1, 'Normalized object should exist');
  assert.strictEqual(norm1.title, 'Advisory with Missing Route and Timestamps');
  assert.strictEqual(norm1.agency_id, mockAgency.id);
  assert.strictEqual(norm1.notice_type, 'advisory');
  assert.strictEqual(norm1.state, mockAgency.state);
  assert.ok(norm1.valid_from, 'Fallback valid_from timestamp should be generated');

  const norm2 = normalizeNotice(missingFixtures[1], mockAgency);
  assert.strictEqual(norm2.title, 'Metro Notice without Affected Area');
  assert.strictEqual(norm2.notice_type, 'delay');
  assert.strictEqual(norm2.affected_area, mockAgency.district);
});

test('3. Malformed Feed Handling', () => {
  const malformedPath = path.join(__dirname, 'fixtures/malformed_feed.json');
  const malformed = JSON.parse(fs.readFileSync(malformedPath, 'utf8'));

  let processedCount = 0;
  for (const item of malformed) {
    if (item && typeof item === 'object') {
      const norm = normalizeNotice(item, mockAgency);
      if (norm) processedCount++;
    }
  }
  assert.strictEqual(processedCount, 2, 'Should safely normalize valid objects and ignore null/string junk');
});

test('4. Status Determination (Active, Upcoming, Expired, Revised)', () => {
  const now = new Date('2026-10-28T12:00:00Z');

  // Currently Active
  const activeNotice = {
    valid_from: '2026-10-20T00:00:00Z',
    valid_to: '2026-11-05T00:00:00Z',
    revision_id: 1
  };
  assert.strictEqual(calculateStatus(activeNotice, now), 'active');

  // Upcoming
  const upcomingNotice = {
    valid_from: '2026-11-01T00:00:00Z',
    valid_to: '2026-11-10T00:00:00Z',
    revision_id: 1
  };
  assert.strictEqual(calculateStatus(upcomingNotice, now), 'upcoming');

  // Expired: valid_to is in the past! Expired notices MUST NEVER appear as active.
  const expiredNotice = {
    valid_from: '2026-10-01T00:00:00Z',
    valid_to: '2026-10-25T00:00:00Z',
    revision_id: 1
  };
  assert.strictEqual(calculateStatus(expiredNotice, now), 'expired');

  // Revised: active with revision_id > 1
  const revisedNotice = {
    valid_from: '2026-10-20T00:00:00Z',
    valid_to: '2026-11-05T00:00:00Z',
    revision_id: 2
  };
  assert.strictEqual(calculateStatus(revisedNotice, now), 'revised');

  // Cancelled
  const cancelledNotice = {
    valid_from: '2026-10-20T00:00:00Z',
    valid_to: '2026-11-05T00:00:00Z',
    status: 'cancelled'
  };
  assert.strictEqual(calculateStatus(cancelledNotice, now), 'cancelled');
});

test('5. Idempotent Database Batch Processing and Deduplication', () => {
  const db = createTestDb();
  const dupPath = path.join(__dirname, 'fixtures/duplicates_feed.json');
  const dupFeed = JSON.parse(fs.readFileSync(dupPath, 'utf8'));

  const fixedTime = new Date('2026-10-28T12:00:00Z');

  // First run: 2 duplicates in payload, should insert exactly 1 unique notice
  const res1 = processNoticeBatch(db, dupFeed, mockAgency, fixedTime);
  assert.strictEqual(res1.newCount, 1, 'Should insert only 1 notice from duplicate items in payload');

  const countRow1 = db.prepare('SELECT COUNT(*) as count FROM notices').get();
  assert.strictEqual(countRow1.count, 1, 'Exactly 1 notice should exist in database');

  const revCount1 = db.prepare('SELECT COUNT(*) as count FROM notice_revisions').get();
  assert.strictEqual(revCount1.count, 1, 'Exactly 1 revision should exist');

  // Second run with EXACT same payload: MUST BE 100% IDEMPOTENT
  const res2 = processNoticeBatch(db, dupFeed, mockAgency, fixedTime);
  assert.strictEqual(res2.newCount, 0, 'No new notices should be created');
  assert.strictEqual(res2.revisedCount, 0, 'No revision should be triggered for unchanged data');
  assert.strictEqual(res2.confirmedCount, 1, 'Existing notice should simply be confirmed');

  const countRow2 = db.prepare('SELECT COUNT(*) as count FROM notices').get();
  assert.strictEqual(countRow2.count, 1, 'Database notice count must remain 1');

  const revCount2 = db.prepare('SELECT COUNT(*) as count FROM notice_revisions').get();
  assert.strictEqual(revCount2.count, 1, 'No duplicate revisions should be recorded');
});

test('6. Revision and Extension Detection with Alert Deduplication', () => {
  const db = createTestDb();
  const revPath = path.join(__dirname, 'fixtures/revised_extended_feed.json');
  const revFeed = JSON.parse(fs.readFileSync(revPath, 'utf8'));

  const initialPayload = [revFeed[0]];
  const extendedPayload = [revFeed[1]];

  const time1 = new Date('2026-10-05T10:00:00Z');
  const res1 = processNoticeBatch(db, initialPayload, mockAgency, time1);
  assert.strictEqual(res1.newCount, 1);

  const initialNotice = db.prepare('SELECT * FROM notices WHERE id = ?').get('REV-TEST-01');
  assert.strictEqual(initialNotice.revision_id, 1);
  assert.strictEqual(initialNotice.valid_to, '2026-10-20T23:59:59.000Z');

  // Process updated payload with extended date & new summary
  const time2 = new Date('2026-10-18T10:00:00Z');
  const res2 = processNoticeBatch(db, extendedPayload, mockAgency, time2);
  assert.strictEqual(res2.revisedCount, 1, 'Should detect revision');

  const updatedNotice = db.prepare('SELECT * FROM notices WHERE id = ?').get('REV-TEST-01');
  assert.strictEqual(updatedNotice.revision_id, 2, 'Revision ID should bump to 2');
  assert.strictEqual(updatedNotice.valid_to, '2026-11-15T23:59:59.000Z');
  assert.ok(updatedNotice.change_summary.includes('extended'), 'Change summary should note extension');

  // Revisions table check
  const revisions = db.prepare('SELECT * FROM notice_revisions WHERE notice_id = ? ORDER BY revision_id ASC').all('REV-TEST-01');
  assert.strictEqual(revisions.length, 2, 'Should have two revisions logged');
  assert.strictEqual(revisions[0].change_type, 'created');
  assert.strictEqual(revisions[1].change_type, 'extended');

  // Alerts deduplication check
  const alerts = db.prepare('SELECT * FROM alerts WHERE notice_id = ?').all('REV-TEST-01');
  assert.strictEqual(alerts.length, 2, 'Should have 1 alert for new, 1 for extended');
});

test('7. Automatic Transition of Expired Notices', () => {
  const db = createTestDb();
  const expPath = path.join(__dirname, 'fixtures/expired_feed.json');
  const expFeed = JSON.parse(fs.readFileSync(expPath, 'utf8'));

  // Feed with valid_to in September 2026
  const currentTime = new Date('2026-10-28T12:00:00Z');
  processNoticeBatch(db, expFeed, mockAgency, currentTime);

  const stored = db.prepare('SELECT * FROM notices WHERE id = ?').get('EXP-TEST-01');
  assert.strictEqual(stored.status, 'expired', 'Expired notice must be categorized as expired and NEVER active');
});

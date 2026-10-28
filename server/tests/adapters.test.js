const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const BaseAdapter = require('../adapters/baseAdapter');
const scheduler = require('../services/scheduler');

test('8. Adapter Timeout and Exponential Backoff Handling', async () => {
  class FailingAdapter extends BaseAdapter {
    constructor() {
      super({
        agencyId: 'failing_agency',
        agencyName: 'Failing Agency Test',
        timeoutMs: 100,
        maxRetries: 2
      });
      this.attempts = 0;
    }

    async fetchNotices() {
      this.attempts++;
      throw new Error('Connection timed out to official portal');
    }
  }

  const failingAdapter = new FailingAdapter();
  const db = new DatabaseSync(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  const result = await scheduler.runSingleAdapter(failingAdapter, db);

  assert.strictEqual(result.status, 'failed');
  assert.ok(result.error.includes('timed out'));

  // Verify failure log recorded in refresh_logs
  const log = db.prepare('SELECT * FROM refresh_logs WHERE agency_id = ?').get('failing_agency');
  assert.ok(log, 'Failure must be recorded in refresh_logs');
  assert.strictEqual(log.status, 'failed');
  assert.ok(log.error_message.includes('timed out'));

  // Verify agency marked as degraded
  const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get('failing_agency');
  assert.ok(agency.status_message.includes('Degraded'));
});

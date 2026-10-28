const config = require('../config');

class BaseAdapter {
  constructor(options = {}) {
    this.agencyId = options.agencyId || 'generic';
    this.agencyName = options.agencyName || 'Transit Agency';
    this.sourceUrl = options.sourceUrl || 'https://transitnotice.gov.in';
    this.timeoutMs = options.timeoutMs || config.FETCH_TIMEOUT_MS;
    this.maxRetries = options.maxRetries || config.MAX_RETRIES;
  }

  async fetchWithTimeout(url, options = {}, timeoutMs = this.timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  async fetchWithRetry(url, options = {}, retries = this.maxRetries, delayMs = 1000) {
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const backoff = delayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    throw lastError;
  }

  /**
   * Must be implemented by child classes
   * Returns Array of raw notice objects
   */
  async fetchNotices() {
    throw new Error('fetchNotices() must be implemented by adapter subclass');
  }

  /**
   * Optional: Returns live vehicle GPS positions if supported
   */
  async fetchVehicles() {
    return [];
  }
}

module.exports = BaseAdapter;

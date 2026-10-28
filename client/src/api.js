/**
 * TransitNotice API Client
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('transit_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.error) errorMsg = data.error;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Notices
  async getNotices(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE}/notices?${query.toString()}`);
    return handleResponse(res);
  },

  async getNoticeDetail(id) {
    const res = await fetch(`${API_BASE}/notices/${id}`);
    return handleResponse(res);
  },

  async getNoticeRevisions(id) {
    const res = await fetch(`${API_BASE}/notices/${id}/revisions`);
    return handleResponse(res);
  },

  // Routes & Vehicles
  async getRoutes(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'All') query.append(k, v);
    });
    const res = await fetch(`${API_BASE}/routes?${query.toString()}`);
    return handleResponse(res);
  },

  async getRouteDetail(id) {
    const res = await fetch(`${API_BASE}/routes/${id}`);
    return handleResponse(res);
  },

  async getVehicles(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    const res = await fetch(`${API_BASE}/routes/vehicles/all?${query.toString()}`);
    return handleResponse(res);
  },

  // Coverage
  async getCoverageStates() {
    const res = await fetch(`${API_BASE}/coverage/states`);
    return handleResponse(res);
  },

  async checkDistrictCoverage(state, district) {
    const query = new URLSearchParams({ state, district: district || '' });
    const res = await fetch(`${API_BASE}/coverage/check?${query.toString()}`);
    return handleResponse(res);
  },

  // Alerts
  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    return handleResponse(res);
  },

  async markAlertRead(id) {
    const res = await fetch(`${API_BASE}/alerts/read/${id}`, { method: 'POST' });
    return handleResponse(res);
  },

  async markAllAlertsRead() {
    const res = await fetch(`${API_BASE}/alerts/mark-all-read`, { method: 'POST' });
    return handleResponse(res);
  },

  // System & Refresh
  async getSystemHealth() {
    const res = await fetch(`${API_BASE}/system/health`);
    return handleResponse(res);
  },

  async triggerSystemRefresh() {
    const res = await fetch(`${API_BASE}/system/refresh`, { method: 'POST' });
    return handleResponse(res);
  },

  // Auth
  async login(emailOrUsername, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    });
    return handleResponse(res);
  },

  async register(username, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader()
    });
    return handleResponse(res);
  },

  async updatePreferences(prefs) {
    const res = await fetch(`${API_BASE}/auth/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(prefs)
    });
    return handleResponse(res);
  }
};

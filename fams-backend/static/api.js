/**
 * FAMS API Service — All backend calls live here.
 */
class ApiService {
  constructor(base = '/api/v1') {
    this.base = base;
  }

  get token() { return localStorage.getItem('fams_token'); }
  set token(v) { v ? localStorage.setItem('fams_token', v) : localStorage.removeItem('fams_token'); }
  get isAuth()  { return !!this.token; }

  logout() {
    this.token = null;
    window.location.hash = '#login';
    location.reload();
  }

  async request(path, opts = {}) {
    const headers = { ...opts.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!(opts.body instanceof URLSearchParams)) headers['Content-Type'] = 'application/json';

    const res = await fetch(this.base + path, { ...opts, headers });

    if (res.status === 401 && path !== '/auth/login') { this.logout(); return; }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Auth ──────────────────────────────────────────────────────────
  async login(email, password) {
    const body = new URLSearchParams({ username: email, password });
    const data = await this.request('/auth/login', { method: 'POST', body });
    this.token = data.access_token;
    return data;
  }
  getMe()         { return this.request('/auth/me'); }
  changePassword(cur, nw) {
    return this.request('/auth/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: cur, new_password: nw })
    });
  }

  // ── Employees ─────────────────────────────────────────────────────
  getEmployees()         { return this.request('/employees/'); }
  createEmployee(data)   { return this.request('/employees/', { method: 'POST', body: JSON.stringify(data) }); }
  updateEmployee(id, d)  { return this.request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
  activateEmployee(id)   { return this.request(`/employees/${id}/activate`,   { method: 'POST' }); }
  deactivateEmployee(id) { return this.request(`/employees/${id}/deactivate`, { method: 'POST' }); }
  deleteEmployee(id)     { return this.request(`/employees/${id}`, { method: 'DELETE' }); }

  // ── Aircraft ──────────────────────────────────────────────────────
  getFleet()             { return this.request('/aircraft/'); }
  createAircraft(data)   { return this.request('/aircraft/', { method: 'POST', body: JSON.stringify(data) }); }
  updateAircraft(id, d)  { return this.request(`/aircraft/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
  deleteAircraft(id)     { return this.request(`/aircraft/${id}`, { method: 'DELETE' }); }

  // ── Airports ──────────────────────────────────────────────────────
  getAirports()          { return this.request('/airports/'); }
  createAirport(data)    { return this.request('/airports/', { method: 'POST', body: JSON.stringify(data) }); }

  // ── Routes ────────────────────────────────────────────────────────
  getRoutes()            { return this.request('/routes/'); }
  createRoute(data)      { return this.request('/routes/', { method: 'POST', body: JSON.stringify(data) }); }

  // ── Flights ───────────────────────────────────────────────────────
  getMyFlights()         { return this.request('/flights/my'); }
  getAllFlights()         { return this.request('/flights/'); }
  createFlight(data)     { return this.request('/flights/', { method: 'POST', body: JSON.stringify(data) }); }
  updateFlight(id, d)    { return this.request(`/flights/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
  cancelFlight(id)       { return this.request(`/flights/${id}/cancel`, { method: 'POST' }); }

  // ── Assignments ───────────────────────────────────────────────────
  getFlightCrew(fid)     { return this.request(`/assignments/flight/${fid}`); }
  createAssignment(data) { return this.request('/assignments/', { method: 'POST', body: JSON.stringify(data) }); }
  deleteAssignment(id)   { return this.request(`/assignments/${id}`, { method: 'DELETE' }); }
  updateAssignment(id,d) { return this.request(`/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(d) }); }
}

const api = new ApiService();

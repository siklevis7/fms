/* ===================================================================
   FAMS · app.js
   =================================================================== */

// ─── Theme Controller ─────────────────────────────────────────────
const Theme = {
  current: localStorage.getItem('fams_theme') || 'dark',

  init() {
    this._apply(this.current);
  },

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('fams_theme', this.current);
    this._apply(this.current);
  },

  _apply(theme) {
    const root  = document.documentElement;
    const label = document.getElementById('theme-label');
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (label) label.textContent = 'Dark Mode';
    } else {
      root.removeAttribute('data-theme');
      if (label) label.textContent = 'Light Mode';
    }
  },
};

Theme.init();

const $ = (id) => document.getElementById(id);

const fmt = {
  date:     (s) => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  time:     (s) => s ? new Date(s).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : '—',
  datetime: (s) => s ? `${fmt.date(s)}, ${fmt.time(s)}` : '—',
  duration: (a, b) => {
    if (!a || !b) return '—';
    const m = Math.round((new Date(b) - new Date(a)) / 60000);
    return `${Math.floor(m/60)}h ${m%60}m`;
  },
  initials: (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?',
};

function badge(s) {
  const m = {
    Scheduled:'badge-blue', Boarding:'badge-yellow', Departed:'badge-cyan',
    Delayed:'badge-yellow', Landed:'badge-green', Cancelled:'badge-red', Finished:'badge-gray', 'In Progress':'badge-green',
    Active:'badge-green', Maintenance:'badge-yellow', Retired:'badge-gray',
    Confirmed:'badge-green', Assigned:'badge-blue', Completed:'badge-cyan', Removed:'badge-red',
    Admin:'badge-cyan', Pilot:'badge-blue', CabinCrew:'badge-green', Mechanic:'badge-yellow',
  };
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
}

function processFlights(flights) {
  const now = new Date();
  return flights.map(f => {
    if (f.status === 'Scheduled' || f.status === 'Boarding' || f.status === 'Delayed') {
      if (new Date(f.scheduled_departure) <= now) {
        f.status = 'In Progress';
      }
    }
    return f;
  });
}

let _toastTimer;
function toast(msg, type = 'success') {
  const t = $('toast');
  const icon = type === 'success' ? '✓' : '✕';
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.className = type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.className = t.className + ' hidden', 3500);
}

function showModal(html) { $('modal-container').innerHTML = html; }
function closeModal()    { $('modal-container').innerHTML = ''; }

function skeleton() {
  return `<div class="loading-rows">${Array(5).fill('<div class="skeleton-row"></div>').join('')}</div>`;
}

function empty(icon, title, sub = '') {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}
  </div>`;
}

// ─── App Controller ────────────────────────────────────────────────
const App = {
  user: null,

  async init() {
    document.addEventListener('DOMContentLoaded', async () => {
      if (api.isAuth) {
        try {
          this.user = await api.getMe();
          this._boot();
        } catch { api.logout(); return; }
      } else {
        this._showLogin();
      }
      window.addEventListener('hashchange', () => this.route());
      $('login-form').addEventListener('submit', (e) => this.handleLogin(e));
      if (api.isAuth) this.route();
    });
  },

  _showLogin() {
    $('app').classList.add('hidden');
    $('login-view').classList.remove('hidden');
  },

  _boot() {
    $('login-view').classList.add('hidden');
    $('app').classList.remove('hidden');

    // Populate user info
    $('user-name').textContent    = this.user.full_name;
    $('user-role').textContent    = this.user.role;
    $('user-avatar').textContent  = fmt.initials(this.user.full_name);

    // Admin nav items
    if (this.user.role === 'Admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }
    
    // Personnel nav items
    if (this.user.role === 'Personnel' || this.user.role === 'Admin') {
      document.querySelectorAll('.personnel-only').forEach(el => el.classList.remove('hidden'));
    }
  },

  logout() { api.logout(); },

  async handleLogin(e) {
    e.preventDefault();
    const btn = $('login-btn'); const btnTxt = $('login-btn-text');
    const err = $('login-error');
    btn.disabled = true; btnTxt.textContent = 'Signing in…'; err.classList.add('hidden');
    try {
      await api.login($('login-email').value, $('login-password').value);
      this.user = await api.getMe();
      this._boot();
      window.location.hash = '#my-flights';
      this.route();
    } catch(e) {
      err.textContent = e.message; err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btnTxt.textContent = 'Sign in';
    }
  },

  // ─── Router ─────────────────────────────────────────────────────
  async route() {
    const hash = window.location.hash || '#my-flights';
    if (!api.isAuth) { this._showLogin(); return; }
    if (hash === '#login') { window.location.hash = '#my-flights'; return; }

    document.querySelectorAll('.nav-link').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === hash)
    );

    const vc = $('view-container');
    vc.innerHTML = skeleton();
    $('header-actions').innerHTML = '';

    const views = {
      '#my-flights':     () => this.viewMyFlights(),
      '#fleet':          () => this.viewFleet(),
      '#schedule-matrix':() => this.viewScheduleMatrix(),
      '#employees':      () => this.viewEmployees(),
      '#assignments':    () => this.viewAssignments(),
      '#manage-flights': () => this.viewManageFlights(),
      '#my-profile':     () => this.viewMyProfile(),
      '#compliance':     () => this.viewCompliance(),
      '#unavailability': () => this.viewUnavailability(),
    };

    try {
      await (views[hash] || (() => { vc.innerHTML = empty('🔍', 'Page not found'); }))();
    } catch(e) {
      vc.innerHTML = `<div class="empty-state"><p style="color:#fca5a5">${e.message}</p></div>`;
    }
  },

  // ─── My Profile ──────────────────────────────────────────────────
  async viewMyProfile() {
    $('page-title').textContent = 'My Profile';
    const vc = $('view-container');
    const isCrew = ['Pilot', 'CabinCrew'].includes(this.user.role);
    const [docs, flightHours, rawFlights] = await Promise.all([
      isCrew ? api.getDocuments(this.user.id) : [],
      isCrew ? api.getFlightHours(this.user.id) : null,
      isCrew ? api.getMyFlights() : []
    ]);
    const myFlights = processFlights(rawFlights);
    const pastFlights = myFlights.filter(f => f.status === 'Finished' || f.status === 'Landed');
    
    // Check expirations
    const now = new Date();
    const expiryWarnings = docs.filter(d => {
      const exp = new Date(d.expiry_date);
      const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    vc.innerHTML = `
      ${expiryWarnings.length > 0 ? `
        <div style="background:var(--badge-red-bg);color:var(--badge-red-text);padding:1rem;border-radius:6px;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
          <span style="font-size:1.25rem">⚠️</span>
          <div>
            <strong>Action Required:</strong> You have ${expiryWarnings.length} document(s) expiring within 30 days or already expired.
          </div>
        </div>
      ` : ''}
      <div style="display:grid;gap:2rem;grid-template-columns:1fr ${isCrew?'1fr':''}">
        <div class="card" style="padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;">
          <h3 style="margin-top:0;margin-bottom:1.5rem">Personal Information</h3>
          <form id="profile-form">
            <div class="form-group"><label>Full Name</label><input id="pf-name" value="${this.user.full_name}" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="pf-email" value="${this.user.email}" required></div>
            <div class="form-group"><label>Phone Number</label><input id="pf-phone" value="${this.user.phone_number || ''}"></div>
            <div class="form-group"><label>New Password (Optional)</label><input type="password" id="pf-pass" placeholder="Leave blank to keep current"></div>
            <button type="submit" class="btn btn-primary" style="margin-top:1rem">Save Changes</button>
          </form>
        </div>
        ${isCrew ? `
        <div style="display:flex; flex-direction:column; gap:2rem;">
          <div class="card" style="padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
              <h3 style="margin:0">My Certifications</h3>
              <button class="btn btn-secondary btn-sm" onclick="App.modalAddDocument()">Add Document</button>
            </div>
          ${docs.length ? `
          <div class="table-wrap">
            <table style="font-size:0.875rem">
              <thead><tr><th>Type</th><th>Ref #</th><th>Expiry</th><th></th></tr></thead>
              <tbody>
                ${docs.map(d => {
                  const isExpiring = (new Date(d.expiry_date) - now) / (1000*60*60*24) <= 30;
                  return `<tr>
                    <td>${d.document_type}</td>
                    <td>${d.reference_number || '—'}</td>
                    <td style="${isExpiring ? 'color:#ef4444;font-weight:600' : ''}">${fmt.date(d.expiry_date)} ${isExpiring ? '⚠️' : ''}</td>
                    <td><button class="btn btn-secondary btn-sm" onclick="App.modalEditDocument(${d.id}, '${d.document_type}', '${d.reference_number || ''}', '${d.issued_date.split('T')[0]}', '${d.expiry_date.split('T')[0]}')">Edit</button></td>
                  </tr>`
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : '<p style="color:var(--text-400)">No documents on file.</p>'}
          </div>
          <div class="card" style="padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
              <h3 style="margin:0">Flight History</h3>
            </div>
            <div style="display:flex;gap:1rem;margin-bottom:1.5rem">
              <div style="background:var(--bg);padding:1rem;border-radius:6px;flex:1;text-align:center">
                <div style="font-size:0.875rem;color:var(--text-400)">Total Hours</div>
                <div style="font-size:1.5rem;font-weight:700">${flightHours.yearly}h</div>
              </div>
              <div style="background:var(--bg);padding:1rem;border-radius:6px;flex:1;text-align:center">
                <div style="font-size:0.875rem;color:var(--text-400)">This Month</div>
                <div style="font-size:1.5rem;font-weight:700">${flightHours.monthly}h</div>
              </div>
            </div>
            ${pastFlights.length ? `
            <div class="table-wrap">
              <table style="font-size:0.875rem">
                <thead><tr><th>Flight</th><th>Route</th><th>Date</th></tr></thead>
                <tbody>
                  ${pastFlights.map(f => `<tr>
                    <td><strong>${f.flight_number}</strong></td>
                    <td>${f.origin_airport.icao_code} → ${f.destination_airport.icao_code}</td>
                    <td>${fmt.date(f.actual_departure || f.scheduled_departure)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div style="color:var(--text-400);font-size:0.875rem">No past flights found.</div>'}
          </div>
        </div>` : ''}
      </div>
    `;

    $('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          full_name: $('pf-name').value,
          email: $('pf-email').value,
          phone_number: $('pf-phone').value || null,
        };
        if ($('pf-pass').value) payload.password = $('pf-pass').value;
        this.user = await api.updateOwnProfile(payload);
        toast('Profile updated successfully');
        this._boot(); // update sidebar
      } catch (err) { toast(err.message, 'error'); }
    });
  },

  // ─── My Schedule ────────────────────────────────────────────────
  async viewMyFlights() {
    $('page-title').textContent = 'My Schedule';
    let flights = processFlights(await api.getMyFlights());
    const vc = $('view-container');

    if (!flights.length) {
      vc.innerHTML = empty('🗓', 'No upcoming flights', 'You have no crew assignments scheduled.');
      return;
    }

    const upcoming = flights.filter(f => f.status === 'Scheduled').length;
    vc.innerHTML = `
      <div class="stats-row fade-in">
        <div class="stat-card">
          <div class="stat-label">Total Assignments</div>
          <div class="stat-value accent">${flights.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Upcoming</div>
          <div class="stat-value">${upcoming}</div>
        </div>
      </div>
      <div class="section-header">
        <div class="section-title">Assigned Flights</div>
      </div>
      <div class="cards-grid fade-in">
        ${flights.map(f => `
          <div class="flight-card">
            <div class="flight-card-header">
              <div>
                <div class="flight-number">${f.flight_number}</div>
                <div class="flight-date">${fmt.date(f.scheduled_departure)}</div>
              </div>
              ${badge(f.status)}
            </div>
            <div class="flight-route">
              <span class="airport">${f.origin_airport.icao_code}</span>
              <div class="route-arrow"><span>✈</span></div>
              <span class="airport">${f.destination_airport.icao_code}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-400)">
              ${f.origin_airport.city} → ${f.destination_airport.city}
            </div>
            <div class="flight-meta">
              <span>⏱ ${fmt.duration(f.scheduled_departure, f.scheduled_arrival)}</span>
              <span>🛫 ${fmt.time(f.scheduled_departure)}</span>
              <span>${f.aircraft.registration_number}</span>
            </div>
            ${f.status !== 'Completed' && f.status !== 'Cancelled' ? `
            <div style="margin-top:1rem;border-top:1px solid var(--border);padding-top:1rem;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.85rem;color:var(--text-400)">Your Status: </span>
              <button class="btn btn-primary btn-sm" onclick="App.confirmAssignmentFromFlight(${f.id})">Confirm Assignment</button>
            </div>` : ''}
          </div>
        `).join('')}
      </div>`;
  },

  async confirmAssignmentFromFlight(flightId) {
    try {
      // Find the assignment id for this flight for the current user
      const assignments = await api.getFlightCrew(flightId);
      const myAssig = assignments.find(a => a.employee.id === this.user.id);
      if (!myAssig) throw new Error("Assignment not found");
      await api.confirmAssignment(myAssig.assignment_id);
      toast('Assignment confirmed');
      this.viewMyFlights();
    } catch(e) { toast(e.message, 'error'); }
  },

  // ─── Schedule Matrix ─────────────────────────────────────────────
  async viewScheduleMatrix() {
    $('page-title').textContent = 'Daily Schedule Matrix';
    const rawFlights = await api.getAllFlights();
    const flights = processFlights(rawFlights);
    const vc = $('view-container');
    
    // Group flights by aircraft
    const aircraftMap = {};
    flights.forEach(f => {
      const ac = f.aircraft.registration_number;
      if (!aircraftMap[ac]) aircraftMap[ac] = [];
      aircraftMap[ac].push(f);
    });

    const acList = Object.keys(aircraftMap).sort();
    
    if (!acList.length) {
      vc.innerHTML = empty('📊', 'No flights scheduled', 'Matrix is empty.');
      return;
    }

    vc.innerHTML = `
      <div class="card" style="padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:800px;text-align:left;font-size:0.875rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:1rem">Aircraft</th>
              <th style="padding:1rem">Flights Schedule (Chronological)</th>
            </tr>
          </thead>
          <tbody>
            ${acList.map(ac => {
              const acFlights = aircraftMap[ac].sort((a,b) => new Date(a.scheduled_departure) - new Date(b.scheduled_departure));
              return `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:1rem;font-weight:600;width:150px"><code>${ac}</code></td>
                <td style="padding:1rem">
                  <div style="display:flex;gap:1rem;flex-wrap:wrap">
                    ${acFlights.map(f => `
                      <div style="background:var(--bg);border:1px solid var(--border);padding:0.75rem;border-radius:6px;min-width:180px">
                        <div style="font-weight:600;margin-bottom:0.25rem">${f.flight_number}</div>
                        <div style="color:var(--text-400);font-size:0.75rem;margin-bottom:0.5rem">${f.origin_airport.icao_code} → ${f.destination_airport.icao_code}</div>
                        <div style="font-size:0.75rem;margin-bottom:0.5rem">${fmt.time(f.scheduled_departure)} - ${fmt.time(f.scheduled_arrival)}</div>
                        ${badge(f.status)}
                      </div>
                    `).join('')}
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ─── Fleet & Flights ────────────────────────────────────────────
  async viewFleet() {
    $('page-title').textContent = 'Fleet & Flights';
    const isAdmin = this.user.role === 'Admin';
    if (isAdmin) {
      $('header-actions').innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="App.modalAddAircraft()">Add Aircraft</button>`;
    }

    const [fleet, rawFlights] = await Promise.all([api.getFleet(), api.getAllFlights()]);
    const flights = processFlights(rawFlights);
    const vc = $('view-container');

    vc.innerHTML = `
      <div class="stats-row fade-in">
        <div class="stat-card"><div class="stat-label">Total Aircraft</div><div class="stat-value">${fleet.length}</div></div>
        <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value accent">${fleet.filter(a=>a.status==='Active').length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Flights</div><div class="stat-value">${flights.length}</div></div>
        <div class="stat-card"><div class="stat-label">Scheduled</div><div class="stat-value">${flights.filter(f=>f.status==='Scheduled').length}</div></div>
      </div>

      <div class="section-header"><div class="section-title">Fleet</div></div>
      <div class="cards-grid fade-in" style="margin-bottom:2rem">
        ${fleet.map(a => `
          <div class="aircraft-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div class="aircraft-reg">${a.registration_number}</div>
                <div class="aircraft-model">${a.manufacturer} ${a.model}</div>
              </div>
              ${badge(a.status)}
            </div>
            <div class="aircraft-meta">💺 ${a.total_seats} seats</div>
            <div class="aircraft-footer">
              <span style="font-size:0.75rem;color:var(--text-600)">
                ${flights.filter(f=>f.aircraft?.id===a.id||f.aircraft_id===a.id).length} flight(s)
              </span>
              ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="App.modalEditAircraft(${a.id},'${a.registration_number}','${a.model}','${a.manufacturer}',${a.total_seats},'${a.status}')">Edit</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-header"><div class="section-title">All Flights</div></div>
      <div class="table-wrap fade-in">
        <table>
          <thead><tr>
            <th>Flight</th><th>Route</th><th>Aircraft</th>
            <th>Departure</th><th>Arrival</th><th>Status</th>
            ${isAdmin?'<th></th>':''}
          </tr></thead>
          <tbody>
            ${flights.length ? flights.map(f=>`
              <tr>
                <td><strong>${f.flight_number}</strong></td>
                <td>${f.origin_airport.icao_code} → ${f.destination_airport.icao_code}</td>
                <td><code>${f.aircraft.registration_number}</code></td>
                <td>${fmt.datetime(f.scheduled_departure)}</td>
                <td>${fmt.datetime(f.scheduled_arrival)}</td>
                <td>${badge(f.status)}</td>
                ${isAdmin?`<td class="row-actions"><button class="btn btn-danger btn-sm" onclick="App.cancelFlight(${f.id})">Cancel</button></td>`:''}
              </tr>`).join('') :
              `<tr><td colspan="${isAdmin?7:6}" style="text-align:center;color:var(--text-600);padding:2rem">No flights scheduled.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  },

  // ─── Staff Directory ─────────────────────────────────────────────
  async viewEmployees() {
    $('page-title').textContent = 'Staff Directory';
    $('header-actions').innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="App.modalAddEmployee()">Add Employee</button>`;
    const staff = await api.getEmployees();
    const vc = $('view-container');
    const rc = r => staff.filter(e=>e.role===r).length;

    vc.innerHTML = `
      <div class="stats-row fade-in">
        <div class="stat-card"><div class="stat-label">Total Staff</div><div class="stat-value">${staff.length}</div></div>
        <div class="stat-card"><div class="stat-label">Pilots</div><div class="stat-value accent">${rc('Pilot')}</div></div>
        <div class="stat-card"><div class="stat-label">Cabin Crew</div><div class="stat-value">${rc('CabinCrew')}</div></div>
        <div class="stat-card"><div class="stat-label">Mechanics</div><div class="stat-value">${rc('Mechanic')}</div></div>
      </div>
      <div class="table-wrap fade-in">
        <table>
          <thead><tr><th>Employee #</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${staff.map(e=>`
              <tr>
                <td><code>${e.employee_number}</code></td>
                <td style="font-weight:500">${e.full_name}</td>
                <td style="color:var(--text-400)">${e.email}</td>
                <td>${badge(e.role)}</td>
                <td>${e.is_active?badge('Active'):badge('Removed')}</td>
                <td class="row-actions">
                  ${e.is_active
                    ? `<button class="btn btn-secondary btn-sm" onclick="App.deactivateEmp(${e.id})">Deactivate</button>`
                    : `<button class="btn btn-success btn-sm" onclick="App.activateEmp(${e.id})">Activate</button>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ─── Crew Assignments ────────────────────────────────────────────
  async viewAssignments() {
    $('page-title').textContent = 'Crew Assignments';
    const flights = await api.getAllFlights();
    const vc = $('view-container');
    if (!flights.length) { vc.innerHTML = empty('📋','No flights found','Schedule a flight first.'); return; }

    vc.innerHTML = `
      <div class="section-header">
        <div class="section-title">Select a flight to manage its crew</div>
      </div>
      <div class="table-wrap fade-in">
        <table>
          <thead><tr><th>Flight</th><th>Route</th><th>Date</th><th>Aircraft</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${flights.map(f=>`
              <tr>
                <td><strong>${f.flight_number}</strong></td>
                <td>${f.origin_airport.icao_code} → ${f.destination_airport.icao_code}</td>
                <td>${fmt.datetime(f.scheduled_departure)}</td>
                <td><code>${f.aircraft.registration_number}</code></td>
                <td>${badge(f.status)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="App.viewCrewManifest(${f.id},'${f.flight_number}')">Manage Crew</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  async viewCrewManifest(flightId, flightNumber) {
    const [crew, employees] = await Promise.all([api.getFlightCrew(flightId), api.getEmployees()]);
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>Crew Manifest — ${flightNumber}</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          ${crew.length ? `
            <div class="table-wrap" style="margin-bottom:1.5rem">
              <table>
                <thead><tr><th>Name</th><th>Employee Role</th><th>Duty</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  ${crew.map(c=>`<tr>
                    <td style="font-weight:500">${c.employee.full_name}</td>
                    <td>${badge(c.employee.role)}</td>
                    <td style="color:var(--text-400)">${c.duty_role}</td>
                    <td>${badge(c.status)}</td>
                    <td class="row-actions">
                      <button class="btn btn-secondary btn-sm" onclick="App.modalReplaceCrewMember(${c.assignment_id}, ${flightId}, '${flightNumber}', '${c.employee.role}', '${c.duty_role}')">Replace</button>
                      <button class="btn btn-danger btn-sm" onclick="App.removeCrewMember(${c.assignment_id},${flightId},'${flightNumber}')">Remove</button>
                    </td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>` : `<p style="color:var(--text-600);margin-bottom:1.5rem;font-size:0.875rem">No crew assigned to this flight yet.</p>`}

          <div style="font-size:0.85rem;font-weight:600;color:var(--text-200);margin-bottom:0.75rem">Assign crew member</div>
          <form id="assign-form">
            <div class="form-row">
              <div class="form-group">
                <label>Staff member</label>
                <select id="assign-emp" required>
                  <option value="">Select staff…</option>
                  ${employees.filter(e=>e.is_active&&e.role!=='Admin').map(e=>
                    `<option value="${e.id}">${e.full_name} · ${e.role}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Duty role</label>
                <select id="assign-duty" required>
                  <option value="">Select duty…</option>
                  <option>Captain</option><option>FirstOfficer</option>
                  <option>FlightAttendant</option><option>LeadMechanic</option><option>Mechanic</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Assign</button>
            </div>
          </form>
        </div>
      </div>`);

    $('assign-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createAssignment({ flight_id: flightId, employee_id: parseInt($('assign-emp').value), duty_role: $('assign-duty').value });
        toast(`Crew assigned to ${flightNumber}`);
        closeModal();
        this.viewCrewManifest(flightId, flightNumber);
      } catch(err) { toast(err.message, 'error'); }
    });
  },

  async removeCrewMember(assignId, flightId, flightNumber) {
    if (!confirm('Remove this crew member from the flight?')) return;
    try {
      await api.deleteAssignment(assignId);
      toast('Crew member removed');
      this.viewCrewManifest(flightId, flightNumber);
    } catch(err) { toast(err.message, 'error'); }
  },

  async modalReplaceCrewMember(assignId, flightId, flightNumber, role, duty) {
    const employees = await api.getEmployees();
    
    // We can fetch docs and hours here for accurate warnings, but for speed, let's just do a simple replacement form.
    // The backend limits or a basic check can be added if needed. Let's do it simply.
    const eligible = employees.filter(e => e.is_active && e.role === role);
    
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal" style="max-width:400px">
          <div class="modal-header"><h2>Replace ${duty}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="rep-form">
            <div class="form-group"><label>Select New ${role}</label>
              <select id="rep-emp" required>
                <option value="">Select new staff…</option>
                ${eligible.map(e => `<option value="${e.id}">${e.full_name}</option>`).join('')}
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Confirm Replace</button>
            </div>
          </form>
        </div>
      </div>`);
      
    $('rep-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.replaceAssignment(assignId, { new_employee_id: parseInt($('rep-emp').value) });
        toast('Crew member replaced'); closeModal(); this.viewCrewManifest(flightId, flightNumber);
      } catch(err) { toast(err.message, 'error'); }
    });
  },

  // ─── Unavailability & Compliance ────────────────────────────────
  async viewUnavailability() {
    $('page-title').textContent = 'Manage Unavailability';
    $('header-actions').innerHTML = `<button class="btn btn-primary btn-sm" onclick="App.modalAddUnavailability()">Add Unavailability</button>`;
    const [unavail, employees] = await Promise.all([api.getUnavailability(), api.getEmployees()]);
    const empMap = {}; employees.forEach(e => empMap[e.id] = e);
    
    const vc = $('view-container');
    vc.innerHTML = `
      <div class="table-wrap fade-in">
        <table>
          <thead><tr><th>Employee</th><th>Start Date</th><th>End Date</th><th>Reason</th><th></th></tr></thead>
          <tbody>
            ${unavail.length ? unavail.map(u => `
              <tr>
                <td><strong>${empMap[u.employee_id]?.full_name || 'Unknown'}</strong></td>
                <td>${fmt.date(u.start_date)}</td>
                <td>${fmt.date(u.end_date)}</td>
                <td>${u.reason || '—'}</td>
                <td class="row-actions"><button class="btn btn-danger btn-sm" onclick="App.deleteUnavailability(${u.id})">Delete</button></td>
              </tr>`).join('') :
              `<tr><td colspan="5" style="text-align:center;color:var(--text-600);padding:2rem">No unavailability records found.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  },

  async deleteUnavailability(id) {
    if (!confirm('Delete this record?')) return;
    try { await api.deleteUnavailability(id); toast('Deleted'); this.viewUnavailability(); }
    catch(err) { toast(err.message, 'error'); }
  },

  async viewCompliance() {
    $('page-title').textContent = 'Compliance & Hours';
    const employees = (await api.getEmployees()).filter(e => ['Pilot', 'CabinCrew'].includes(e.role));
    const vc = $('view-container');
    vc.innerHTML = skeleton();
    
    // Fetch hours for all crew
    const hoursData = await Promise.all(employees.map(e => api.getFlightHours(e.id).catch(() => ({daily:0,weekly:0,monthly:0,yearly:0}))));
    // Fetch docs for all crew
    const docsData = await Promise.all(employees.map(e => api.getDocuments(e.id).catch(() => [])));
    
    const now = new Date();
    
    vc.innerHTML = `
      <div class="table-wrap fade-in">
        <table style="font-size:0.85rem">
          <thead><tr><th>Employee</th><th>Role</th><th>Daily</th><th>Weekly</th><th>Monthly</th><th>Yearly</th><th>Documents</th></tr></thead>
          <tbody>
            ${employees.map((e, i) => {
              const h = hoursData[i];
              const docs = docsData[i];
              const expDocs = docs.filter(d => (new Date(d.expiry_date) - now) / (1000*60*60*24) <= 30);
              const isP = e.role === 'Pilot';
              // Check limits (example: Pilot 8 daily, 30 weekly, 100 monthly, 1000 yearly. Crew: 900 yearly)
              const maxD=8, maxW=30, maxM=100, maxY=isP?1000:900;
              const warn = h.daily>=maxD||h.weekly>=maxW||h.monthly>=maxM||h.yearly>=maxY;
              
              return `<tr>
                <td style="font-weight:600">${e.full_name}</td>
                <td>${badge(e.role)}</td>
                <td style="${h.daily>=maxD?'color:#ef4444;font-weight:bold':''}"><span title="Max ${maxD}">${h.daily}h</span></td>
                <td style="${h.weekly>=maxW?'color:#ef4444;font-weight:bold':''}"><span title="Max ${maxW}">${h.weekly}h</span></td>
                <td style="${h.monthly>=maxM?'color:#ef4444;font-weight:bold':''}"><span title="Max ${maxM}">${h.monthly}h</span></td>
                <td style="${h.yearly>=maxY?'color:#ef4444;font-weight:bold':''}"><span title="Max ${maxY}">${h.yearly}h</span></td>
                <td>${expDocs.length ? `<span style="color:#ef4444;font-weight:bold">⚠️ ${expDocs.length} Expiring</span>` : `<span style="color:#10b981">✓ OK</span>`}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ─── Manage Flights ──────────────────────────────────────────────
  async viewManageFlights() {
    $('page-title').textContent = 'Manage Flights';
    $('header-actions').innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="App.modalAddAirport()">Add Airport</button>
      <button class="btn btn-primary btn-sm" onclick="App.modalScheduleFlight()">Schedule Flight</button>`;
    const flights = processFlights(await api.getAllFlights());
    const vc = $('view-container');

    vc.innerHTML = `
      <div class="table-wrap fade-in">
        <table>
          <thead><tr>
            <th>Flight</th><th>Route</th><th>Aircraft</th>
            <th>Departure</th><th>Arrival</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            ${flights.length ? flights.map(f=>`
              <tr>
                <td><strong>${f.flight_number}</strong></td>
                <td>${f.origin_airport.icao_code} → ${f.destination_airport.icao_code}</td>
                <td><code>${f.aircraft.registration_number}</code></td>
                <td>${fmt.datetime(f.scheduled_departure)}</td>
                <td>${fmt.datetime(f.scheduled_arrival)}</td>
                <td>${badge(f.status)}</td>
                <td class="row-actions">
                  <button class="btn btn-secondary btn-sm" onclick="App.modalUpdateStatus(${f.id},'${f.flight_number}','${f.status}')">Status</button>
                  ${(f.status !== 'Finished' && f.status !== 'Cancelled') ? `<button class="btn btn-success btn-sm" onclick="App.modalCompleteFlight(${f.id},'${f.flight_number}')">Complete</button>` : ''}
                  <button class="btn btn-danger btn-sm" onclick="App.cancelFlight(${f.id})">Cancel</button>
                </td>
              </tr>`).join('') :
              `<tr><td colspan="7" style="text-align:center;color:var(--text-600);padding:2rem">No flights found.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  },

  // ─── Modals ──────────────────────────────────────────────────────
  modalAddEmployee() {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Add Employee</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="emp-form">
            <div class="form-row">
              <div class="form-group"><label>Employee Number</label><input id="e-num" placeholder="PLT-003" required></div>
              <div class="form-group"><label>Full Name</label><input id="e-name" placeholder="Jane Smith" required></div>
            </div>
            <div class="form-group"><label>Email Address</label><input type="email" id="e-email" placeholder="jane@fams.local" required></div>
            <div class="form-row">
              <div class="form-group">
                <label>Role</label>
                <select id="e-role" required>
                  <option value="">Select…</option>
                  <option>Pilot</option><option>CabinCrew</option><option>Mechanic</option><option>Admin</option>
                </select>
              </div>
              <div class="form-group"><label>Password</label><input type="password" id="e-pass" minlength="6" placeholder="Min 6 characters" required></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Employee</button>
            </div>
          </form>
        </div>
      </div>`);
    $('emp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createEmployee({ employee_number:$('e-num').value, full_name:$('e-name').value, email:$('e-email').value, role:$('e-role').value, password:$('e-pass').value });
        toast('Employee created'); closeModal(); this.viewEmployees();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  modalAddAircraft() {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Add Aircraft</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="ac-form">
            <div class="form-row">
              <div class="form-group"><label>Registration</label><input id="ac-reg" placeholder="D-AIFA" required></div>
              <div class="form-group"><label>Year</label><input type="number" id="ac-yr" placeholder="2019" min="1960" max="2030"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Manufacturer</label><input id="ac-mfr" placeholder="Airbus" required></div>
              <div class="form-group"><label>Model</label><input id="ac-mdl" placeholder="A320-200" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Seats</label><input type="number" id="ac-seats" placeholder="180" min="1" required></div>
              <div class="form-group"><label>Status</label><select id="ac-status"><option>Active</option><option>Maintenance</option><option>Retired</option></select></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Add to Fleet</button>
            </div>
          </form>
        </div>
      </div>`);
    $('ac-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createAircraft({ registration_number:$('ac-reg').value, manufacturer:$('ac-mfr').value, model:$('ac-mdl').value, total_seats:parseInt($('ac-seats').value), year_manufactured:$('ac-yr').value?parseInt($('ac-yr').value):null, status:$('ac-status').value });
        toast('Aircraft added'); closeModal(); this.viewFleet();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  modalEditAircraft(id, reg, model, mfr, seats, status) {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Edit ${reg}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="eac-form">
            <div class="form-row">
              <div class="form-group"><label>Model</label><input id="eac-mdl" value="${model}" required></div>
              <div class="form-group"><label>Manufacturer</label><input id="eac-mfr" value="${mfr}" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Seats</label><input type="number" id="eac-seats" value="${seats}" min="1" required></div>
              <div class="form-group"><label>Status</label><select id="eac-status">
                <option ${status==='Active'?'selected':''}>Active</option>
                <option ${status==='Maintenance'?'selected':''}>Maintenance</option>
                <option ${status==='Retired'?'selected':''}>Retired</option>
              </select></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>`);
    $('eac-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.updateAircraft(id,{model:$('eac-mdl').value,manufacturer:$('eac-mfr').value,total_seats:parseInt($('eac-seats').value),status:$('eac-status').value});
        toast('Aircraft updated'); closeModal(); this.viewFleet();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  async modalAddAirport() {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Add Airport</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="ap-form">
            <div class="form-row">
              <div class="form-group"><label>ICAO Code</label><input id="ap-icao" placeholder="KJFK" required maxlength="4" minlength="4"></div>
              <div class="form-group"><label>Name</label><input id="ap-name" placeholder="John F. Kennedy International" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>City</label><input id="ap-city" placeholder="New York" required></div>
              <div class="form-group"><label>Country</label><input id="ap-country" placeholder="USA" required></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Airport</button>
            </div>
          </form>
        </div>
      </div>`);
    $('ap-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createAirport({ 
          icao_code: $('ap-icao').value.toUpperCase(),
          name: $('ap-name').value,
          city: $('ap-city').value,
          country: $('ap-country').value
        });
        toast('Airport added'); closeModal();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  async modalCompleteFlight(id, num) {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal" style="max-width:400px">
          <div class="modal-header"><h2>Complete ${num}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="comp-form">
            <div class="form-row">
              <div class="form-group"><label>Actual Departure</label><input type="datetime-local" id="comp-dep" required></div>
              <div class="form-group"><label>Actual Arrival</label><input type="datetime-local" id="comp-arr" required></div>
            </div>
            <div class="form-group"><label>Remaining Fuel</label><input type="number" step="0.1" id="comp-fuel" placeholder="e.g. 5200.5" required></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-success">Complete</button>
            </div>
          </form>
        </div>
      </div>`);
    $('comp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.completeFlight(id, { 
          actual_departure: new Date($('comp-dep').value).toISOString(),
          actual_arrival: new Date($('comp-arr').value).toISOString(),
          remaining_fuel: parseFloat($('comp-fuel').value)
        });
        toast('Flight completed'); closeModal(); this.route();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  async modalScheduleFlight() {
    const [fleet, airports] = await Promise.all([api.getFleet(), api.getAirports()]);
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Schedule Flight</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="fl-form">
            <div class="form-row">
              <div class="form-group"><label>Flight Number</label><input id="fl-num" placeholder="FA205" required></div>
              <div class="form-group"><label>Aircraft</label>
                <select id="fl-ac" required>
                  <option value="">Select…</option>
                  ${fleet.filter(a=>a.status==='Active').map(a=>`<option value="${a.id}">${a.registration_number} · ${a.model}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Origin</label>
                <select id="fl-origin" required>
                  <option value="">Select…</option>
                  ${airports.map(a=>`<option value="${a.icao_code}">${a.icao_code} - ${a.city}</option>`).join('')}
                </select>
              </div>
              <div class="form-group"><label>Destination</label>
                <select id="fl-dest" required>
                  <option value="">Select…</option>
                  ${airports.map(a=>`<option value="${a.icao_code}">${a.icao_code} - ${a.city}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Departure</label><input type="datetime-local" id="fl-dep" required></div>
              <div class="form-group"><label>Arrival</label><input type="datetime-local" id="fl-arr" required></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Schedule</button>
            </div>
          </form>
        </div>
      </div>`);
    $('fl-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const flight = await api.createFlight({
          flight_number: $('fl-num').value,
          aircraft_id: parseInt($('fl-ac').value),
          origin_airport_id: $('fl-origin').value,
          destination_airport_id: $('fl-dest').value,
          scheduled_departure: new Date($('fl-dep').value).toISOString(),
          scheduled_arrival: new Date($('fl-arr').value).toISOString()
        });
        toast('Flight scheduled'); 
        closeModal(); 
        this.viewManageFlights();
        this.modalAssignCrew(flight.id);
      } catch(err) { toast(err.message,'error'); }
    });
  },

  modalUpdateStatus(id, num, current) {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal" style="max-width:340px">
          <div class="modal-header"><h2>Update ${num}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="st-form">
            <div class="form-group"><label>New Status</label>
              <select id="st-val" required>
                ${['Scheduled','Boarding','Departed','Delayed','Landed','Cancelled'].map(s=>`<option ${s===current?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>`);
    $('st-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const newStatus = $('st-val').value;
        if (['Boarding', 'Departed'].includes(newStatus)) {
          const crew = await api.getFlightCrew(id);
          const hasPilot = crew.some(c => c.employee.role === 'Pilot');
          if (!hasPilot) {
            toast('Cannot proceed: Minimum 1 Pilot is required on this flight.', 'error');
            return;
          }
        }
        await api.updateFlight(id,{status:newStatus});
        toast('Status updated'); closeModal(); this.viewManageFlights();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  modalAddDocument() {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Add Document</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="doc-form">
            <div class="form-row">
              <div class="form-group"><label>Document Type</label>
                <select id="doc-type" required>
                  <option value="">Select...</option>
                  <option value="FlightLicense">Flight License</option>
                  <option value="HealthCertificate">Health Certificate</option>
                  <option value="TypeRating">Type Rating</option>
                  <option value="MedicalClass1">Medical Class 1</option>
                  <option value="MedicalClass2">Medical Class 2</option>
                </select>
              </div>
              <div class="form-group"><label>Reference Number</label><input id="doc-ref" placeholder="OPTIONAL"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Issued Date</label><input type="date" id="doc-iss" required></div>
              <div class="form-group"><label>Expiry Date</label><input type="date" id="doc-exp" required></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Document</button>
            </div>
          </form>
        </div>
      </div>`);
    $('doc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createDocument({ document_type:$('doc-type').value, reference_number:$('doc-ref').value || null, issued_date:$('doc-iss').value, expiry_date:$('doc-exp').value });
        toast('Document added'); closeModal(); this.viewMyProfile();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  modalEditDocument(id, type, ref, iss, exp) {
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Edit Document</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="edoc-form">
            <div class="form-row">
              <div class="form-group"><label>Reference Number</label><input id="edoc-ref" value="${ref}"></div>
              <div class="form-group"><label>Expiry Date</label><input type="date" id="edoc-exp" value="${exp}" required></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>`);
    $('edoc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.updateDocument(id, { reference_number:$('edoc-ref').value || null, expiry_date:$('edoc-exp').value });
        toast('Document updated'); closeModal(); this.viewMyProfile();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  async modalAddUnavailability() {
    const employees = await api.getEmployees();
    showModal(`
      <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
          <div class="modal-header"><h2>Add Unavailability</h2><button class="modal-close" onclick="closeModal()">×</button></div>
          <form id="un-form">
            <div class="form-group"><label>Employee</label>
              <select id="un-emp" required>
                <option value="">Select…</option>
                ${employees.filter(e=>e.is_active).map(e=>`<option value="${e.id}">${e.full_name} (${e.role})</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Start Date</label><input type="date" id="un-start" required></div>
              <div class="form-group"><label>End Date</label><input type="date" id="un-end" required></div>
            </div>
            <div class="form-group"><label>Reason</label><input id="un-reason" placeholder="Sick leave, Vacation, etc." required></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Record</button>
            </div>
          </form>
        </div>
      </div>`);
    $('un-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createUnavailability({ employee_id:parseInt($('un-emp').value), start_date:$('un-start').value, end_date:$('un-end').value, reason:$('un-reason').value });
        toast('Unavailability added'); closeModal(); this.viewUnavailability();
      } catch(err) { toast(err.message,'error'); }
    });
  },

  // ─── Quick actions ───────────────────────────────────────────────
  async cancelFlight(id) {
    if (!confirm('Cancel this flight? This action cannot be undone.')) return;
    try { await api.cancelFlight(id); toast('Flight cancelled'); this.viewFleet(); }
    catch(err) { toast(err.message,'error'); }
  },
  async activateEmp(id) {
    try { await api.activateEmployee(id); toast('Employee activated'); this.viewEmployees(); }
    catch(err) { toast(err.message,'error'); }
  },
  async deactivateEmp(id) {
    if (!confirm('Deactivate this employee? They will lose system access.')) return;
    try { await api.deactivateEmployee(id); toast('Employee deactivated'); this.viewEmployees(); }
    catch(err) { toast(err.message,'error'); }
  },
};

App.init();

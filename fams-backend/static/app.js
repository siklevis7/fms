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
    Delayed:'badge-yellow', Landed:'badge-green', Cancelled:'badge-red',
    Active:'badge-green', Maintenance:'badge-yellow', Retired:'badge-gray',
    Confirmed:'badge-green', Assigned:'badge-blue', Completed:'badge-cyan', Removed:'badge-red',
    Admin:'badge-cyan', Pilot:'badge-blue', CabinCrew:'badge-green', Mechanic:'badge-yellow',
  };
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
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
      '#employees':      () => this.viewEmployees(),
      '#assignments':    () => this.viewAssignments(),
      '#manage-flights': () => this.viewManageFlights(),
    };

    try {
      await (views[hash] || (() => { vc.innerHTML = empty('🔍', 'Page not found'); }))();
    } catch(e) {
      vc.innerHTML = `<div class="empty-state"><p style="color:#fca5a5">${e.message}</p></div>`;
    }
  },

  // ─── My Schedule ────────────────────────────────────────────────
  async viewMyFlights() {
    $('page-title').textContent = 'My Schedule';
    const flights = await api.getMyFlights();
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
              <span class="airport">${f.route.origin_code}</span>
              <div class="route-arrow"><span>✈</span></div>
              <span class="airport">${f.route.destination_code}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-400)">
              ${f.route.origin_airport.city} → ${f.route.destination_airport.city}
            </div>
            <div class="flight-meta">
              <span>⏱ ${fmt.duration(f.scheduled_departure, f.scheduled_arrival)}</span>
              <span>🛫 ${fmt.time(f.scheduled_departure)}</span>
              <span>${f.aircraft.registration_number}</span>
            </div>
          </div>
        `).join('')}
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

    const [fleet, flights] = await Promise.all([api.getFleet(), api.getAllFlights()]);
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
                <td>${f.route.origin_code} → ${f.route.destination_code}</td>
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
                <td>${f.route.origin_code} → ${f.route.destination_code}</td>
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
                    <td><button class="btn btn-danger btn-sm" onclick="App.removeCrewMember(${c.assignment_id},${flightId},'${flightNumber}')">Remove</button></td>
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

  // ─── Manage Flights ──────────────────────────────────────────────
  async viewManageFlights() {
    $('page-title').textContent = 'Manage Flights';
    $('header-actions').innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="App.modalScheduleFlight()">Schedule Flight</button>`;
    const flights = await api.getAllFlights();
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
                <td>${f.route.origin_code} → ${f.route.destination_code}</td>
                <td><code>${f.aircraft.registration_number}</code></td>
                <td>${fmt.datetime(f.scheduled_departure)}</td>
                <td>${fmt.datetime(f.scheduled_arrival)}</td>
                <td>${badge(f.status)}</td>
                <td class="row-actions">
                  <button class="btn btn-secondary btn-sm" onclick="App.modalUpdateStatus(${f.id},'${f.flight_number}','${f.status}')">Update</button>
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

  async modalScheduleFlight() {
    const [fleet, routes] = await Promise.all([api.getFleet(), api.getRoutes()]);
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
            <div class="form-group"><label>Route</label>
              <select id="fl-rt" required>
                <option value="">Select…</option>
                ${routes.map(r=>`<option value="${r.id}">${r.origin_code} → ${r.destination_code} (${r.distance_km} km)</option>`).join('')}
              </select>
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
        await api.createFlight({flight_number:$('fl-num').value,aircraft_id:parseInt($('fl-ac').value),route_id:parseInt($('fl-rt').value),scheduled_departure:new Date($('fl-dep').value).toISOString(),scheduled_arrival:new Date($('fl-arr').value).toISOString()});
        toast('Flight scheduled'); closeModal(); this.viewManageFlights();
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
        await api.updateFlight(id,{status:$('st-val').value});
        toast('Status updated'); closeModal(); this.viewManageFlights();
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

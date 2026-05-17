/* ═══════════════════════════════════════════════════════════
   EduPortal — public/developer.js  (updated)
   Developer control panel: list, edit, delete schools.
   ═══════════════════════════════════════════════════════════ */

let developerKey   = null;
let allSchools     = [];         // cache for client-side filtering
let confirmAction  = null;       // pending confirm callback

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const stored = localStorage.getItem('developerKey');
    if (stored) {
        developerKey = stored;
        showDashboard();
        loadStats();
        loadSchools();
    }
});

/* ════════════════════════════════════════════════════════════
   AUTHENTICATION
   ════════════════════════════════════════════════════════════ */
function authenticateDeveloper() {
    const key = document.getElementById('developerKey').value.trim();
    if (!key) { showAlert('authAlert', 'error', 'Please enter your developer key'); return; }

    developerKey = key;
    localStorage.setItem('developerKey', key);

    fetch('/api/developer/stats/overview', { headers: { 'X-Developer-Key': developerKey } })
        .then(res => {
            if (res.status === 403) {
                developerKey = null;
                localStorage.removeItem('developerKey');
                showAlert('authAlert', 'error', 'Invalid developer key');
                throw new Error('Invalid key');
            }
            return res.json();
        })
        .then(() => {
            showAlert('authAlert', 'success', 'Authentication successful!');
            setTimeout(() => { showDashboard(); loadStats(); loadSchools(); }, 500);
        })
        .catch(err => {
            if (err.message !== 'Invalid key')
                showAlert('authAlert', 'error', 'Connection error: ' + err.message);
        });
}

function logout() {
    developerKey = null;
    localStorage.removeItem('developerKey');
    document.getElementById('authSection').style.display   = 'block';
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('developerKey').value = '';
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════ */
function showDashboard() {
    document.getElementById('authSection').style.display   = 'none';
    document.getElementById('mainDashboard').style.display = 'block';
}

function loadStats() {
    fetch('/api/developer/stats/overview', { headers: { 'X-Developer-Key': developerKey } })
        .then(r => r.json())
        .then(d => {
            document.getElementById('statSchools').textContent  = d.totalSchools  ?? '—';
            document.getElementById('statStudents').textContent = d.totalStudents ?? '—';
            document.getElementById('statTeachers').textContent = d.totalTeachers ?? '—';
            document.getElementById('statExams').textContent    = d.totalExams    ?? '—';
        })
        .catch(err => console.error('Stats error:', err));
}

/* ════════════════════════════════════════════════════════════
   SCHOOL REGISTRATION
   ════════════════════════════════════════════════════════════ */
function registerSchool() {
    const schoolData = {
        name:          document.getElementById('schoolName').value.trim(),
        email:         document.getElementById('schoolEmail').value.trim(),
        phone:         document.getElementById('schoolPhone').value.trim(),
        address:       document.getElementById('schoolAddress').value.trim(),
        city:          document.getElementById('schoolCity').value.trim(),
        principalName: document.getElementById('principalName').value.trim(),
        adminUsername: document.getElementById('adminUsername').value.trim(),
        adminPassword: document.getElementById('adminPassword').value.trim(),
    };

    const missing = Object.values(schoolData).some(v => !v);
    if (missing)                             { showAlert('registerAlert', 'error', 'All fields are required'); return; }
    if (schoolData.adminPassword.length < 6) { showAlert('registerAlert', 'error', 'Password must be at least 6 characters'); return; }

    const btn = event.target;
    btn.disabled    = true;
    btn.textContent = 'Registering…';

    fetch('/api/developer/school/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Developer-Key': developerKey },
        body: JSON.stringify(schoolData)
    })
        .then(r => r.json())
        .then(d => {
            if (d.error) { showAlert('registerAlert', 'error', d.error); return; }
            showAlert('registerAlert', 'success', '✓ School registered successfully!');
            ['schoolName','schoolEmail','schoolPhone','schoolAddress','schoolCity',
             'principalName','adminUsername','adminPassword'].forEach(id => {
                document.getElementById(id).value = '';
            });
            setTimeout(() => { loadSchools(); loadStats(); }, 800);
        })
        .catch(err => showAlert('registerAlert', 'error', 'Error: ' + err.message))
        .finally(() => { btn.disabled = false; btn.textContent = 'Register School'; });
}

/* ════════════════════════════════════════════════════════════
   SCHOOLS LIST
   ════════════════════════════════════════════════════════════ */
function loadSchools() {
    document.getElementById('schoolsContainer').innerHTML =
        '<div class="empty-state"><div class="icon">⏳</div><p>Loading schools…</p></div>';

    fetch('/api/developer/schools', { headers: { 'X-Developer-Key': developerKey } })
        .then(r => r.json())
        .then(d => {
            allSchools = d.schools || [];
            renderSchoolsTable(allSchools);
        })
        .catch(err => {
            document.getElementById('schoolsContainer').innerHTML =
                `<div class="empty-state" style="color:#dc3545;">
                    <div class="icon">❌</div><p>Error loading schools: ${err.message}</p>
                 </div>`;
        });
}

function filterSchools() {
    const q = document.getElementById('schoolSearch').value.toLowerCase();
    if (!q) { renderSchoolsTable(allSchools); return; }
    const filtered = allSchools.filter(s =>
        (s.name          || '').toLowerCase().includes(q) ||
        (s.principalName || '').toLowerCase().includes(q) ||
        (s.email         || '').toLowerCase().includes(q) ||
        (s.phone         || '').toLowerCase().includes(q) ||
        (s.address       || '').toLowerCase().includes(q) ||
        (s.city          || '').toLowerCase().includes(q)
    );
    renderSchoolsTable(filtered);
}

function renderSchoolsTable(schools) {
    const container = document.getElementById('schoolsContainer');

    if (!schools || schools.length === 0) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">🏫</div><p>No schools found.</p></div>';
        return;
    }

    let html = `
    <div class="table-wrapper">
      <table class="schools-table">
        <thead>
          <tr>
            <th>#</th>
            <th>School Name</th>
            <th>Principal</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Date Registered</th>
            <th>Students</th>
            <th>Teachers</th>
            <th>Exams</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>`;

    schools.forEach((school, idx) => {
        const regDate = school.createdAt
            ? new Date(school.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
            : '—';
        const address = [school.address, school.city].filter(Boolean).join(', ') || '—';

        html += `
          <tr>
            <td style="color:var(--text-muted);font-size:12px;">${idx + 1}</td>
            <td>
              <div class="school-name">${esc(school.name)}</div>
              <div class="school-meta">@${esc(school.adminUsername)}</div>
            </td>
            <td>${esc(school.principalName || '—')}</td>
            <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(address)}">${esc(address)}</td>
            <td style="white-space:nowrap;">${esc(school.phone || '—')}</td>
            <td style="white-space:nowrap;">${esc(school.email || '—')}</td>
            <td style="white-space:nowrap;">${regDate}</td>
              <td><span class="badge badge-blue">${school.stats?.students ?? school.students ?? 0}</span></td>
              <td><span class="badge badge-green">${school.stats?.teachers ?? school.teachers ?? 0}</span></td>
              <td><span class="badge badge-yellow">${school.stats?.exams ?? school.exams ?? 0}</span></td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-warning btn-sm" onclick="openEditModal('${school._id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm"  onclick="confirmDeleteSchool('${school._id}', '${esc(school.name)}')">🗑️ Delete</button>
              </div>
            </td>
          </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

/* ════════════════════════════════════════════════════════════
   EDIT SCHOOL
   ════════════════════════════════════════════════════════════ */
function openEditModal(schoolId) {
    fetch(`/api/developer/school/${schoolId}`, { headers: { 'X-Developer-Key': developerKey } })
        .then(r => r.json())
        .then(d => {
            if (d.error) { alert('Error: ' + d.error); return; }
            const s = d.school;
            document.getElementById('editSchoolId').value   = s._id;
            document.getElementById('editName').value        = s.name          || '';
            document.getElementById('editEmail').value       = s.email         || '';
            document.getElementById('editPhone').value       = s.phone         || '';
            document.getElementById('editCity').value        = s.city          || '';
            document.getElementById('editAddress').value     = s.address       || '';
            document.getElementById('editPrincipal').value   = s.principalName || '';
            document.getElementById('editAdminUsername').value = s.adminUsername || '';
            document.getElementById('editAdminPassword').value = '';
            hideAlert('editAlert');
            document.getElementById('editModal').classList.add('active');
        })
        .catch(err => alert('Failed to load school: ' + err.message));
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function saveSchoolEdit() {
    const id  = document.getElementById('editSchoolId').value;
    const pwd = document.getElementById('editAdminPassword').value.trim();

    const payload = {
        name:          document.getElementById('editName').value.trim(),
        email:         document.getElementById('editEmail').value.trim(),
        phone:         document.getElementById('editPhone').value.trim(),
        city:          document.getElementById('editCity').value.trim(),
        address:       document.getElementById('editAddress').value.trim(),
        principalName: document.getElementById('editPrincipal').value.trim(),
        adminUsername: document.getElementById('editAdminUsername').value.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.city ||
        !payload.address || !payload.principalName || !payload.adminUsername) {
        showAlert('editAlert', 'error', 'All fields except password are required.');
        return;
    }

    if (pwd) {
        if (pwd.length < 6) { showAlert('editAlert', 'error', 'New password must be at least 6 characters.'); return; }
        payload.adminPassword = pwd;
    }

    const btn = document.querySelector('#editModal .btn-success');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    fetch(`/api/developer/school/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Developer-Key': developerKey },
        body: JSON.stringify(payload)
    })
        .then(r => r.json())
        .then(d => {
            if (d.error) { showAlert('editAlert', 'error', d.error); return; }
            showAlert('editAlert', 'success', '✓ School updated successfully!');
            setTimeout(() => { closeEditModal(); loadSchools(); loadStats(); }, 800);
        })
        .catch(err => showAlert('editAlert', 'error', 'Error: ' + err.message))
        .finally(() => { btn.disabled = false; btn.textContent = '💾 Save Changes'; });
}

/* ════════════════════════════════════════════════════════════
   DELETE (DEACTIVATE) SCHOOL
   ════════════════════════════════════════════════════════════ */
function confirmDeleteSchool(schoolId, schoolName) {
    document.getElementById('confirmIcon').textContent    = '⚠️';
    document.getElementById('confirmTitle').textContent   = 'Deactivate School?';
    document.getElementById('confirmMessage').textContent =
        `"${schoolName}" will be deactivated and hidden from all listings. This action cannot be undone.`;
    document.getElementById('confirmBtn').className       = 'btn btn-danger';
    document.getElementById('confirmBtn').textContent     = 'Yes, Deactivate';
    confirmAction = () => deleteSchool(schoolId, schoolName);
    document.getElementById('confirmModal').classList.add('active');
}

function deleteSchool(schoolId, schoolName) {
    fetch(`/api/developer/school/${schoolId}`, {
        method: 'DELETE',
        headers: { 'X-Developer-Key': developerKey }
    })
        .then(r => r.json())
        .then(d => {
            closeConfirm();
            if (d.error) { alert('Error: ' + d.error); return; }
            loadSchools();
            loadStats();
        })
        .catch(err => { closeConfirm(); alert('Error: ' + err.message); });
}

/* ════════════════════════════════════════════════════════════
   CONFIRM MODAL HELPERS
   ════════════════════════════════════════════════════════════ */
function closeConfirm() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmAction = null;
}

function executeConfirm() {
    if (typeof confirmAction === 'function') confirmAction();
}

// Close modals on overlay click
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});
document.getElementById('confirmModal').addEventListener('click', function(e) {
    if (e.target === this) closeConfirm();
});

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */
function showAlert(id, type, msg) {
    const el  = document.getElementById(id);
    el.className = `alert alert-${type} show`;
    el.textContent = msg;
    if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

function hideAlert(id) {
    document.getElementById(id).classList.remove('show');
}

function esc(str) {
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

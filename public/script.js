/* ═══════════════════════════════════════════════════════════
   EduPortal — script.js  (Definitive Edition)
   All data through MongoDB API. Zero localStorage for data.
   Fixes: Result.find circular dep, exam display, test scores,
          admin compound results view.
   ═══════════════════════════════════════════════════════════ */

/* ═══ API LAYER ═══════════════════════════════════════════ */
var API_BASE = '/api';
var Api = {
  token: function () { return localStorage.getItem('edu_token') || ''; },
  req: async function (method, path, body) {
    var opts = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Api.token()
      }
    };
    if (body) opts.body = JSON.stringify(body);
    var res;
    try { res = await fetch(API_BASE + path, opts); }
    catch (e) { throw new Error('Cannot reach server. Is "node server.js" running?'); }
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed (' + res.status + ')');
    return data;
  },
  get: function (p) { return Api.req('GET', p); },
  post: function (p, b) { return Api.req('POST', p, b); },
  put: function (p, b) { return Api.req('PUT', p, b); },
  delete: function (p) { return Api.req('DELETE', p); }
};

/* ═══ SESSION ══════════════════════════════════════════════ */
var Session = {
  get: function () { try { return JSON.parse(localStorage.getItem('edu_session')); } catch (e) { return null; } },
  set: function (d) { localStorage.setItem('edu_session', JSON.stringify(d)); },
  clear: function () { localStorage.removeItem('edu_session'); localStorage.removeItem('edu_token'); }
};

/* ═══ SUBJECTS LIST ════════════════════════════════════════ */
var SUBJECTS = [
  { name: 'Mathematics', icon: '🔢', dept: 'SCIENCE', desc: 'The study of numbers, algebra, geometry, calculus, and problem-solving. Mathematics develops logical thinking and analytical skills essential for scientific and technical fields.' },
  { name: 'English Language', icon: '📖', dept: 'ART', desc: 'English grammar, literature, composition, and communication. This subject enhances writing, reading, speaking, and listening skills crucial for effective communication.' },
  { name: 'Biology', icon: '🧬', dept: 'SCIENCE', desc: 'The study of living organisms, cells, genetics, evolution, and ecology. Biology explores how life functions at cellular and environmental levels.' },
  { name: 'Chemistry', icon: '⚗️', dept: 'SCIENCE', desc: 'The study of matter, reactions, elements, and compounds. Chemistry reveals how substances interact and transform, fundamental to understanding the physical world.' },
  { name: 'Physics', icon: '⚡', dept: 'SCIENCE', desc: 'The study of motion, forces, energy, waves, and light. Physics explains natural phenomena and is the foundation for engineering and technology.' },
  { name: 'Geography', icon: '🌍', dept: 'ART', desc: 'The study of physical features, climate, human societies, and cultures. Geography connects human and environmental systems across the globe.' },
  { name: 'History', icon: '📜', dept: 'ART', desc: 'The study of past events, civilizations, and human development. History helps us understand how societies evolved and shaped the modern world.' },
  { name: 'Economics', icon: '📈', dept: 'COMMERCIAL', desc: 'The study of production, consumption, and resource management. Economics explains how markets function and how societies allocate resources.' },
  { name: 'Government', icon: '🏛️', dept: 'ART', desc: 'The study of political systems, laws, and governance. Government explores how societies organize power and make decisions affecting citizens.' },
  { name: 'Literature', icon: '📚', dept: 'ART', desc: 'The study of written works, poetry, drama, and prose. Literature develops critical thinking and appreciation for human expression and culture.' },
  { name: 'Agricultural Science', icon: '🌱', dept: 'SCIENCE', desc: 'The study of farming, crops, soil, and livestock. Agricultural Science applies scientific methods to food production and sustainable agriculture.' },
  { name: 'Computer Science', icon: '💻', dept: 'SCIENCE', desc: 'The study of computing, programming, algorithms, and digital systems. Computer Science is essential for the digital age and modern technology.' }
];

/* ═══ UTILS ════════════════════════════════════════════════ */
function $(id) { return document.getElementById(id); }
function getVal(id) { var e = $(id); return e ? e.value : ''; }
function setVal(id, v) { var e = $(id); if (e) e.value = v; }
function setText(id, v) { var e = $(id); if (e) e.textContent = v; }
function showError(el, m) { if (el) { el.textContent = m; el.classList.add('show'); } }
function hideError(el) { if (el) { el.textContent = ''; el.classList.remove('show'); } }
function showSuccess(el, m) { if (el) { el.textContent = m; el.classList.add('show'); } }
function hideSuccess(el) { if (el) { el.textContent = ''; el.classList.remove('show'); } }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString() : '—'; }
function loadingHTML(msg) { return '<div class="empty-state"><span class="empty-icon">⏳</span>' + msg + '</div>'; }
function emptyHTML(icon, msg) { return '<div class="empty-state"><span class="empty-icon">' + icon + '</span>' + msg + '</div>'; }
function togglePass(inputId, btn) { var el = $(inputId); if (!el) return; if (el.type === 'password') { el.type = 'text'; btn.textContent = '🙈'; } else { el.type = 'password'; btn.textContent = '👁️'; } }
function calcGrade(t) { if (t >= 75) return 'A'; if (t >= 65) return 'B'; if (t >= 55) return 'C'; if (t >= 45) return 'D'; return 'F'; }
function gradeBadge(g) { var x = (g || 'F')[0]; if (x === 'A') return 'badge-approved'; if (x === 'B') return 'badge-active'; if (x === 'C') return 'badge-partial'; if (x === 'D') return 'badge-pending'; return 'badge-rejected'; }
function gradeColor(g) { var x = (g || 'F')[0]; if (x === 'A') return '#16a34a'; if (x === 'B') return '#2563eb'; if (x === 'C') return '#d97706'; if (x === 'D') return '#ea580c'; return '#dc2626'; }
/* extract mongo _id string from either string or object */
function sid(v) { return v && typeof v === 'object' ? String(v._id || v) : String(v || ''); }

/* Normalize class labels: "JSS 1" and "JSS1" both become "JSS1" */
function normClass(c) { return String(c || '').toUpperCase().replace(/\s+/g, '').trim(); }

function showToast(msg, type) {
  var cont = document.querySelector('.toast-container');
  if (!cont) { cont = document.createElement('div'); cont.className = 'toast-container'; document.body.appendChild(cont); }
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.textContent = msg;
  cont.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}
function confirm2(title, message, onConfirm) {
  var ov = document.createElement('div'); ov.className = 'confirm-overlay';
  ov.innerHTML = '<div class="confirm-box"><h4>' + title + '</h4><p>' + message + '</p>'
    + '<div class="confirm-actions"><button class="btn-secondary" id="cnfCancel">Cancel</button>'
    + '<button class="btn-danger" id="cnfOk">Confirm</button></div></div>';
  document.body.appendChild(ov);
  ov.querySelector('#cnfOk').addEventListener('click', function () { onConfirm(); ov.remove(); });
  ov.querySelector('#cnfCancel').addEventListener('click', function () { ov.remove(); });
}

/* ═══ THEME ════════════════════════════════════════════════ */
function initTheme() { var t = localStorage.getItem('edu_theme') || 'light'; document.documentElement.setAttribute('data-theme', t); updateThemeIcons(t); }
function toggleTheme() { var c = document.documentElement.getAttribute('data-theme') || 'light', n = c === 'light' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', n); localStorage.setItem('edu_theme', n); updateThemeIcons(n); }
function updateThemeIcons(t) { var i = t === 'dark' ? '🌙' : '☀️'; document.querySelectorAll('#themeIconSide').forEach(function (el) { el.textContent = i; }); var b = $('themeToggle'); if (b) b.querySelector('.theme-icon').textContent = i; }

/* ═══ SIDEBAR ══════════════════════════════════════════════ */
function toggleSidebar() { $('sidebar').classList.toggle('open'); $('sidebarOverlay').classList.toggle('open'); }
function closeSidebar() { $('sidebar').classList.remove('open'); $('sidebarOverlay').classList.remove('open'); }

/* ═══ SECTION ROUTING ══════════════════════════════════════ */
var TITLES = {
  overview: 'Dashboard', subjects: 'Subjects', exams: 'Examinations',
  results: 'My Results', fees: 'School Fees', profile: 'My Profile',
  report: 'Academic Report', students: 'Student Management',
  teachers: 'Teacher Accounts', 'create-exam': 'Create Exam',
  'my-exams': 'My Exams', submissions: 'Student Submissions',
  marking: 'Mark & Submit Results', 'test-scores': 'Enter Test Scores',
  'test-release': 'Release Test Scores', 'subject-results': 'Compound Results'
};
function showSection(name) {
  document.querySelectorAll('.dash-section').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
  var sec = $('section-' + name); if (sec) sec.classList.add('active');
  document.querySelectorAll('[data-section="' + name + '"]').forEach(function (n) { n.classList.add('active'); });
  setText('topbarTitle', TITLES[name] || 'Dashboard');
  closeSidebar();
  renderSection(name);
}
function renderSection(name) {
  var s = Session.get(); if (!s) return;
  if (s.role === 'student') {
    if (name === 'overview') renderStudentOverview(s);
    if (name === 'subjects') renderStudentSubjects();
    if (name === 'exams') renderStudentExams(s);
    if (name === 'results') renderStudentResults(s);
    if (name === 'fees') renderStudentFees(s);
    if (name === 'profile') renderStudentProfile(s);
    if (name === 'report') renderAcademicReport(s);
  }
  if (s.role === 'admin') {
    if (name === 'overview') renderAdminOverview();
    if (name === 'students') renderStudentsTable();
    if (name === 'teachers') renderTeachersTable();
    if (name === 'exams') renderExamQueue('pending');
    if (name === 'results') renderResultsRelease();
    if (name === 'fees') renderFeesTable();
    if (name === 'test-release') renderAdminTestScores('pending');
    if (name === 'subject-results') loadAdminSubjectResults();
  }
  if (s.role === 'teacher') {
    if (name === 'overview') renderTeacherOverview(s);
    if (name === 'create-exam') initCreateExam();
    if (name === 'my-exams') renderTeacherMyExams(s);
    if (name === 'submissions') renderTeacherSubmissions(s);
    if (name === 'marking') renderTeacherMarking(s);
    if (name === 'test-scores') renderTestScoresSection();
    if (name === 'profile') renderTeacherProfile(s);
  }
}

/* ═══ NOTIFICATIONS ════════════════════════════════════════ */
function toggleNotif() { $('notifDropdown').classList.toggle('hidden'); }
async function renderNotifications(userId) {
  var list = $('notifList'), badge = $('notifBadge');
  if (!list || !userId) return;
  try {
    var notifs = await Api.get('/notifications/' + userId);
    var unread = notifs.filter(function (n) { return !n.read; });
    badge.style.display = unread.length ? 'flex' : 'none';
    badge.textContent = unread.length;
    list.innerHTML = notifs.length === 0
      ? '<p class="notif-empty">No notifications</p>'
      : notifs.map(function (n) {
        return '<div class="notif-item">' + n.message
          + '<div style="font-size:.72rem;color:var(--text-3);margin-top:4px">'
          + new Date(n.createdAt).toLocaleDateString() + '</div></div>';
      }).join('');
    if (unread.length) Api.put('/notifications/' + userId + '/read-all').catch(function () { });
  } catch (e) { list.innerHTML = '<p class="notif-empty">Could not load.</p>'; }
}
async function addNotification(userId, message) {
  try { await Api.post('/notifications', { userId, message }); } catch (e) { }
}

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
var _pendingEmail = '';

function fillDemo(role) {
  if (role === 'admin') { setVal('loginUsername', 'admin'); setVal('loginPassword', 'Admin@123'); setVal('loginRole', 'admin'); }
  if (role === 'teacher') { setVal('loginUsername', 'teacher1'); setVal('loginPassword', 'Teacher@1'); setVal('loginRole', 'teacher'); }
  if (role === 'student') { setVal('loginUsername', 'chioma'); setVal('loginPassword', 'Student@1'); setVal('loginRole', 'student'); }
  showToast('Demo credentials filled!', 'info');
}
function switchTab(tab) {
  var lf = $('loginForm'), rf = $('registerForm'), of = $('otpForm');
  var lt = $('loginTab'), rt = $('registerTab');
  [lf, rf, of].forEach(function (f) { if (f) f.classList.add('hidden'); });
  if (lt) lt.classList.remove('active');
  if (rt) rt.classList.remove('active');
  if (tab === 'login') { if (lf) lf.classList.remove('hidden'); if (lt) lt.classList.add('active'); }
  if (tab === 'register') { if (rf) rf.classList.remove('hidden'); if (rt) rt.classList.add('active'); }
  if (tab === 'otp') { if (of) of.classList.remove('hidden'); }
}
function toggleTeacherFields() {
  var role = getVal('regRole');
  var cg = $('regClassGroup'), dg = $('regDepartmentGroup'), sg = $('regSubjectGroup');
  var gg = $('regGenderGroup'), pg = $('regPhoneGroup');
  // Show gender for both roles
  if (gg) gg.classList.remove('hidden');
  if (role === 'student') {
    if (cg) cg.classList.remove('hidden');
    if (dg) dg.classList.remove('hidden');
    if (sg) sg.classList.add('hidden');
    if (pg) pg.classList.add('hidden');
  } else if (role === 'teacher') {
    if (cg) cg.classList.add('hidden');
    if (dg) dg.classList.add('hidden');
    if (sg) sg.classList.remove('hidden');
    if (pg) pg.classList.remove('hidden');
  } else {
    if (cg) cg.classList.add('hidden');
    if (dg) dg.classList.add('hidden');
    if (sg) sg.classList.add('hidden');
    if (pg) pg.classList.add('hidden');
  }
}
async function handleRegisterStep1(e) {
  e.preventDefault();
  var role = getVal('regRole'), fn = getVal('regFirstName').trim(), ln = getVal('regLastName').trim();
  var un = getVal('regUsername').trim(), em = getVal('regEmail').trim();
  var cls = getVal('regClass'), dept = getVal('regDepartment');
  var subjBoxes = document.querySelectorAll('input[name="regSubject"]:checked');
  var subj = Array.from(subjBoxes).map(function(cb){ return cb.value; });
  var gender = getVal('regGender'), phone = getVal('regPhone');
  var pw = getVal('regPassword'), cf = getVal('regConfirm');
  var schoolId = getVal('regSchool');
  var errEl = $('registerError'), sucEl = $('registerSuccess'), btn = $('sendOtpBtn');
  hideError(errEl); hideSuccess(sucEl);
  if (!schoolId) return showError(errEl, 'Please select your school.');
  if (!role) return showError(errEl, 'Please select a role.');
  if (!fn || !ln) return showError(errEl, 'Please enter your full name.');
  if (!un) return showError(errEl, 'Please choose a username.');
  if (!em) return showError(errEl, 'Please enter your email.');
  if (!gender) return showError(errEl, 'Please select your gender.');
  if (role === 'student' && !cls) return showError(errEl, 'Please select your class.');
  if (role === 'student' && !dept) return showError(errEl, 'Please select your department.');
  if (role === 'teacher' && subj.length === 0) return showError(errEl, 'Please select at least one subject.');
  if (role === 'teacher' && !phone) return showError(errEl, 'Please enter your phone number.');
  if (!pw || pw.length < 6) return showError(errEl, 'Password must be at least 6 characters.');
  if (pw !== cf) return showError(errEl, 'Passwords do not match.');
  btn.textContent = 'Sending OTP…'; btn.disabled = true;
  try {
    var payload = { schoolId: schoolId, role, firstName: fn, lastName: ln, username: un, email: em, password: pw, gender: gender };
    if (role === 'student') { payload.class = cls; payload.department = dept; }
    if (role === 'teacher') { payload.subject = subj.join(', '); payload.subjects = subj; payload.phone = phone; }
    var res = await Api.post('/auth/send-otp', payload);
    _pendingEmail = em;
    showToast(res.message || 'OTP sent!', 'success');
    var hint = $('otpEmailHint');
    if (hint) hint.textContent = 'We sent a 6-digit code to ' + em + '. Enter it below.';
    switchTab('otp');
  } catch (err) { showError(errEl, err.message); }
  finally { btn.textContent = 'Send Verification Code'; btn.disabled = false; }
}
async function handleVerifyOTP(e) {
  e.preventDefault();
  var otp = getVal('otpInput').trim();
  var errEl = $('otpError'), sucEl = $('otpSuccess'), btn = $('verifyOtpBtn');
  hideError(errEl); hideSuccess(sucEl);
  if (!otp || otp.length !== 6) return showError(errEl, 'Please enter the 6-digit OTP code.');
  btn.textContent = 'Verifying…'; btn.disabled = true;
  try {
    var res = await Api.post('/auth/verify-otp', { email: _pendingEmail, otp });
    showSuccess(sucEl, '✅ ' + res.message);
    setTimeout(function () { switchTab('login'); setVal('otpInput', ''); }, 2000);
  } catch (err) { showError(errEl, err.message); }
  finally { btn.textContent = 'Verify and Create Account'; btn.disabled = false; }
}
async function resendOTP() {
  if (!_pendingEmail) { showToast('Please register first.', 'error'); return; }
  try { var r = await Api.post('/auth/resend-otp', { email: _pendingEmail }); showToast(r.message, 'success'); }
  catch (err) { showToast(err.message, 'error'); }
}
async function handleLogin(e) {
  e.preventDefault();
  var username = getVal('loginUsername').trim(), password = getVal('loginPassword').trim(), role = getVal('loginRole');
  var errEl = $('loginError'), btn = e.target.querySelector('button[type="submit"]');
  hideError(errEl);
  if (!username || !password || !role) return showError(errEl, 'Please fill in all fields.');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  try {
    var data = await Api.post('/auth/login', { username, password, role });
    localStorage.setItem('edu_token', data.token);
    Session.set(data.user);
    var routes = { student: 'student.html', admin: 'admin.html', teacher: 'teacher.html' };
    window.location.href = routes[data.user.role];
  } catch (err) { showError(errEl, err.message); btn.textContent = 'Sign In'; btn.disabled = false; }
}

/* ═══════════════════════════════════════════════════════════
   CHECK ACCOUNT APPROVAL STATUS (for student/teacher portals)
   ═══════════════════════════════════════════════════════════ */
async function checkAccountApproval() {
  try {
    var s = Session.get();
    if (!s) return;

    // For now, if they're logged in, they're approved (login checks this)
    // This is a safety check in case approval status changes
    // We can extend this later if needed
  } catch (err) {
    console.error('Approval check error:', err);
  }
}

function logout() {
  confirm2('Logout', 'Are you sure you want to logout?', function () {
    Session.clear();
    localStorage.removeItem('edu_token');
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}

/* Forgot Password Modal Functions */
function openForgotPasswordModal(e) {
  e.preventDefault();
  var modal = $('forgotPasswordModal');
  if (modal) {
    modal.classList.remove('hidden');
    var resetEmail = $('resetEmail');
    if (resetEmail) resetEmail.value = '';
    hideError($('resetError'));
    hideSuccess($('resetSuccess'));
  }
}

function closeForgotPasswordModal() {
  var modal = $('forgotPasswordModal');
  if (modal) modal.classList.add('hidden');
}

async function handleForgotPassword() {
  var email = getVal('resetEmail').trim();
  var errEl = $('resetError');
  var sucEl = $('resetSuccess');
  var btn = event.currentTarget;

  hideError(errEl);
  hideSuccess(sucEl);

  if (!email || !email.includes('@')) {
    return showError(errEl, 'Please enter a valid email address.');
  }

  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    // For students and teachers: they need to ask admin to reset
    // Display a helpful message
    showSuccess(sucEl, '✅ Please contact your school administrator to reset your password. They can reset it from the admin panel.');
    setTimeout(function () {
      closeForgotPasswordModal();
    }, 3000);
  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.textContent = 'Send Reset Link';
    btn.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════════════
   STUDENT PORTAL
   ═══════════════════════════════════════════════════════════ */
var _examTimerInt = null, _currentExam = null;

function initStudentPortal() {
  var s = Session.get();
  if (!s || s.role !== 'student') { window.location.href = 'index.html'; return; }

  // Verify approval status
  checkAccountApproval();

  var first = (s.name || 'Student').split(' ')[0];
  setText('welcomeName', first); setText('sidebarName', s.name || 'Student'); setText('topbarUser', first);
  var av = $('sidebarAvatar'); if (av) av.textContent = (s.name || 'S')[0].toUpperCase();
  applySchoolName(s);
  renderStudentOverview(s); renderNotifications(s.id); renderStudentSubjects();
}

/* OVERVIEW */
async function renderStudentOverview(s) {
  try {
    var results = await Api.get('/results/student/' + s.id);
    var exams = await Api.get('/exams');
    var fee = await Api.get('/fees/student/' + s.id).catch(function () { return null; });
    var dashboard = await Api.get('/students/dashboard').catch(function () { return null; });
    var myClass = normClass(s.class || '');
    var avail = exams.filter(function (e) {
      var tc = normClass(e.targetClass || '');
      return e.status === 'approved' && (!tc || tc === 'ALL' || tc === myClass);
    });
    setText('statExamsTaken', results.length);
    if (results.length) {
      var avg = Math.round(results.reduce(function (a, r) { return a + (r.percent || 0); }, 0) / results.length);
      setText('statAvgScore', avg + '%');
    } else { setText('statAvgScore', '—'); }
    var subjectsCount = (dashboard && dashboard.subjects) ? dashboard.subjects.count : 0;
    setText('statSubjects', subjectsCount);
    if (fee) {
      var lbls = { paid: '✅ Paid', partial: '⚠️ Partial', unpaid: '❌ Unpaid' };
      setText('statFeeStatus', lbls[fee.status] || '—');
    }
    var oe = $('overviewExamsList');
    if (oe) {
      oe.innerHTML = avail.length === 0
        ? emptyHTML('📭', 'No exams available for your class yet')
        : avail.slice(0, 4).map(function (e) {
          var taken = results.find(function (r) { return sid(r.exam) === sid(e._id); });
          return '<div class="overview-item"><div>'
            + '<div class="overview-item-title">' + e.title + '</div>'
            + '<div class="overview-item-sub">' + e.subject + ' · '
            + ((e.questions || []).length + (e.theoryQuestions || []).length) + ' Qs · ' + e.duration + 'min</div>'
            + '</div>' + (taken ? '<span class="badge badge-submitted">Done</span>' : '<span class="badge badge-active">Available</span>')
            + '</div>';
        }).join('');
    }
    var or = $('overviewResultsList');
    if (or) {
      var rel = results.filter(function (r) { return r.released; });
      or.innerHTML = rel.length === 0
        ? emptyHTML('📊', 'No released results yet')
        : rel.slice(0, 4).map(function (r) {
          return '<div class="overview-item"><div>'
            + '<div class="overview-item-title">' + (r.examTitle || '') + '</div>'
            + '<div class="overview-item-sub">' + (r.subject || '') + '</div>'
            + '</div><div style="text-align:right">'
            + '<div style="font-weight:800;color:var(--primary)">' + r.totalScore + '/' + r.grandTotal + '</div>'
            + '<div style="font-size:.75rem;color:var(--text-2)">' + (r.grade || '') + '</div></div></div>';
        }).join('');
    }
  } catch (err) { showToast('Dashboard error: ' + err.message, 'error'); }
}

/* SUBJECTS */
async function renderStudentSubjects() {
  var grid = $('subjectsGrid'); if (!grid) return;
  grid.innerHTML = loadingHTML('Loading your subjects…');
  var s = Session.get(); if (!s) return;
  try {
    var dashboard = await Api.get('/students/dashboard');
    var subjects = dashboard.subjects.list || [];
    var classLevel = dashboard.subjects.classLevel || '';
    var isDept = dashboard.subjects.isDepartmentBased || false;
    var dept = dashboard.profile.department || '';

    if (subjects.length === 0) {
      grid.innerHTML = emptyHTML('📚', 'No subjects enrolled yet');
      return;
    }

    var headerHtml = '<div style="background:var(--bg-2);padding:16px;border-radius:8px;margin-bottom:16px">'
      + '<div style="font-size:.9rem;color:var(--text-2);margin-bottom:8px">📍 Current Status</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<div class="badge badge-active" style="font-size:.9rem;padding:6px 12px">Class: ' + classLevel + '</div>';
    if (isDept && dept) {
      headerHtml += '<div class="badge badge-active" style="font-size:.9rem;padding:6px 12px">Department: ' + dept + '</div>';
    }
    headerHtml += '<div class="badge" style="background:var(--success);color:white;font-size:.9rem;padding:6px 12px">' + subjects.length + ' Subjects</div>'
      + '</div></div>';

    var subjectsHtml = subjects.map(function (subj, idx) {
      return '<div class="subject-card" style="animation:slideUp .3s ease forwards;animation-delay:' + (idx * 0.05) + 's;opacity:0">'
        + '<div class="subject-icon">📖</div>'
        + '<div class="subject-name">' + subj + '</div>'
        + '<div style="font-size:.75rem;color:var(--text-3);margin-top:4px">✓ Enrolled</div>'
        + '</div>';
    }).join('');

    grid.innerHTML = headerHtml + subjectsHtml;

  } catch (err) {
    grid.innerHTML = emptyHTML('⚠️', 'Error loading subjects');
    console.error('Subjects error:', err);
  }
}

function showSubjectDetails(subjectName) {
  var subj = SUBJECTS.find(function (s) { return s.name === subjectName; });
  if (!subj) return;
  var modal = $('subjectDetailsModal'); if (!modal) return;
  var content = $('subjectDetailsContent'); if (!content) return;
  content.innerHTML = '<h3 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:8px">'
    + subj.icon + ' ' + subj.name + '</h3>'
    + '<div style="font-size:.85rem;color:var(--primary);font-weight:700;margin-bottom:16px">Department: ' + subj.dept + '</div>'
    + '<div style="line-height:1.6;color:var(--text);font-size:.9rem">'
    + subj.desc
    + '</div>';
  modal.classList.remove('hidden');
}

function closeSubjectDetails() {
  var modal = $('subjectDetailsModal'); if (modal) modal.classList.add('hidden');
}

/* EXAMS */
async function renderStudentExams(s) {
  var list = $('examsList'); if (!list) return;
  list.innerHTML = loadingHTML('Loading available exams…');
  try {
    var exams = await Api.get('/exams');
    var results = await Api.get('/results/student/' + s.id);
    var myClass = normClass(s.class || '');
    /* Show only approved exams matching the student's class */
    var avail = exams.filter(function (e) {
      var tc = normClass(e.targetClass || '');
      return e.status === 'approved' && (!tc || tc === 'ALL' || tc === myClass);
    });
    /* Cache for startExam() */
    window._examCache = exams;
    if (avail.length === 0) {
      list.innerHTML = emptyHTML('📭', 'No exams available for your class right now.');
      return;
    }
    list.innerHTML = avail.map(function (e) {
      var taken = results.find(function (r) { return sid(r.exam) === sid(e._id); });
      var qc = (e.questions || []).length + (e.theoryQuestions || []).length;
      return '<div class="exam-card">'
        + '<div class="exam-card-info">'
        + '<div class="exam-card-title">' + e.title + '</div>'
        + '<div class="exam-card-meta">'
        + '<span>📚 ' + e.subject + '</span><span>🏫 ' + e.targetClass + '</span>'
        + '<span>❓ ' + qc + ' Questions</span><span>⏱ ' + e.duration + ' min</span>'
        + (e.totalMarks ? '<span>🏆 ' + e.totalMarks + ' marks</span>' : '')
        + '</div>'
        + (taken ? '<div style="margin-top:8px"><span class="badge badge-submitted">Completed — '
          + taken.totalScore + '/' + taken.grandTotal + ' (' + taken.percent + '%)</span></div>' : '')
        + '</div>'
        + '<div class="exam-card-actions">'
        + (taken
          ? '<button class="btn-secondary" onclick="viewExamResult(\'' + sid(e._id) + '\',\'' + s.id + '\')">📊 View Result</button>'
          : '<button class="btn-primary" onclick="startExam(\'' + sid(e._id) + '\')">Start Exam →</button>')
        + '</div></div>';
    }).join('');
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}

/* START EXAM */
function startExam(examId) {
  var cache = window._examCache || [];
  var exam = cache.find(function (e) { return sid(e._id) === String(examId); });
  if (!exam) { showToast('Exam not found. Please refresh.', 'error'); return; }
  _currentExam = JSON.parse(JSON.stringify(exam));
  _currentExam.objAnswers = {};
  _currentExam.theoryAnswers = {};
  $('examModal').classList.remove('hidden');
  setText('examModalTitle', exam.title);
  setText('examModalSubject', exam.subject);
  var objQs = exam.questions || [], theoryQs = exam.theoryQuestions || [];
  var html = '';
  if (objQs.length > 0) {
    html += '<div style="font-family:var(--font-display);font-weight:800;color:var(--primary);margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--primary)">SECTION A — OBJECTIVE (' + (exam.objMarks || 0) + ' marks)</div>';
    objQs.forEach(function (q, i) {
      html += '<div class="exam-question"><div class="exam-q-text">Q' + (i + 1) + '. ' + q.text
        + ' <span style="font-size:.75rem;color:var(--text-3)">(' + q.marks + ' mark' + (q.marks !== 1 ? 's' : '') + ')</span></div>'
        + '<div class="exam-options">' + q.options.map(function (opt, oi) {
          return '<label class="exam-option" id="opt-' + i + '-' + oi + '" onclick="selectObjAnswer(' + i + ',' + oi + ',this)">'
            + '<input type="radio" name="q' + i + '" value="' + oi + '"/> ' + opt + '</label>';
        }).join('') + '</div></div>';
    });
  }
  if (theoryQs.length > 0) {
    html += '<div style="font-family:var(--font-display);font-weight:800;color:var(--primary);margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid var(--primary)">SECTION B — THEORY (' + (exam.theoryMarks || 0) + ' marks)</div>';
    theoryQs.forEach(function (q, i) {
      html += '<div class="exam-question"><div class="exam-q-text">Q' + (i + 1) + '. ' + q.text
        + ' <span style="font-size:.75rem;color:var(--text-3)">(' + q.marks + ' mark' + (q.marks !== 1 ? 's' : '') + ')</span></div>'
        + '<textarea style="width:100%;min-height:100px;border-radius:8px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:.88rem;background:var(--surface);color:var(--text);resize:vertical" '
        + 'id="theory-ans-' + i + '" placeholder="Write your answer here…" oninput="recordTheoryAnswer(' + i + ',this.value)"></textarea></div>';
    });
  }
  $('examQuestions').innerHTML = html;
  var total = objQs.length + theoryQs.length;
  updateExamProgress(total); setText('examQCount', '0 / ' + total + ' answered');
  var remaining = exam.duration * 60; clearInterval(_examTimerInt);
  updateTimerDisplay(remaining);
  _examTimerInt = setInterval(function () {
    remaining--;
    updateTimerDisplay(remaining);
    if (remaining <= 60) $('examTimer').classList.add('danger');
    if (remaining <= 0) { clearInterval(_examTimerInt); submitExam(); }
  }, 1000);
}
function selectObjAnswer(qi, oi, label) {
  document.querySelectorAll('[id^="opt-' + qi + '-"]').forEach(function (el) { el.classList.remove('selected'); });
  label.classList.add('selected'); _currentExam.objAnswers[qi] = oi;
  var t = (_currentExam.questions || []).length + (_currentExam.theoryQuestions || []).length;
  setText('examQCount', Object.keys(_currentExam.objAnswers).length + Object.keys(_currentExam.theoryAnswers).length + ' / ' + t + ' answered');
  updateExamProgress(t);
}
function recordTheoryAnswer(i, val) {
  _currentExam.theoryAnswers[i] = val;
  var t = (_currentExam.questions || []).length + (_currentExam.theoryQuestions || []).length;
  setText('examQCount', Object.keys(_currentExam.objAnswers).length + Object.keys(_currentExam.theoryAnswers).length + ' / ' + t + ' answered');
  updateExamProgress(t);
}
function updateTimerDisplay(secs) { var m = String(Math.floor(secs / 60)).padStart(2, '0'), s = String(secs % 60).padStart(2, '0'); setText('examTimer', '⏱ ' + m + ':' + s); }
function updateExamProgress(total) { if (!_currentExam || !total) return; var a = Object.keys(_currentExam.objAnswers).length + Object.keys(_currentExam.theoryAnswers).length; var bar = $('examProgress'); if (bar) bar.style.width = ((a / total) * 100) + '%'; }

/* SUBMIT EXAM */
async function submitExam() {
  clearInterval(_examTimerInt);
  var session = Session.get(); if (!_currentExam || !session) return;
  var objQs = _currentExam.questions || [], theoryQs = _currentExam.theoryQuestions || [];
  var objScore = 0, objTotal = 0, objBreakdown = [];
  objQs.forEach(function (q, i) {
    var sa = _currentExam.objAnswers[i], correct = sa === q.answer, earned = correct ? (q.marks || 1) : 0;
    objScore += earned; objTotal += (q.marks || 1);
    objBreakdown.push({ text: q.text, correct: correct, studentAns: sa !== undefined ? q.options[sa] : 'Not answered', correctAns: q.options[q.answer], marks: earned, maxMarks: q.marks || 1 });
  });
  var theoryTotal = theoryQs.reduce(function (s, q) { return s + (q.marks || 0); }, 0);
  var theoryAnswers = theoryQs.map(function (q, i) {
    return { questionId: sid(q._id) || String(i), questionText: q.text, answer: _currentExam.theoryAnswers[i] || '', guide: q.guide || '', maxMarks: q.marks || 0, marksAwarded: null };
  });
  var grandTotal = objTotal + theoryTotal;
  var percent = grandTotal > 0 ? Math.round((objScore / grandTotal) * 100) : 0;
  var grade = calcGrade(percent);
  try {
    await Api.post('/results', {
      student: session.id, studentName: session.name, exam: _currentExam._id,
      examTitle: _currentExam.title, subject: _currentExam.subject,
      objScore, objTotal, objBreakdown, theoryAnswers,
      theoryScore: null, theoryTotal, totalScore: objScore, grandTotal, percent, grade,
      status: 'submitted', released: false
    });
    await addNotification(session.id, 'You completed "' + _currentExam.title + '" — Obj Score: ' + objScore + '/' + objTotal);
    $('examModal').classList.add('hidden');
    showResultModal(objScore, objTotal, theoryTotal, percent, grade, objBreakdown);
    renderNotifications(session.id);
    _currentExam = null;
  } catch (err) { showToast('Error saving result: ' + err.message, 'error'); }
}

function showResultModal(objScore, objTotal, theoryTotal, percent, grade, breakdown) {
  $('resultModal').classList.remove('hidden');
  setText('resultScore', objScore + ' / ' + objTotal + (theoryTotal ? ' (Section A only)' : ''));
  setText('resultPercent', percent + '%');
  setText('resultGrade', 'Grade: ' + grade);
  $('resultBreakdown').innerHTML = (breakdown || []).map(function (b, i) {
    return '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">'
      + '<div style="font-weight:600;margin-bottom:2px">Q' + (i + 1) + ': ' + b.text + '</div>'
      + '<div>Your answer: <span style="color:' + (b.correct ? '#22c55e' : '#ef4444') + ';font-weight:700">' + (b.studentAns || 'Not answered') + '</span></div>'
      + (!b.correct ? '<div>Correct: <span style="color:#22c55e;font-weight:700">' + b.correctAns + '</span></div>' : '')
      + '<div style="font-size:.75rem;color:var(--text-3)">Marks: ' + b.marks + '/' + b.maxMarks + '</div></div>';
  }).join('') + (theoryTotal > 0 ? '<div style="padding:10px;background:var(--surface-2);border-radius:8px;font-size:.83rem;color:var(--text-2)">✍️ Theory answers submitted. Your teacher will mark them soon.</div>' : '');
}
function closeResultModal() { $('resultModal').classList.add('hidden'); renderStudentExams(Session.get()); }

async function viewExamResult(examId, studentId) {
  try {
    var results = await Api.get('/results/student/' + studentId);
    var r = results.find(function (res) { return sid(res.exam) === String(examId); });
    if (r) showResultModal(r.objScore, r.objTotal, r.theoryTotal, r.percent, r.grade, r.objBreakdown);
  } catch (err) { showToast('Could not load result: ' + err.message, 'error'); }
}

/* MY RESULTS */
async function renderStudentResults(s) {
  var cont = $('resultsContent'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading results…');
  try {
    var results = await Api.get('/results/student/' + s.id + '/released');
    if (results.length === 0) { cont.innerHTML = emptyHTML('📊', 'No released results yet. Results will appear here after your teacher marks and admin releases them.'); return; }
    cont.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>'
      + '<th>#</th><th>Exam</th><th>Subject</th><th>Obj (20)</th><th>Theory (40)</th><th>Total</th><th>%</th><th>Grade</th><th></th>'
      + '</tr></thead><tbody>'
      + results.map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td><td>' + (r.examTitle || '') + '</td><td>' + (r.subject || '') + '</td>'
          + '<td>' + r.objScore + '/' + r.objTotal + '</td>'
          + '<td>' + (r.theoryScore !== null && r.theoryScore !== undefined ? r.theoryScore + '/' + r.theoryTotal : '<span style="color:var(--text-3)">Pending</span>') + '</td>'
          + '<td><strong>' + r.totalScore + '/' + r.grandTotal + '</strong></td>'
          + '<td>' + r.percent + '%</td>'
          + '<td><span class="badge ' + gradeBadge(r.grade) + '">' + r.grade + '</span></td>'
          + '<td><button class="btn-secondary btn-sm" onclick="viewExamResult(\'' + sid(r.exam) + '\',\'' + s.id + '\')">View</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  } catch (err) { cont.innerHTML = emptyHTML('⚠️', err.message); }
}

/* FEES */
async function renderStudentFees(s) {
  var cont = $('feesContent'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading fee record…');
  try {
    var fee = await Api.get('/fees/student/' + s.id);
    var cfg = { paid: { icon: '✅', label: 'Fully Paid', color: '#16a34a' }, partial: { icon: '⚠️', label: 'Partial Payment', color: '#d97706' }, unpaid: { icon: '❌', label: 'Unpaid', color: '#dc2626' } };
    var c = cfg[fee.status] || cfg.unpaid; var bal = fee.total - fee.paid;
    cont.innerHTML = '<div class="fee-card">'
      + '<div class="fee-status-icon">' + c.icon + '</div>'
      + '<div class="fee-status-label" style="color:' + c.color + '">' + c.label + '</div>'
      + '<div class="fee-details">'
      + '<div class="fee-detail-row"><span class="fee-detail-label">Total Fee</span><span class="fee-detail-value">₦' + fee.total.toLocaleString() + '</span></div>'
      + '<div class="fee-detail-row"><span class="fee-detail-label">Amount Paid</span><span class="fee-detail-value" style="color:#16a34a">₦' + fee.paid.toLocaleString() + '</span></div>'
      + '<div class="fee-detail-row"><span class="fee-detail-label">Balance</span><span class="fee-detail-value" style="color:' + (bal > 0 ? '#dc2626' : '#16a34a') + '">₦' + bal.toLocaleString() + '</span></div>'
      + '<div class="fee-detail-row"><span class="fee-detail-label">Status</span><span class="badge badge-' + fee.status + '">' + c.label + '</span></div>'
      + '</div></div>';
  } catch (err) { cont.innerHTML = emptyHTML('💳', 'No fee record found. Contact admin.'); }
}

/* PROFILE */
function renderStudentProfile(s) {
  var cont = $('profileContent'); if (!cont) return;
  cont.innerHTML = '<div class="profile-card">'
    + '<div class="profile-avatar-lg">' + (s.name || 'S')[0].toUpperCase() + '</div>'
    + '<div class="profile-name">' + (s.name || '') + '</div>'
    + '<span class="badge badge-active">Student</span>'
    + '<div class="profile-fields">'
    + '<div class="profile-field"><span class="profile-field-label">Username</span><span class="profile-field-value">@' + (s.username || '') + '</span></div>'
    + '<div class="profile-field"><span class="profile-field-label">Class</span><span class="profile-field-value">' + (s.class || '—') + '</span></div>'
    + '<div class="profile-field"><span class="profile-field-label">Department</span><span class="profile-field-value">' + (s.department || '—') + '</span></div>'
    + '<div class="profile-field"><span class="profile-field-label">Email</span><span class="profile-field-value">' + (s.email || '—') + '</span></div>'
    + '</div></div>'
    + '<div class="change-password-card" style="margin-top:30px;padding:20px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">'
    + '<h3 style="margin-bottom:15px;color:var(--text);font-size:16px">🔑 Change Password</h3>'
    + '<form onsubmit="handleChangePassword(event)" style="display:flex;flex-direction:column;gap:12px">'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">Current Password</label>'
    + '<div style="display:flex;gap:8px">'
    + '<input type="password" id="currentPassword" placeholder="Enter your current password" required style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '</div>'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">New Password</label>'
    + '<input type="password" id="newPassword" placeholder="At least 8 characters" minlength="8" required style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">Confirm New Password</label>'
    + '<input type="password" id="confirmPassword" placeholder="Repeat your new password" minlength="8" required style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '<div class="form-error" id="changePasswordError" style="font-size:12px;color:#c62828;display:none;padding:10px;background:#ffebee;border-radius:4px;border-left:3px solid #c62828"></div>'
    + '<div class="form-success" id="changePasswordSuccess" style="font-size:12px;color:#2e7d32;display:none;padding:10px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32"></div>'
    + '<button type="submit" style="padding:10px;background:#1E40AF;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;transition:all 0.3s">💾 Update Password</button>'
    + '</form>'
    + '</div>';
}

async function handleChangePassword(e) {
  e.preventDefault();

  var oldPass = getVal('currentPassword');
  var newPass = getVal('newPassword');
  var confPass = getVal('confirmPassword');
  var errEl = $('changePasswordError');
  var sucEl = $('changePasswordSuccess');
  var btn = e.currentTarget.querySelector('button[type=submit]');

  if (errEl) errEl.style.display = 'none';
  if (sucEl) sucEl.style.display = 'none';

  if (!oldPass || !newPass || !confPass) {
    if (errEl) {
      errEl.textContent = 'Please fill in all password fields.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (newPass !== confPass) {
    if (errEl) {
      errEl.textContent = 'New passwords do not match.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (newPass.length < 8) {
    if (errEl) {
      errEl.textContent = 'New password must be at least 8 characters.';
      errEl.style.display = 'block';
    }
    return;
  }

  btn.textContent = 'Updating…';
  btn.disabled = true;

  try {
    var res = await Api.post('/auth/change-password', {
      oldPassword: oldPass,
      newPassword: newPass,
      confirmPassword: confPass
    });

    if (sucEl) {
      sucEl.textContent = '✅ ' + res.message;
      sucEl.style.display = 'block';
    }

    setTimeout(function () {
      Session.clear();
      window.location.href = 'index.html';
    }, 2000);
  } catch (err) {
    if (errEl) {
      errEl.textContent = '❌ ' + err.message;
      errEl.style.display = 'block';
    }
  } finally {
    btn.textContent = '💾 Update Password';
    btn.disabled = false;
  }
}

/* ACADEMIC REPORT */
async function renderAcademicReport(passedSession) {
  var s = passedSession || Session.get(); if (!s) return;
  var cont = $('reportContent'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading academic report…');
  var sessionVal = getVal('reportSession'), termVal = getVal('reportTerm');
  try {
    var url = '/subject-results/student/' + s.id + '/term';
    var params = [];
    if (sessionVal) params.push('session=' + encodeURIComponent(sessionVal));
    if (termVal) params.push('term=' + encodeURIComponent(termVal));
    if (params.length) url += '?' + params.join('&');
    var results = await Api.get(url);
    if (results.length === 0) {
      cont.innerHTML = emptyHTML('📋', 'No academic report available yet. Results appear here once your teacher submits scores and admin releases them.');
      return;
    }
    /* Group by session + term */
    var grouped = {};
    results.forEach(function (r) {
      var key = (r.session || '—') + ' | ' + (r.term || '—');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    var html = '';
    Object.keys(grouped).forEach(function (termKey) {
      var rows = grouped[termKey];
      var grand = rows.reduce(function (a, r) { return a + r.totalScore; }, 0);
      var avg = rows.length ? Math.round(grand / rows.length) : 0;
      var pos = computePosition(rows);
      html += '<div class="card" style="margin-bottom:20px;overflow:hidden">';
      html += '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
        + '<span>📋 ' + termKey + '</span>'
        + '<span style="font-size:.85rem;color:var(--text-2)">Average: <strong style="color:var(--primary)">' + avg + '%</strong></span>'
        + '</div>';
      html += '<div style="overflow-x:auto"><table class="data-table">';
      html += '<thead><tr><th>Subject</th><th>Obj (20)</th><th>Theory (40)</th><th>Test (40)</th><th>Total (100)</th><th>Grade</th><th>Remark</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        var gc = gradeColor(r.grade);
        html += '<tr>'
          + '<td><strong>' + r.subject + '</strong></td>'
          + '<td>' + r.objScore + '/20</td>'
          + '<td>' + r.theoryScore + '/40</td>'
          + '<td>' + (r.testScore > 0 ? r.testScore : '—') + '/40</td>'
          + '<td><strong style="color:var(--primary)">' + r.totalScore + '</strong>/100</td>'
          + '<td><span style="font-weight:800;color:' + gc + '">' + r.grade + '</span></td>'
          + '<td style="color:var(--text-2);font-size:.85rem">' + r.remark + '</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
      html += '<div style="padding:12px 18px;background:var(--surface-2);border-top:1px solid var(--border);display:flex;gap:20px;flex-wrap:wrap;font-size:.85rem">'
        + '<span>📊 Aggregate: <strong>' + grand + '</strong></span>'
        + '<span>📈 Average: <strong>' + avg + '%</strong></span>'
        + '<span>🏆 Position: <strong>' + pos + '</strong></span>'
        + '</div>';
      html += '</div>';
    });
    cont.innerHTML = html;
  } catch (err) { cont.innerHTML = emptyHTML('⚠️', err.message); }
}
function computePosition(rows) { return '—'; /* requires class-wide data */ }

/* ═══════════════════════════════════════════════════════════
   ADMIN PORTAL
   ═══════════════════════════════════════════════════════════ */
function initAdminPortal() {
  var s = Session.get(); if (!s || s.role !== 'admin') { window.location.href = 'index.html'; return; }
  applySchoolName(s);
  renderAdminOverview(); renderTeachersTable(); renderNotifications('admin');
}

async function renderAdminOverview() {
  try {
    var students = await Api.get('/students'), exams = await Api.get('/exams'), teachers = await Api.get('/teachers');
    var pending = exams.filter(function (e) { return e.status === 'pending'; });
    var approved = exams.filter(function (e) { return e.status === 'approved'; });
    setText('adminStatStudents', students.length); setText('adminStatTeachers', (teachers && teachers.teachers ? teachers.teachers.length : 0));
    setText('adminStatPending', pending.length); setText('adminStatActive', approved.length);
    var pe = $('adminOverviewPending');
    if (pe) {
      pe.innerHTML = pending.length === 0 ? emptyHTML('✅', 'No pending approvals') : pending.slice(0, 3).map(function (e) {
        return '<div class="overview-item"><div><div class="overview-item-title">' + e.title + '</div>'
          + '<div class="overview-item-sub">By ' + e.createdByName + ' · ' + e.subject + '</div></div>'
          + '<span class="badge badge-pending">Pending</span></div>';
      }).join('');
    }
    var se = $('adminOverviewStudents');
    if (se) {
      se.innerHTML = students.length === 0 ? emptyHTML('🎒', 'No students yet') : students.slice(-4).reverse().map(function (s) {
        return '<div class="overview-item"><div><div class="overview-item-title">' + s.firstName + ' ' + s.lastName + '</div>'
          + '<div class="overview-item-sub">' + s.class + ' · @' + s.username + '</div></div>'
          + '<span class="badge badge-active">Active</span></div>';
      }).join('');
    }
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

/* STUDENTS */
var _students = [];
async function renderStudentsTable() {
  var tbody = $('studentsTableBody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:20px">Loading…</td></tr>';
  try { _students = await Api.get('/students'); renderStudentRows(_students); }
  catch (err) { tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;color:red">' + err.message + '</td></tr>'; }
}
function renderStudentRows(students) {
  var tbody = $('studentsTableBody'); if (!tbody) return;
  if (students.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--text-3)">No students found</td></tr>'; return; }
  tbody.innerHTML = students.map(function (s, i) {
    return '<tr><td>' + (i + 1) + '</td><td><strong>' + s.firstName + ' ' + s.lastName + '</strong></td>'
      + '<td>@' + s.username + '</td><td>' + (s.class || '—') + '</td>'
      + '<td>' + (s.email || '—') + '</td><td>' + formatDate(s.createdAt) + '</td>'
      + '<td><div class="action-btns">'
      + '<button class="btn-secondary btn-sm" onclick="editStudent(\'' + s._id + '\')">✏️ Edit</button>'
      + '<button class="btn-danger btn-sm" onclick="deleteStudent(\'' + s._id + '\')">🗑️ Delete</button>'
      + '</div></td></tr>';
  }).join('');
}
function filterStudents() {
  var q = getVal('studentSearch').toLowerCase(), cls = getVal('studentClassFilter');
  renderStudentRows(_students.filter(function (s) {
    return (s.firstName + ' ' + s.lastName + ' ' + s.username + ' ' + (s.email || '')).toLowerCase().includes(q) && (!cls || s.class === cls);
  }));
}
function openStudentModal(id) {
  setText('studentModalTitle', id ? 'Edit Student' : 'Add Student');
  if (id) { var s = _students.find(function (x) { return x._id === id; }); if (s) { setVal('modalFirstName', s.firstName); setVal('modalLastName', s.lastName); setVal('modalUsername', s.username); setVal('modalEmail', s.email || ''); setVal('modalClass', s.class || ''); setVal('modalPassword', ''); setVal('modalStudentId', s._id); } }
  else { ['modalFirstName', 'modalLastName', 'modalUsername', 'modalEmail', 'modalPassword'].forEach(function (id) { setVal(id, ''); }); setVal('modalClass', ''); setVal('modalStudentId', ''); }
  $('studentModalOverlay').classList.remove('hidden');
}
function closeStudentModal() { $('studentModalOverlay').classList.add('hidden'); }
function editStudent(id) { openStudentModal(id); }
async function saveStudent(e) {
  e.preventDefault(); var id = getVal('modalStudentId');
  var payload = { firstName: getVal('modalFirstName').trim(), lastName: getVal('modalLastName').trim(), username: getVal('modalUsername').trim(), email: getVal('modalEmail').trim(), class: getVal('modalClass') };
  var pwd = getVal('modalPassword'); if (pwd) payload.password = pwd;
  try {
    if (id) { await Api.put('/students/' + id, payload); showToast('Student updated!', 'success'); }
    else { payload.password = pwd; await Api.post('/students', payload); showToast('Student added!', 'success'); }
    closeStudentModal(); renderStudentsTable(); renderAdminOverview();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}
async function deleteStudent(id) {
  confirm2('Delete Student', 'Remove this student permanently?', async function () {
    try { await Api.delete('/students/' + id); showToast('Student removed.', 'success'); renderStudentsTable(); renderAdminOverview(); }
    catch (err) { showToast('Error: ' + err.message, 'error'); }
  });
}

/* TEACHERS */
var _teachers = [];
async function renderTeachersTable() {
  var tbody = $('teachersTableBody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:20px">Loading…</td></tr>';
  try { var resp = await Api.get('/teachers'); _teachers = resp.teachers || []; renderTeacherRows(_teachers); }
  catch (err) { tbody.innerHTML = '<tr><td colspan="8" style="padding:20px;color:red">' + err.message + '</td></tr>'; }
}
function renderTeacherRows(teachers) {
  var tbody = $('teachersTableBody'); if (!tbody) return;
  if (teachers.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;color:var(--text-3)">No teachers found</td></tr>'; return; }
  tbody.innerHTML = teachers.map(function (t, i) {
    return '<tr><td>' + (i + 1) + '</td><td><strong>' + t.firstName + ' ' + t.lastName + '</strong></td>'
      + '<td>@' + t.username + '</td><td>' + (t.subject || '—') + '</td>'
      + '<td>' + (t.salary ? '₦' + t.salary.toLocaleString() : '—') + '</td>'
      + '<td>' + formatDate(t.employmentDate || t.createdAt) + '</td>'
      + '<td>' + (t.phone || '—') + '</td>'
      + '<td><div class="action-btns">'
      + '<button class="btn-secondary btn-sm" onclick="editTeacher(\'' + t._id + '\')" title="Edit">✏️ Edit</button>'
      + '<button class="btn-danger btn-sm" onclick="deleteTeacher(\'' + t._id + '\')" title="Delete">🗑️ Delete</button>'
      + '</div></td></tr>';
  }).join('');
}
function openTeacherModal(id) {
  setText('teacherModalTitle', id ? 'Edit Teacher' : 'Add Teacher');
  if (id) {
    var t = _teachers.find(function (x) { return x._id === id; });
    if (t) {
      setVal('teacherFirstName', t.firstName);
      setVal('teacherLastName', t.lastName);
      setVal('teacherUsername', t.username);
      setVal('teacherEmail', t.email || '');
      setVal('teacherSubject', t.subject || '');
      setVal('teacherSalary', t.salary || '');
      setVal('teacherEmploymentDate', t.employmentDate ? t.employmentDate.split('T')[0] : '');
      setVal('teacherPhone', t.phone || '');
      setVal('teacherGender', t.gender || '');
      setVal('teacherId', t._id);
    }
  } else {
    ['teacherFirstName', 'teacherLastName', 'teacherUsername', 'teacherEmail', 'teacherSubject', 'teacherPhone'].forEach(function (id) { setVal(id, ''); });
    setVal('teacherSalary', '');
    setVal('teacherGender', '');
    setVal('teacherEmploymentDate', '');
    setVal('teacherId', '');
  }
// Show reset password section only when editing an existing teacher
  var resetSection = $('resetPasswordSection');
  if (resetSection) {
    resetSection.style.display = id ? 'block' : 'none';
    var resetMsg = $('resetPasswordMsg');
    if (resetMsg) resetMsg.innerHTML = '';
    var customPwd = $('newPasswordModal');
    if (customPwd) customPwd.value = '';
    var autoRadio = document.querySelector('input[name="resetTypeModal"][value="auto"]');
    if (autoRadio) { autoRadio.checked = true; }
    var customField = $('customPasswordModal');
    if (customField) customField.style.display = 'none';
  }
  $('teacherModalOverlay').classList.remove('hidden');
}
function closeTeacherModal() { $('teacherModalOverlay').classList.add('hidden'); }

document.addEventListener('change', function(e) {
  if (e.target.name === 'resetTypeModal') {
    var cf = $('customPasswordModal');
    if (cf) cf.style.display = e.target.value === 'manual' ? 'block' : 'none';
  }
});

async function resetTeacherPasswordFromModal() {
  var teacherId = getVal('teacherId');
  if (!teacherId) return;
  var btn = $('resetPasswordBtn');
  var msgDiv = $('resetPasswordMsg');
  var resetType = document.querySelector('input[name="resetTypeModal"]:checked')?.value || 'auto';
  var customPassword = $('newPasswordModal')?.value?.trim();

  if (resetType === 'manual' && (!customPassword || customPassword.length < 6)) {
    msgDiv.innerHTML = '<div style="color:#dc2626;font-size:12px;margin-bottom:8px;">✗ Password must be at least 6 characters.</div>';
    return;
  }

  if (!confirm('Reset password for this teacher? A new password will be sent to their email.')) return;

  btn.disabled = true;
  btn.textContent = 'Sending…';
  msgDiv.innerHTML = '';

  try {
    var body = { userId: teacherId };
    if (resetType === 'manual') body.newPassword = customPassword;
   var data = await Api.post('/auth/admin/reset-password', body);
    msgDiv.innerHTML = '<div class="reset-pwd-msg-success">✓ Password reset! New password sent to ' + data.userDetails.email + '</div>';
    if ($('newPasswordModal')) $('newPasswordModal').value = '';
  } catch (err) {
    msgDiv.innerHTML = '<div class="reset-pwd-msg-error">✗ ' + (err.message || 'Failed to reset password') + '</div>';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔑 Reset &amp; Send Password';
  }
}

function editTeacher(id) { openTeacherModal(id); }
async function saveTeacher(e) {
  e.preventDefault();
  var id = getVal('teacherId');
  var payload = {
    firstName: getVal('teacherFirstName').trim(),
    lastName: getVal('teacherLastName').trim(),
    username: getVal('teacherUsername').trim(),
    email: getVal('teacherEmail').trim(),
    subject: getVal('teacherSubject').trim(),
    salary: parseInt(getVal('teacherSalary')) || 0,
    employmentDate: getVal('teacherEmploymentDate'),
    phone: getVal('teacherPhone').trim(),
    gender: getVal('teacherGender')
  };
  try {
    if (id) {
      await Api.put('/teachers/' + id + '/admin-edit', payload);
      showToast('Teacher updated!', 'success');
    } else {
      await Api.post('/teachers', payload);
      showToast('Teacher added!', 'success');
    }
    closeTeacherModal(); renderTeachersTable(); renderAdminOverview();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}
async function deleteTeacher(id) {
  confirm2('Delete Teacher', 'Remove this teacher permanently?', async function () {
    try { await Api.delete('/teachers/' + id); showToast('Teacher removed.', 'success'); renderTeachersTable(); renderAdminOverview(); }
    catch (err) { showToast('Error: ' + err.message, 'error'); }
  });
}

/* EXAM QUEUE */
var _qFilter = 'pending', _examCache = [];
async function renderExamQueue(filter) {
  _qFilter = filter; var list = $('examQueueList'); if (!list) return;
  list.innerHTML = loadingHTML('Loading exams…');
  try {
    _examCache = await Api.get('/exams');
    var shown = filter === 'all' ? _examCache : _examCache.filter(function (e) { return e.status === filter; });
    if (shown.length === 0) { list.innerHTML = emptyHTML('📭', 'No exams in this category.'); return; }
    list.innerHTML = shown.map(function (e) {
      var qc = (e.questions || []).length + (e.theoryQuestions || []).length;
      return '<div class="queue-card"><div class="queue-card-info">'
        + '<div class="queue-card-title">' + e.title + '</div>'
        + '<div class="queue-card-meta">'
        + '<span>📚 ' + e.subject + '</span><span>🏫 ' + e.targetClass + '</span>'
        + '<span>❓ ' + qc + ' Qs</span><span>⏱ ' + e.duration + 'min</span>'
        + '<span>🏆 ' + (e.totalMarks || 0) + ' marks</span><span>👩‍🏫 ' + (e.createdByName || '') + '</span>'
        + '</div></div>'
        + '<div class="queue-card-actions">'
        + '<span class="badge badge-' + e.status + '">' + cap(e.status) + '</span>'
        + '<button class="btn-secondary btn-sm" onclick="previewExamAdmin(\'' + e._id + '\')">👁 Preview</button>'
        + (e.status === 'pending' ? '<button class="btn-success btn-sm" onclick="approveExam(\'' + e._id + '\')">✅ Approve</button>'
          + '<button class="btn-danger btn-sm" onclick="rejectExam(\'' + e._id + '\')">❌ Reject</button>' : '')
        + (e.status === 'approved' ? '<button class="btn-danger btn-sm" onclick="revokeExam(\'' + e._id + '\')">Revoke</button>' : '')
        + '</div></div>';
    }).join('');
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}
function filterExamQueue(filter, btn) { document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); }); if (btn) btn.classList.add('active'); renderExamQueue(filter); }
async function approveExam(id) {
  try { await Api.put('/exams/' + id + '/status', { status: 'approved' }); var e = _examCache.find(function (x) { return String(x._id) === String(id); }); if (e) addNotification(e.createdBy, 'Your exam "' + e.title + '" was approved by Admin.'); showToast('Exam approved!', 'success'); renderExamQueue(_qFilter); renderAdminOverview(); }
  catch (err) { showToast('Error: ' + err.message, 'error'); }
}
async function rejectExam(id) {
  try { await Api.put('/exams/' + id + '/status', { status: 'rejected' }); showToast('Exam rejected.', 'error'); renderExamQueue(_qFilter); }
  catch (err) { showToast('Error: ' + err.message, 'error'); }
}
async function revokeExam(id) {
  try { await Api.put('/exams/' + id + '/status', { status: 'pending' }); showToast('Revoked.', 'info'); renderExamQueue(_qFilter); }
  catch (err) { showToast('Error: ' + err.message, 'error'); }
}
function previewExamAdmin(id) {
  var exam = _examCache.find(function (e) { return String(e._id) === String(id); }); if (!exam) return;
  var L = ['A', 'B', 'C', 'D'];
  var html = '<div class="preview-exam-meta">'
    + '<div class="preview-meta-item"><label>Subject</label><span>' + exam.subject + '</span></div>'
    + '<div class="preview-meta-item"><label>Class</label><span>' + exam.targetClass + '</span></div>'
    + '<div class="preview-meta-item"><label>Duration</label><span>' + exam.duration + ' mins</span></div>'
    + '<div class="preview-meta-item"><label>Teacher</label><span>' + exam.createdByName + '</span></div>'
    + '<div class="preview-meta-item"><label>Total Marks</label><span>' + (exam.totalMarks || 0) + '</span></div>'
    + '</div>';
  if ((exam.questions || []).length > 0) {
    html += '<div class="preview-section-title">SECTION A — OBJECTIVE (' + (exam.objMarks || 0) + ' marks)</div>';
    exam.questions.forEach(function (q, i) {
      html += '<div class="preview-q-block"><div class="preview-q-meta"><span class="preview-q-num">Q' + (i + 1) + '</span><span class="preview-marks-tag">' + q.marks + ' mark' + (q.marks !== 1 ? 's' : '') + '</span></div><div class="preview-q-text">' + q.text + '</div>'
        + q.options.map(function (opt, oi) { return '<div class="preview-opt-row ' + (oi === q.answer ? 'correct-opt' : '') + '"><span>' + L[oi] + '.</span><span>' + opt + (oi === q.answer ? ' ✓' : '') + '</span></div>'; }).join('') + '</div>';
    });
  }
  if ((exam.theoryQuestions || []).length > 0) {
    html += '<div class="preview-section-title">SECTION B — THEORY (' + (exam.theoryMarks || 0) + ' marks)</div>';
    exam.theoryQuestions.forEach(function (q, i) {
      html += '<div class="preview-q-block"><div class="preview-q-meta"><span class="preview-q-num">Q' + (i + 1) + '</span><span class="preview-marks-tag">' + q.marks + ' marks</span></div><div class="preview-q-text">' + q.text + '</div>' + (q.guide ? '<div class="preview-theory-guide">📋 Guide: ' + q.guide + '</div>' : '') + '</div>';
    });
  }
  $('examPreviewContent').innerHTML = html;
  $('examPreviewActions').innerHTML = exam.status === 'pending'
    ? '<button class="btn-danger" onclick="rejectExam(\'' + id + '\');closeExamPreview()">❌ Reject</button>'
    + '<button class="btn-success" onclick="approveExam(\'' + id + '\');closeExamPreview()">✅ Approve</button>'
    : '<button class="btn-secondary" onclick="closeExamPreview()">Close</button>';
  $('examPreviewOverlay').classList.remove('hidden');
}
function closeExamPreview() { $('examPreviewOverlay').classList.add('hidden'); }

/* RELEASE EXAM RESULTS */
async function renderResultsRelease() {
  var cont = $('resultsReleaseList'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading results…');
  try {
    var results = await Api.get('/results');
    var pending = results.filter(function (r) { return r.status === 'marked' && !r.released; });
    if (pending.length === 0) { cont.innerHTML = emptyHTML('📬', 'No results pending release.'); return; }
    cont.innerHTML = pending.map(function (r) {
      return '<div class="release-card"><div>'
        + '<div style="font-weight:700">' + (r.examTitle || '') + '</div>'
        + '<div style="font-size:.8rem;color:var(--text-2)">' + (r.studentName || '') + ' · ' + (r.subject || '') + ' · Total: ' + r.totalScore + '/' + r.grandTotal + ' (' + r.percent + '%)</div>'
        + '</div><div style="display:flex;gap:8px;align-items:center">'
        + '<span class="badge badge-pending">Pending</span>'
        + '<button class="btn-success btn-sm" onclick="releaseResult(\'' + r._id + '\',\'' + sid(r.student) + '\')">📤 Release</button>'
        + '</div></div>';
    }).join('');
  } catch (err) { cont.innerHTML = emptyHTML('⚠️', err.message); }
}
async function releaseResult(resultId, studentId) {
  try {
    await Api.put('/results/' + resultId, { status: 'released', released: true });
    await addNotification(studentId, 'Your exam result has been released. Check My Results.');
    showToast('Result released!', 'success'); renderResultsRelease();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

/* FEES */
var _fees = [];
async function renderFeesTable() {
  var tbody = $('feesTableBody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:20px">Loading…</td></tr>';
  try { _fees = await Api.get('/fees'); renderFeeRows(_fees); }
  catch (err) { tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;color:red">' + err.message + '</td></tr>'; }
}
function renderFeeRows(fees) {
  var tbody = $('feesTableBody'); if (!tbody) return;
  if (fees.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--text-3)">No fee records</td></tr>'; return; }
  tbody.innerHTML = fees.map(function (f) { var s = f.student || {}, bal = f.total - f.paid; return '<tr><td><strong>' + (s.firstName || '') + ' ' + (s.lastName || '') + '</strong></td><td>' + (s.class || '—') + '</td><td>₦' + (f.total || 0).toLocaleString() + '</td><td>₦' + (f.paid || 0).toLocaleString() + '</td><td style="color:' + (bal > 0 ? '#dc2626' : '#16a34a') + '">₦' + bal.toLocaleString() + '</td><td><span class="badge badge-' + f.status + '">' + cap(f.status) + '</span></td><td><button class="btn-secondary btn-sm" onclick="openFeeModal(\'' + (s._id || '') + '\',\'' + (s.firstName + ' ' + s.lastName) + '\',' + (f.total || 0) + ',' + (f.paid || 0) + ',\'' + f.status + '\')">✏️ Update</button></td></tr>'; }).join('');
}
function filterFees() { var q = getVal('feeSearch').toLowerCase(), st = getVal('feeStatusFilter'); renderFeeRows(_fees.filter(function (f) { var s = f.student || {}; return (s.firstName + ' ' + s.lastName).toLowerCase().includes(q) && (!st || f.status === st); })); }
function openFeeModal(sid2, sname, total, paid, status) { setVal('feeModalStudent', sname); setVal('feeModalTotal', total); setVal('feeModalPaid', paid); setVal('feeModalBalance', '₦' + (total - paid).toLocaleString()); setVal('feeModalStatus', status); setVal('feeModalStudentId', sid2); $('feeModalOverlay').classList.remove('hidden'); }
function closeFeeModal() { $('feeModalOverlay').classList.add('hidden'); }
function calcBalance() { var t = parseFloat(getVal('feeModalTotal')) || 0, p = parseFloat(getVal('feeModalPaid')) || 0; setVal('feeModalBalance', '₦' + (t - p).toLocaleString()); setVal('feeModalStatus', p >= t ? 'paid' : p > 0 ? 'partial' : 'unpaid'); }
async function saveFee(e) {
  e.preventDefault(); var s2 = getVal('feeModalStudentId');
  try { await Api.put('/fees/student/' + s2, { total: parseFloat(getVal('feeModalTotal')), paid: parseFloat(getVal('feeModalPaid')), status: getVal('feeModalStatus') }); await addNotification(s2, 'Your school fee record has been updated. Status: ' + cap(getVal('feeModalStatus'))); closeFeeModal(); renderFeesTable(); showToast('Fee updated!', 'success'); }
  catch (err) { showToast('Error: ' + err.message, 'error'); }
}

/* ADMIN TEST SCORE RELEASE */
var _adminTsFilter = 'pending';
async function renderAdminTestScores(filter) {
  _adminTsFilter = filter || 'pending';
  var cont = $('adminTestScoresList'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading test scores…');
  try {
    var scores = await Api.get('/test-scores');
    var shown = _adminTsFilter === 'all' ? scores : scores.filter(function (ts) {
      return _adminTsFilter === 'pending' ? !ts.released : ts.released;
    });
    if (shown.length === 0) { cont.innerHTML = emptyHTML('📝', 'No test scores in this category.'); return; }
    cont.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>'
      + '<th>Student</th><th>Class</th><th>Subject</th><th>Session</th><th>Term</th><th>Score/40</th><th>Teacher</th><th>Status</th><th>Action</th>'
      + '</tr></thead><tbody>'
      + shown.map(function (ts) {
        var s = ts.student || {};
        return '<tr><td><strong>' + (s.firstName || ts.studentName || '') + ' ' + (s.lastName || '') + '</strong></td>'
          + '<td>' + (s.class || '—') + '</td>'
          + '<td>' + ts.subject + '</td><td>' + ts.session + '</td><td>' + ts.term + '</td>'
          + '<td><strong>' + ts.score + '/40</strong></td>'
          + '<td>' + (ts.enteredByName || '') + '</td>'
          + '<td><span class="badge ' + (ts.released ? 'badge-approved' : 'badge-pending') + '">' + (ts.released ? 'Released' : 'Pending') + '</span></td>'
          + '<td>' + (ts.released ? '—' : '<button class="btn-success btn-sm" onclick="releaseTestScore(\'' + ts._id + '\',\'' + sid(ts.student) + '\')">📤 Release</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  } catch (err) { cont.innerHTML = emptyHTML('⚠️', err.message); }
}
function filterTestScores(filter, btn) { document.querySelectorAll('#section-test-release .tab-btn').forEach(function (b) { b.classList.remove('active'); }); if (btn) btn.classList.add('active'); renderAdminTestScores(filter); }
async function releaseTestScore(tsId, studentId) {
  try {
    await Api.put('/test-scores/' + tsId + '/release', {});
    await addNotification(studentId, 'Your test score has been released. Check your Academic Report.');
    showToast('Test score released!', 'success'); renderAdminTestScores(_adminTsFilter);
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

/* ═══ ADMIN COMPOUND RESULTS ══════════════════════════════ */
var _allSubjectResults = [];
async function loadAdminSubjectResults() {
  var cont = $('subjectResultsList'); if (!cont) return;
  cont.innerHTML = loadingHTML('Loading compound results…');
  try {
    _allSubjectResults = await Api.get('/subject-results');
    filterSubjectResults();
  } catch (err) { cont.innerHTML = emptyHTML('⚠️', err.message); }
}
function filterSubjectResults() {
  var cont = $('subjectResultsList'); if (!cont || !_allSubjectResults) return;
  var q = (getVal('srStudentFilter') || '').toLowerCase();
  var session = getVal('srSessionFilter') || '';
  var term = getVal('srTermFilter') || '';
  var cls = getVal('srClassFilter') || '';
  var subject = getVal('srSubjectFilter') || '';
  var status = getVal('srStatusFilter') || '';

  var filtered = _allSubjectResults.filter(function (r) {
    var s = r.student || {};
    var name = (s.firstName || r.studentName || '') + ' ' + (s.lastName || '');
    var matchQ = !q || name.toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q);
    var matchSess = !session || r.session === session;
    var matchTerm = !term || r.term === term;
    var matchCls = !cls || (r.class || s.class || '') === cls;
    var matchSubj = !subject || r.subject === subject;
    var matchStatus = !status || (status === 'released' ? r.released : !r.released);
    return matchQ && matchSess && matchTerm && matchCls && matchSubj && matchStatus;
  });

  /* Update summary stats */
  var uniqueStudents = new Set(filtered.map(function (r) { return sid(r.student); })).size;
  setText('srTotalStudents', uniqueStudents);
  setText('srTotalRecords', filtered.length);
  setText('srReleasedCount', filtered.filter(function (r) { return r.released; }).length);
  setText('srPendingCount', filtered.filter(function (r) { return !r.released; }).length);

  if (filtered.length === 0) { cont.innerHTML = emptyHTML('📋', 'No subject results match your filters. Teachers need to enter scores and submit them first.'); return; }

  /* Group by student for the compound view */
  var byStudent = {};
  filtered.forEach(function (r) {
    var studentKey = sid(r.student);
    if (!byStudent[studentKey]) {
      var s = r.student || {};
      byStudent[studentKey] = {
        id: studentKey,
        name: (s.firstName || r.studentName || '') + ' ' + (s.lastName || ''),
        class: r.class || (s.class || ''),
        username: s.username || '',
        subjects: []
      };
    }
    byStudent[studentKey].subjects.push(r);
  });

  var html = '';
  Object.values(byStudent).forEach(function (student) {
    var totalScore = student.subjects.reduce(function (a, r) { return a + r.totalScore; }, 0);
    var avg = student.subjects.length ? Math.round(totalScore / student.subjects.length) : 0;
    var allReleased = student.subjects.every(function (r) { return r.released; });

    html += '<div class="card" style="margin-bottom:16px;overflow:hidden">';
    /* Student header */
    html += '<div style="padding:14px 18px;background:var(--gradient);color:white;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
      + '<div><div style="font-family:var(--font-display);font-weight:800;font-size:1rem">' + student.name + '</div>'
      + '<div style="font-size:.82rem;opacity:.85">@' + student.username + ' · Class: ' + student.class + '</div></div>'
      + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
      + '<span style="background:rgba(255,255,255,.2);border-radius:99px;padding:3px 12px;font-size:.8rem">Avg: ' + avg + '%</span>'
      + (!allReleased ? '<button class="btn-sm" style="background:rgba(255,255,255,.9);color:var(--admin-primary);font-weight:700;border:none;border-radius:8px;padding:6px 12px;cursor:pointer" onclick="releaseStudentResults(\'' + student.id + '\')">📤 Release All</button>' : '<span style="background:rgba(255,255,255,.2);border-radius:99px;padding:3px 12px;font-size:.8rem">✅ All Released</span>')
      + '</div></div>';

    /* Subject table */
    html += '<div style="overflow-x:auto"><table class="data-table">';
    html += '<thead><tr><th>Subject</th><th>Session</th><th>Term</th><th>Obj (20)</th><th>Theory (40)</th><th>Test (40)</th><th>Total (100)</th><th>Grade</th><th>Remark</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    student.subjects.forEach(function (r) {
      var gc = gradeColor(r.grade);
      html += '<tr>'
        + '<td><strong>' + r.subject + '</strong></td>'
        + '<td>' + r.session + '</td>'
        + '<td>' + r.term + '</td>'
        + '<td>' + r.objScore + '/20</td>'
        + '<td>' + r.theoryScore + '/40</td>'
        + '<td>' + (r.testScore > 0 ? r.testScore : '—') + '/40</td>'
        + '<td><strong style="color:var(--primary)">' + r.totalScore + '</strong>/100</td>'
        + '<td><span style="font-weight:800;color:' + gc + '">' + r.grade + '</span></td>'
        + '<td style="font-size:.82rem;color:var(--text-2)">' + r.remark + '</td>'
        + '<td><span class="badge ' + (r.released ? 'badge-approved' : 'badge-pending') + '">' + (r.released ? 'Released' : 'Pending') + '</span></td>'
        + '<td>' + (r.released ? '—' : '<button class="btn-success btn-sm" onclick="releaseSubjectResult(\'' + r._id + '\',\'' + student.id + '\',\'' + r.subject + '\')">📤</button>') + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
  });

  cont.innerHTML = html;
}

async function releaseSubjectResult(resultId, studentId, subject) {
  try {
    await Api.put('/subject-results/' + resultId + '/release', {});
    await addNotification(studentId, subject + ' result has been released. Check your Academic Report.');
    showToast(subject + ' result released!', 'success');
    await loadAdminSubjectResults();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function releaseStudentResults(studentId) {
  /* Release all pending subject results for one student */
  var pending = _allSubjectResults.filter(function (r) { return sid(r.student) === studentId && !r.released; });
  if (pending.length === 0) { showToast('All results already released.', 'info'); return; }
  try {
    for (var i = 0; i < pending.length; i++) {
      await Api.put('/subject-results/' + pending[i]._id + '/release', {});
    }
    await addNotification(studentId, 'All your subject results have been released. Check your Academic Report.');
    showToast('All ' + pending.length + ' results released for this student!', 'success');
    await loadAdminSubjectResults();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function bulkReleaseSubjectResults() {
  var session = getVal('srSessionFilter'), term = getVal('srTermFilter'), cls = getVal('srClassFilter');
  var desc = [session, term, cls].filter(Boolean).join(' · ') || 'all filtered';
  confirm2('Bulk Release', 'Release all pending subject results for: ' + desc + '?', async function () {
    try {
      var body = {}; if (session) body.session = session; if (term) body.term = term; if (cls) body.class = cls;
      await Api.put('/subject-results/release-bulk', body);
      showToast('All matching results released!', 'success');
      await loadAdminSubjectResults();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });
}

function exportResultsCSV() {
  if (!_allSubjectResults.length) { showToast('No results to export.', 'info'); return; }
  var rows = [['Student', 'Class', 'Subject', 'Session', 'Term', 'Obj(20)', 'Theory(40)', 'Test(40)', 'Total(100)', 'Grade', 'Remark', 'Status']];
  _allSubjectResults.forEach(function (r) {
    var s = r.student || {};
    rows.push([(s.firstName || r.studentName || '') + ' ' + (s.lastName || ''), r.class || (s.class || ''), r.subject, r.session, r.term, r.objScore, r.theoryScore, r.testScore, r.totalScore, r.grade, r.remark, r.released ? 'Released' : 'Pending']);
  });
  var csv = rows.map(function (row) { return row.map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'EduPortal_Results.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   TEACHER PORTAL
   ═══════════════════════════════════════════════════════════ */
function initTeacherPortal() {
  var s = Session.get(); if (!s || s.role !== 'teacher') { window.location.href = 'index.html'; return; }

  // Verify approval status
  checkAccountApproval();

  var first = (s.name || 'Teacher').split(' ')[0];
  setText('welcomeName', first); setText('sidebarName', s.name || 'Teacher'); setText('topbarUser', first);
  var av = $('sidebarAvatar'); if (av) av.textContent = (s.name || 'T')[0].toUpperCase();
  applySchoolName(s);
  renderTeacherOverview(s); renderNotifications(s.username);
}

/* ═══════════════════════════════════════════════════════════
   SCHOOL NAME — populate sidebar + welcome banner on any dashboard.
   Uses the schoolName on the session (set by /auth/login).
   ═══════════════════════════════════════════════════════════ */
function applySchoolName(s) {
  var name = (s && s.schoolName) ? s.schoolName : '';
  var sidebarEl = $('sidebarSchool');
  if (sidebarEl) sidebarEl.textContent = name || '—';
  var welcomeEl = $('welcomeSchool');
  if (welcomeEl) welcomeEl.textContent = name ? ('🏫 ' + name) : '';
  if (name) document.title = name + ' — EduPortal';
}

async function renderTeacherOverview(s) {
  try {
    var exams = await Api.get('/exams'), results = await Api.get('/results');
    var myExams = exams.filter(function (e) { return e.createdByName === s.name || e.createdBy === s.username; });
    var myIds = myExams.map(function (e) { return String(e._id); });
    var subs = results.filter(function (r) { return myIds.includes(sid(r.exam)); });
    setText('teacherStatExams', myExams.length);
    setText('teacherStatPending', myExams.filter(function (e) { return e.status === 'pending'; }).length);
    setText('teacherStatApproved', myExams.filter(function (e) { return e.status === 'approved'; }).length);
    setText('teacherStatSubmissions', subs.length);
    var oe = $('teacherOverviewExams');
    if (oe) { oe.innerHTML = myExams.length === 0 ? emptyHTML('📝', 'No exams created yet') : myExams.slice(-4).reverse().map(function (e) { return '<div class="overview-item"><div><div class="overview-item-title">' + e.title + '</div><div class="overview-item-sub">' + e.subject + ' · ' + e.targetClass + ' · ' + (e.totalMarks || 0) + ' marks</div></div><span class="badge badge-' + e.status + '">' + cap(e.status) + '</span></div>'; }).join(''); }
    var os = $('teacherOverviewSubmissions');
    if (os) { os.innerHTML = subs.length === 0 ? emptyHTML('📬', 'No submissions yet') : subs.slice(-4).reverse().map(function (r) { return '<div class="overview-item"><div><div class="overview-item-title">' + (r.studentName || '') + '</div><div class="overview-item-sub">' + (r.examTitle || '') + '</div></div><div style="font-weight:800;color:var(--primary)">' + r.totalScore + '/' + r.grandTotal + '</div></div>'; }).join(''); }
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function renderTeacherMyExams(s) {
  var list = $('myExamsList'); if (!list) return;
  list.innerHTML = loadingHTML('Loading your exams…');
  try {
    var exams = await Api.get('/exams');
    var myExams = exams.filter(function (e) { return e.createdByName === s.name || e.createdBy === s.username; });
    if (myExams.length === 0) { list.innerHTML = emptyHTML('📝', 'No exams yet.'); return; }
    list.innerHTML = myExams.map(function (e) { var qc = (e.questions || []).length + (e.theoryQuestions || []).length; return '<div class="queue-card"><div class="queue-card-info"><div class="queue-card-title">' + e.title + '</div><div class="queue-card-meta"><span>📚 ' + e.subject + '</span><span>🏫 ' + e.targetClass + '</span><span>❓ ' + qc + ' Qs</span><span>⏱ ' + e.duration + 'min</span><span>🏆 ' + (e.totalMarks || 0) + ' marks</span></div></div><span class="badge badge-' + e.status + '">' + cap(e.status) + '</span></div>'; }).join('');
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}

async function renderTeacherSubmissions(s) {
  var list = $('submissionsList'); if (!list) return;
  list.innerHTML = loadingHTML('Loading submissions…');
  try {
    var exams = await Api.get('/exams'), results = await Api.get('/results');
    var myIds = exams.filter(function (e) { return e.createdByName === s.name || e.createdBy === s.username; }).map(function (e) { return String(e._id); });
    var subs = results.filter(function (r) { return myIds.includes(sid(r.exam)); });
    if (subs.length === 0) { list.innerHTML = emptyHTML('📬', 'No submissions yet.'); return; }
    list.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>'
      + '<th>#</th><th>Student</th><th>Exam</th><th>Obj(20)</th><th>Theory(40)</th><th>Total</th><th>%</th><th>Grade</th><th>Status</th>'
      + '</tr></thead><tbody>'
      + subs.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td>' + (r.studentName || '') + '</td><td>' + (r.examTitle || '') + '</td><td>' + r.objScore + '/' + r.objTotal + '</td><td>' + (r.theoryScore !== null && r.theoryScore !== undefined ? r.theoryScore + '/' + r.theoryTotal : '<span style="color:var(--text-3)">Pending</span>') + '</td><td><strong>' + r.totalScore + '/' + r.grandTotal + '</strong></td><td>' + r.percent + '%</td><td><span class="badge ' + gradeBadge(r.grade) + '">' + r.grade + '</span></td><td><span class="badge badge-' + r.status + '">' + cap(r.status) + '</span></td></tr>'; }).join('')
      + '</tbody></table></div>';
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}

/* THEORY MARKING */
async function renderTeacherMarking(s) {
  var list = $('markingList'); if (!list) return;
  list.innerHTML = loadingHTML('Loading…');
  try {
    var exams = await Api.get('/exams'), results = await Api.get('/results');
    var myIds = exams.filter(function (e) { return e.createdByName === s.name || e.createdBy === s.username; }).map(function (e) { return String(e._id); });
    var pending = results.filter(function (r) { return myIds.includes(sid(r.exam)) && r.status === 'submitted'; });
    if (pending.length === 0) { list.innerHTML = emptyHTML('✔️', 'No submissions pending. All done!'); return; }
    list.innerHTML = pending.map(function (r) {
      var hasT = (r.theoryAnswers || []).length > 0;
      return '<div class="marking-card"><div class="marking-card-header"><div>'
        + '<div class="marking-card-title">' + (r.studentName || '') + ' — ' + (r.examTitle || '') + '</div>'
        + '<div style="font-size:.8rem;color:var(--text-2)">Obj: ' + r.objScore + '/' + r.objTotal + (hasT ? ' · Theory requires marking (' + r.theoryTotal + ' marks available)' : '') + '</div>'
        + '</div><div style="display:flex;gap:8px;flex-wrap:wrap">'
        + (hasT ? '<button class="btn-primary btn-sm" onclick="openTheoryMarking(\'' + r._id + '\')">✍️ Mark Theory</button>' : '')
        + '<button class="btn-success btn-sm" onclick="submitResultToAdmin(\'' + r._id + '\')">📤 Submit to Admin</button>'
        + '</div></div>'
        + (hasT && (r.theoryScore === null || r.theoryScore === undefined) ? '<div style="font-size:.82rem;color:#d97706;margin-top:6px;padding:8px 10px;background:#fef9c3;border-radius:6px">⚠️ Theory not yet marked. Please mark theory before submitting so students get their full score.</div>' : '')
        + '</div>';
    }).join('');
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}

async function openTheoryMarking(resultId) {
  try {
    var results = await Api.get('/results');
    var r = results.find(function (x) { return String(x._id) === String(resultId); });
    if (!r) return;
    var html = '<div style="padding:20px">'
      + '<h4 style="font-family:var(--font-display);margin-bottom:4px">Mark Theory Answers</h4>'
      + '<p style="font-size:.83rem;color:var(--text-2);margin-bottom:16px">Student: <strong>' + (r.studentName || '') + '</strong> — Award marks for each answer. Marks are added immediately to their total.</p>';
    (r.theoryAnswers || []).forEach(function (a, i) {
      html += '<div class="preview-q-block">'
        + '<div class="preview-q-meta"><span class="preview-q-num">Q' + (i + 1) + '</span><span class="preview-marks-tag">Max: ' + a.maxMarks + ' marks</span></div>'
        + '<div class="preview-q-text">' + (a.questionText || '') + '</div>'
        + (a.guide ? '<div class="preview-theory-guide">📋 Marking Guide: ' + a.guide + '</div>' : '')
        + '<div style="margin:10px 0"><label style="font-size:.8rem;font-weight:700;color:var(--text-2)">Student\'s Answer:</label>'
        + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:.88rem;margin-top:4px;white-space:pre-wrap;min-height:40px">' + (a.answer || '<em style="color:var(--text-3)">No answer provided</em>') + '</div></div>'
        + '<div class="marks-row"><label>Marks Awarded:</label>'
        + '<input type="number" class="marks-input" id="theory_mark_' + i + '" value="' + (a.marksAwarded || 0) + '" min="0" max="' + a.maxMarks + '" step="0.5"/>'
        + '<span class="marks-note">out of ' + a.maxMarks + '</span></div></div>';
    });
    html += '</div>';
    $('examPreviewContent').innerHTML = html;
    $('examPreviewActions').innerHTML = '<button class="btn-secondary" onclick="closeExamPreview()">Cancel</button>'
      + '<button class="btn-primary" onclick="saveTheoryMarks(\'' + resultId + '\',' + (r.theoryAnswers || []).length + ',' + r.grandTotal + ',' + r.objScore + ')">💾 Save Marks</button>';
    $('examPreviewOverlay').classList.remove('hidden');
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function saveTheoryMarks(resultId, count, grandTotal, objScore) {
  var totalTheory = 0, awards = [];
  for (var i = 0; i < count; i++) {
    var el = document.getElementById('theory_mark_' + i);
    var v = el ? parseFloat(el.value) || 0 : 0;
    awards.push(v); totalTheory += v;
  }
  var newTotal = objScore + totalTheory;
  var percent = grandTotal > 0 ? Math.round((newTotal / grandTotal) * 100) : 0;
  var grade = calcGrade(percent);
  try {
    var results = await Api.get('/results');
    var r = results.find(function (x) { return String(x._id) === String(resultId); });
    var updatedAnswers = (r.theoryAnswers || []).map(function (a, i) { return Object.assign({}, a, { marksAwarded: awards[i] }); });
    await Api.put('/results/' + resultId, { theoryAnswers: updatedAnswers, theoryScore: totalTheory, totalScore: newTotal, percent, grade });
    closeExamPreview();
    showToast('Theory marks saved! New total: ' + newTotal + '/' + grandTotal, 'success');
    renderTeacherMarking(Session.get());
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function submitResultToAdmin(resultId) {
  try {
    await Api.put('/results/' + resultId, { status: 'marked' });
    await addNotification('admin', 'New exam result submitted by teacher and ready for release.');
    showToast('Result submitted to Admin!', 'success');
    renderTeacherMarking(Session.get());
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

function renderTeacherProfile(s) {
  var cont = $('profileContent'); if (!cont) return;
  cont.innerHTML = '<div class="profile-card">'
    + '<div class="profile-avatar-lg">' + (s.name || 'T')[0].toUpperCase() + '</div>'
    + '<div class="profile-name">' + (s.name || '') + '</div>'
    + '<span class="badge badge-active">Teacher</span>'
    + '<div class="profile-fields">'
    + '<div class="profile-field"><span class="profile-field-label">Username</span><span class="profile-field-value">@' + (s.username || '') + '</span></div>'
    + '<div class="profile-field"><span class="profile-field-label">Subject</span><span class="profile-field-value">' + (s.subject || '—') + '</span></div>'
    + '<div class="profile-field"><span class="profile-field-label">Email</span><span class="profile-field-value">' + (s.email || '—') + '</span></div>'
    + '</div></div>'
    + '<div class="change-password-card" style="margin-top:30px;padding:20px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">'
    + '<h3 style="margin-bottom:15px;color:var(--text);font-size:16px">🔑 Change Password</h3>'
    + '<form onsubmit="handleChangePassword(event)" style="display:flex;flex-direction:column;gap:12px">'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">Current Password</label>'
    + '<div style="display:flex;gap:8px">'
    + '<input type="password" id="currentPassword" placeholder="Enter your current password" required style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '</div>'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">New Password</label>'
    + '<input type="password" id="newPassword" placeholder="At least 8 characters" minlength="8" required style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '<div class="form-group" style="margin:0">'
    + '<label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text)">Confirm New Password</label>'
    + '<input type="password" id="confirmPassword" placeholder="Repeat your new password" minlength="8" required style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:13px"/>'
    + '</div>'
    + '<div class="form-error" id="changePasswordError" style="font-size:12px;color:#c62828;display:none;padding:10px;background:#ffebee;border-radius:4px;border-left:3px solid #c62828"></div>'
    + '<div class="form-success" id="changePasswordSuccess" style="font-size:12px;color:#2e7d32;display:none;padding:10px;background:#e8f5e9;border-radius:4px;border-left:3px solid #2e7d32"></div>'
    + '<button type="submit" style="padding:10px;background:#1E40AF;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;transition:all 0.3s">💾 Update Password</button>'
    + '</form>'
    + '</div>';
}

/* TEST SCORE ENTRY */
var _tsStudents = [];
function renderTestScoresSection() {
  var list = $('testScoresList'); if (!list) return;
  list.innerHTML = emptyHTML('📝', 'Select subject, class, session and term above, then click "Load Students".');
}
async function loadTestScoreStudents() {
  var subject = getVal('tsSubject'), cls = getVal('tsClass'), session = getVal('tsSession').trim(), term = getVal('tsTerm');
  var list = $('testScoresList'); if (!list) return;
  if (!subject || !cls || !session || !term) {
    list.innerHTML = emptyHTML('📝', 'Please fill in all four fields above (subject, class, session, term) then click Load Students.'); return;
  }
  list.innerHTML = loadingHTML('Loading students for ' + cls + '…');
  try {
    // Use /students/by-class — accessible to teachers (scoped to their school by the backend)
    var encodedClass = encodeURIComponent(cls);
    _tsStudents = await Api.get('/students/by-class?class=' + encodedClass);
    var allScores = await Api.get('/test-scores');
    var existing = {};
    allScores.forEach(function (ts) {
      if (ts.subject === subject && ts.session === session && ts.term === term) {
        var k = sid(ts.student); existing[k] = ts;
      }
    });
    if (_tsStudents.length === 0) { list.innerHTML = emptyHTML('🎒', 'No approved students found in class ' + cls + '. Make sure students are registered and approved by Admin.'); return; }
    var tSession = Session.get();
    var html = '<div class="card" style="overflow:hidden">'
      + '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
      + '<span>📝 ' + subject + ' — ' + cls + ' — ' + session + ' — ' + term + '</span>'
      + '<button class="btn-primary" onclick="saveAllTestScores()">💾 Save All Scores</button>'
      + '</div>'
      + '<div style="overflow-x:auto"><table class="data-table"><thead><tr>'
      + '<th>#</th><th>Student</th><th>Score (0–40)</th><th>Remarks</th><th>Status</th>'
      + '</tr></thead><tbody>';
    _tsStudents.forEach(function (st, i) {
      var k = String(st._id); var ex = existing[k];
      html += '<tr>'
        + '<td>' + (i + 1) + '</td>'
        + '<td><strong>' + st.firstName + ' ' + st.lastName + '</strong><br><small style="color:var(--text-3)">@' + st.username + '</small></td>'
        + '<td><input type="number" id="ts_score_' + k + '" value="' + (ex ? ex.score : '') + '" min="0" max="40" step="0.5" placeholder="Enter 0–40" style="width:110px;text-align:center;font-weight:700;font-family:var(--font-display)"/></td>'
        + '<td><input type="text" id="ts_remark_' + k + '" value="' + (ex && ex.remarks ? ex.remarks : '') + '" placeholder="Optional remarks" style="min-width:150px"/></td>'
        + '<td><span class="badge ' + (ex ? (ex.released ? 'badge-approved' : 'badge-pending') : '') + '">' + (ex ? (ex.released ? 'Released' : 'Submitted') : 'Not entered') + '</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    list.innerHTML = html;
  } catch (err) { list.innerHTML = emptyHTML('⚠️', err.message); }
}
async function saveAllTestScores() {
  var subject = getVal('tsSubject'), cls = getVal('tsClass'), session = getVal('tsSession').trim(), term = getVal('tsTerm');
  var s = Session.get();
  if (!subject || !cls || !session || !term) { showToast('Please fill all filter fields.', 'error'); return; }
  if (_tsStudents.length === 0) { showToast('No students loaded. Click "Load Students" first.', 'error'); return; }
  var saved = 0, skipped = 0, errors = 0;
  for (var i = 0; i < _tsStudents.length; i++) {
    var st = _tsStudents[i]; var k = String(st._id);
    var scoreEl = document.getElementById('ts_score_' + k);
    if (!scoreEl || scoreEl.value === '') { skipped++; continue; }
    var score = parseFloat(scoreEl.value);
    if (isNaN(score) || score < 0 || score > 40) { showToast('Invalid score for ' + st.firstName + '. Must be 0–40.', 'error'); errors++; continue; }
    var remarkEl = document.getElementById('ts_remark_' + k);
    try {
      await Api.post('/test-scores', {
        student: k, studentName: st.firstName + ' ' + st.lastName,
        subject, class: cls, session, term, score,
        remarks: remarkEl ? remarkEl.value : '',
        enteredBy: s ? s.username : '', enteredByName: s ? s.name : ''
      });
      saved++;
    } catch (err) { errors++; console.error('[saveAllTestScores]', err.message); }
  }
  if (saved > 0) {
    await addNotification('admin', 'Test scores submitted by ' + (s ? s.name : 'teacher') + ' — ' + subject + ' · ' + cls + ' · ' + session + ' ' + term + '. ' + saved + ' students recorded.');
    showToast('✅ Saved ' + saved + ' score(s)' + (skipped ? ' (' + skipped + ' skipped — no score entered)' : '') + (errors ? ' ⚠️ ' + errors + ' error(s)' : ''), saved > 0 ? 'success' : 'error');
    await loadTestScoreStudents();
  } else {
    showToast('No scores saved. Please enter at least one score.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  /* Load school dropdown on the public auth page (index.html) */
  loadSchoolsIntoDropdown();
  document.addEventListener('click', function (e) {
    var nd = $('notifDropdown');
    if (nd && !nd.classList.contains('hidden') && !e.target.closest('.notif-btn') && !e.target.closest('.notif-dropdown'))
      nd.classList.add('hidden');
  });
  var page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'student.html') initStudentPortal();
  else if (page === 'admin.html') initAdminPortal();
  else if (page === 'teacher.html') initTeacherPortal();
  else {
    var s = Session.get(), t = localStorage.getItem('edu_token');
    if (s && t) {
      var routes = { student: 'student.html', admin: 'admin.html', teacher: 'teacher.html' };
      if (routes[s.role]) { window.location.href = routes[s.role]; return; }
    }
    var btn = $('themeToggle');
    if (btn) { btn.addEventListener('click', toggleTheme); var theme = document.documentElement.getAttribute('data-theme'); btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️'; }
  }
});

/* ════════════════════════════════════════════════════════════
   Populate the school dropdown on the register form.
   Safe to call on any page — it no-ops if #regSchool isn't
   present.
   ════════════════════════════════════════════════════════════ */
async function loadSchoolsIntoDropdown() {
  var sel = document.getElementById('regSchool');
  if (!sel) return;
  try {
    var res = await fetch('/api/schools/list');
    var data = await res.json();
    var schools = (data && data.schools) || [];
    if (!schools.length) {
      sel.innerHTML = '<option value="">No schools available — contact support</option>';
      return;
    }
    var html = '<option value="">-- Select your school --</option>';
    for (var i = 0; i < schools.length; i++) {
      var s = schools[i];
      html += '<option value="' + s._id + '">' + s.name + (s.city ? ' — ' + s.city : '') + '</option>';
    }
    sel.innerHTML = html;
  } catch (err) {
    console.error('loadSchoolsIntoDropdown error:', err);
    sel.innerHTML = '<option value="">Failed to load schools. Refresh the page.</option>';
  }
}

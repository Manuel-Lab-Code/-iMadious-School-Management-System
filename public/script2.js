/* ═══════════════════════════════════════════════════════════
   EduPortal — script.js
   Complete application logic for all three portals.
   Uses localStorage for persistence (no backend required).
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── PREDEFINED CREDENTIALS ──────────────────────────────── */
const PREDEFINED_USERS = {
  admin: {
    username: 'admin',
    password: 'Admin@123',
    role: 'admin',
    name: 'Administrator'
  },
  teachers: [
    { username: 'teacher1', password: 'Teacher@1', role: 'teacher', name: 'Mrs. Adaeze Okafor', subject: 'Mathematics' },
    { username: 'teacher2', password: 'Teacher@2', role: 'teacher', name: 'Mr. Emeka Nwosu',    subject: 'English Language' },
    { username: 'teacher3', password: 'Teacher@3', role: 'teacher', name: 'Dr. Ngozi Eze',      subject: 'Biology' },
    { username: 'teacher4', password: 'Teacher@4', role: 'teacher', name: 'Mr. Chidi Obi',      subject: 'Physics' },
    { username: 'teacher5', password: 'Teacher@5', role: 'teacher', name: 'Mrs. Amaka Dike',    subject: 'Chemistry' },
  ]
};

/* ── SUBJECTS LIST ───────────────────────────────────────── */
const SUBJECTS = [
  { name: 'Mathematics',          icon: '🔢' },
  { name: 'English Language',     icon: '📖' },
  { name: 'Biology',              icon: '🧬' },
  { name: 'Chemistry',            icon: '⚗️' },
  { name: 'Physics',              icon: '⚡' },
  { name: 'Geography',            icon: '🌍' },
  { name: 'History',              icon: '📜' },
  { name: 'Economics',            icon: '📈' },
  { name: 'Government',           icon: '🏛️' },
  { name: 'Literature',           icon: '📚' },
  { name: 'Agricultural Science', icon: '🌱' },
  { name: 'Computer Science',     icon: '💻' },
];

/* ── STORAGE HELPERS ─────────────────────────────────────── */
const Store = {
  get: (key, def = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  remove: (key) => { localStorage.removeItem(key); }
};

/* ── SESSION ─────────────────────────────────────────────── */
const Session = {
  get: () => Store.get('edu_session'),
  set: (data) => Store.set('edu_session', data),
  clear: () => Store.remove('edu_session')
};

/* ── INITIALISE DEFAULT DATA ─────────────────────────────── */
function initDefaultData() {
  // Seed students if none exist
  if (!Store.get('edu_students')) {
    Store.set('edu_students', [
      { id: 's1', firstName: 'Chioma', lastName: 'Okonkwo', username: 'chioma', password: 'Student@1', email: 'chioma@school.ng', class: 'SSS 2', createdAt: '2025-09-01' },
      { id: 's2', firstName: 'Tunde',  lastName: 'Adeyemi', username: 'tunde',  password: 'Student@2', email: 'tunde@school.ng',  class: 'SSS 1', createdAt: '2025-09-02' },
      { id: 's3', firstName: 'Fatima', lastName: 'Bello',   username: 'fatima', password: 'Student@3', email: 'fatima@school.ng', class: 'JSS 3', createdAt: '2025-09-03' },
    ]);
  }
  // Seed fees
  if (!Store.get('edu_fees')) {
    Store.set('edu_fees', {
      s1: { total: 85000, paid: 85000, status: 'paid' },
      s2: { total: 85000, paid: 42500, status: 'partial' },
      s3: { total: 75000, paid: 0,     status: 'unpaid' },
    });
  }
  // Seed sample exams
  if (!Store.get('edu_exams')) {
    Store.set('edu_exams', [
      {
        id: 'ex1',
        title: 'Mathematics Mid-Term Exam',
        subject: 'Mathematics',
        targetClass: 'SSS 2',
        duration: 20,
        createdBy: 'teacher1',
        createdByName: 'Mrs. Adaeze Okafor',
        status: 'approved',  // pending | approved | rejected | active
        createdAt: '2025-09-10',
        questions: [
          { id:'q1', text:'What is 2 + 2 × 3?', options:['10','8','6','12'], answer:1 },
          { id:'q2', text:'What is the square root of 144?', options:['11','12','13','14'], answer:1 },
          { id:'q3', text:'Solve: 5x = 25. What is x?', options:['4','5','6','7'], answer:1 },
          { id:'q4', text:'What is the area of a circle with radius 7? (use π=22/7)', options:['154','144','164','174'], answer:0 },
          { id:'q5', text:'What is 15% of 200?', options:['25','30','35','20'], answer:1 },
        ]
      },
      {
        id: 'ex2',
        title: 'English Language Quiz',
        subject: 'English Language',
        targetClass: 'SSS 2',
        duration: 15,
        createdBy: 'teacher2',
        createdByName: 'Mr. Emeka Nwosu',
        status: 'approved',
        createdAt: '2025-09-12',
        questions: [
          { id:'q1', text:'Which of these is a noun?', options:['Run','Beautiful','Happiness','Quickly'], answer:2 },
          { id:'q2', text:'Choose the correct spelling:', options:['Accomodate','Accommodate','Acomodate','Acommodate'], answer:1 },
          { id:'q3', text:'"She _____ already eaten." Fill in the blank:', options:['has','have','had','is'], answer:0 },
          { id:'q4', text:'What is a synonym for "Happy"?', options:['Sad','Angry','Joyful','Tired'], answer:2 },
          { id:'q5', text:'Identify the verb: "The dog runs fast."', options:['dog','runs','fast','The'], answer:1 },
        ]
      },
      {
        id: 'ex3',
        title: 'Biology Fundamentals',
        subject: 'Biology',
        targetClass: 'JSS 3',
        duration: 25,
        createdBy: 'teacher3',
        createdByName: 'Dr. Ngozi Eze',
        status: 'pending',
        createdAt: '2025-09-15',
        questions: [
          { id:'q1', text:'What is the powerhouse of the cell?', options:['Nucleus','Mitochondria','Ribosome','Vacuole'], answer:1 },
          { id:'q2', text:'How many chromosomes do humans have?', options:['23','44','46','48'], answer:2 },
          { id:'q3', text:'What gas do plants absorb during photosynthesis?', options:['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], answer:2 },
          { id:'q4', text:'What organ pumps blood in the body?', options:['Liver','Kidney','Lungs','Heart'], answer:3 },
        ]
      }
    ]);
  }
  // Seed student results
  if (!Store.get('edu_results')) {
    Store.set('edu_results', []);
  }
  // Seed notifications
  if (!Store.get('edu_notifications')) {
    Store.set('edu_notifications', {});
  }
}

/* ═══════════════════════════════════════════════════════════
   AUTHENTICATION
   ═══════════════════════════════════════════════════════════ */

// ── FILL DEMO CREDENTIALS ──────────────────────────────── //
function fillDemo(role) {
  if (role === 'admin') {
    setVal('loginUsername', 'admin');
    setVal('loginPassword', 'Admin@123');
    setVal('loginRole', 'admin');
  } else if (role === 'teacher') {
    setVal('loginUsername', 'teacher1');
    setVal('loginPassword', 'Teacher@1');
    setVal('loginRole', 'teacher');
  } else {
    setVal('loginUsername', 'chioma');
    setVal('loginPassword', 'Student@1');
    setVal('loginRole', 'student');
  }
  showToast('Demo credentials filled!', 'info'); //change
}

// ── SWITCH TABS ────────────────────────────────────────── //
function switchTab(tab) {
  const loginForm = $('loginForm'), regForm = $('registerForm');
  const loginTab = $('loginTab'), regTab = $('registerTab');
  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    loginTab.classList.add('active');
    regTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    regTab.classList.add('active');
  }
}

// ── HANDLE LOGIN ───────────────────────────────────────── //
function handleLogin(e) {
  e.preventDefault();
  const username = getVal('loginUsername').trim();
  const password = getVal('loginPassword').trim();
  const role     = getVal('loginRole');
  const errEl    = $('loginError');

  if (!username || !password || !role) {
    return showError(errEl, 'Please fill in all fields.');
  }
  hideError(errEl);

  // Admin check
  if (role === 'admin') {
    if (username === PREDEFINED_USERS.admin.username && password === PREDEFINED_USERS.admin.password) {
      Session.set({ username, role: 'admin', name: 'Administrator' });
      window.location.href = 'admin.html';
    } else {
      showError(errEl, 'Invalid admin credentials.');
    }
    return;
  }

  // Teacher check
  if (role === 'teacher') {
    const teacher = PREDEFINED_USERS.teachers.find(t => t.username === username && t.password === password);
    if (teacher) {
      Session.set({ username, role: 'teacher', name: teacher.name, subject: teacher.subject });
      window.location.href = 'teacher.html';
    } else {
      showError(errEl, 'Invalid teacher credentials.');
    }
    return;
  }

  // Student check
  const students = Store.get('edu_students', []);
  const student  = students.find(s => s.username === username && s.password === password);
  if (student) {
    Session.set({ username, role: 'student', name: `${student.firstName} ${student.lastName}`, studentId: student.id });
    window.location.href = 'student.html';
  } else {
    showError(errEl, 'Invalid username or password.');
  }
}

// ── HANDLE REGISTER ────────────────────────────────────── //
function handleRegister(e) {
  e.preventDefault();
  const firstName = getVal('regFirstName').trim();
  const lastName  = getVal('regLastName').trim();
  const username  = getVal('regUsername').trim();
  const email     = getVal('regEmail').trim();
  const cls       = getVal('regClass');
  const password  = getVal('regPassword');
  const confirm   = getVal('regConfirm');
  const errEl     = $('registerError');
  const sucEl     = $('registerSuccess');

  hideError(errEl); hideSuccess(sucEl);

  if (!firstName || !lastName || !username || !email || !cls || !password || !confirm)
    return showError(errEl, 'Please fill in all fields.');
  if (password.length < 6)
    return showError(errEl, 'Password must be at least 6 characters.');
  if (password !== confirm)
    return showError(errEl, 'Passwords do not match.');

  const students = Store.get('edu_students', []);
  if (students.find(s => s.username === username))
    return showError(errEl, 'That username is already taken.');

  const id = 's' + Date.now();
  students.push({ id, firstName, lastName, username, password, email, class: cls, createdAt: new Date().toISOString().split('T')[0] });
  Store.set('edu_students', students);

  // Init fee record
  const fees = Store.get('edu_fees', {});
  fees[id] = { total: 85000, paid: 0, status: 'unpaid' };
  Store.set('edu_fees', fees);

  showSuccess(sucEl, '✅ Account created! You can now sign in.');
  setTimeout(() => switchTab('login'), 1500);
}

// ── LOGOUT ─────────────────────────────────────────────── //
function logout() {
  confirm2('Logout', 'Are you sure you want to logout?', () => {
    Session.clear();
    window.location.href = 'index.html';
  });
}

/* ═══════════════════════════════════════════════════════════
   SHARED DASHBOARD UTILITIES
   ═══════════════════════════════════════════════════════════ */

// ── SECTION SWITCHING ──────────────────────────────────── //
function showSection(name) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = $('section-' + name);
  if (sec) sec.classList.add('active');
  document.querySelectorAll(`[data-section="${name}"]`).forEach(n => n.classList.add('active'));
  // Update topbar title
  const titleEl = $('topbarTitle');
  if (titleEl) {
    const map = {
      overview:'Dashboard', subjects:'Subjects', exams:'Examinations', results:'Results',
      fees:'School Fees', profile:'My Profile', students:'Student Management',
      teachers:'Teacher Accounts', 'create-exam':'Create Exam', 'my-exams':'My Exams',
      submissions:'Student Submissions', marking:'Mark & Submit Results',
      'admin-exams':'Exam Approval', 'admin-results':'Release Results', 'admin-fees':'School Fees'
    };
    titleEl.textContent = map[name] || 'Dashboard';
  }
  closeSidebar();
  // Re-render on switch
  renderSectionContent(name);
}

// ── SIDEBAR ────────────────────────────────────────────── //
function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
}

// ── THEME ──────────────────────────────────────────────── //
function initTheme() {
  const stored = Store.get('edu_theme', 'light');
  document.documentElement.setAttribute('data-theme', stored);
  updateThemeIcons(stored);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  Store.set('edu_theme', next);
  updateThemeIcons(next);
  // For auth page toggle
  const btn = $('themeToggle');
  if (btn) btn.querySelector('.theme-icon').textContent = next === 'dark' ? '🌙' : '☀️';
}
function updateThemeIcons(theme) {
  const icon = theme === 'dark' ? '🌙' : '☀️';
  document.querySelectorAll('#themeIconSide').forEach(el => el.textContent = icon);
  const btn = $('themeToggle');
  if (btn) btn.querySelector('.theme-icon').textContent = icon;
}

// ── NOTIFICATIONS ──────────────────────────────────────── //
function toggleNotif() {
  $('notifDropdown').classList.toggle('hidden');
}
function renderNotifications(userId) {
  const allNotifs = Store.get('edu_notifications', {});
  const my = allNotifs[userId] || [];
  const list = $('notifList');
  const badge = $('notifBadge');
  if (!list) return;
  const unread = my.filter(n => !n.read);
  badge.style.display = unread.length ? 'flex' : 'none';
  badge.textContent = unread.length;
  if (my.length === 0) {
    list.innerHTML = '<p class="notif-empty">No notifications</p>';
    return;
  }
  list.innerHTML = my.map(n => `
    <div class="notif-item">${n.message}<div style="font-size:.72rem;color:var(--text-3);margin-top:4px">${n.date}</div></div>
  `).join('');
  // Mark all read
  allNotifs[userId] = my.map(n => ({ ...n, read: true }));
  Store.set('edu_notifications', allNotifs);
}
function addNotification(userId, message) {
  const allNotifs = Store.get('edu_notifications', {});
  if (!allNotifs[userId]) allNotifs[userId] = [];
  allNotifs[userId].unshift({ message, date: new Date().toLocaleDateString(), read: false });
  Store.set('edu_notifications', allNotifs);
}

/* ═══════════════════════════════════════════════════════════
   STUDENT PORTAL
   ═══════════════════════════════════════════════════════════ */
let examTimerInterval = null;
let currentExam = null;

function initStudentPortal() {
  const session = Session.get();
  if (!session || session.role !== 'student') { window.location.href = 'index.html'; return; }

  // Fill name fields
  const name = session.name.split(' ')[0];
  setText('welcomeName', name);
  setText('sidebarName', session.name);
  setText('topbarUser', name);
  const av = $('sidebarAvatar');
  if (av) av.textContent = session.name[0].toUpperCase();

  renderStudentOverview(session);
  renderNotifications(session.studentId);
  renderSectionContent('overview');
}

function renderSectionContent(name) {
  const session = Session.get();
  if (!session) return;

  if (session.role === 'student') {
    if (name === 'overview') renderStudentOverview(session);
    else if (name === 'subjects') renderStudentSubjects(session);
    else if (name === 'exams') renderStudentExams(session);
    else if (name === 'results') renderStudentResults(session);
    else if (name === 'fees') renderStudentFees(session);
    else if (name === 'profile') renderStudentProfile(session);
  } else if (session.role === 'admin') {
    if (name === 'overview') renderAdminOverview();
    else if (name === 'students') renderStudentsTable();
    else if (name === 'teachers') renderTeachersTable();
    else if (name === 'exams') renderExamQueue('pending');
    else if (name === 'results') renderResultsRelease();
    else if (name === 'fees') renderFeesTable();
  } else if (session.role === 'teacher') {
    if (name === 'overview') renderTeacherOverview(session);
    else if (name === 'create-exam') initCreateExam();
    else if (name === 'my-exams') renderTeacherMyExams(session);
    else if (name === 'submissions') renderTeacherSubmissions(session);
    else if (name === 'marking') renderTeacherMarking(session);
  }
}

// ── STUDENT OVERVIEW ───────────────────────────────────── //
function renderStudentOverview(session) {
  const exams   = Store.get('edu_exams', []);
  const results = Store.get('edu_results', []);
  const fees    = Store.get('edu_fees', {});

  const student  = getStudent(session.studentId);
  const myClass  = student ? student.class : '';
  const active   = exams.filter(e => e.status === 'approved' && (e.targetClass === myClass || e.targetClass === 'All'));
  const myRes    = results.filter(r => r.studentId === session.studentId);
  const feeRec   = fees[session.studentId];

  // Stats
  setText('statExamsTaken', myRes.length);
  if (myRes.length) {
    const avg = Math.round(myRes.reduce((a, r) => a + r.percent, 0) / myRes.length);
    setText('statAvgScore', avg + '%');
  }
  setText('statSubjects', SUBJECTS.length);
  if (feeRec) {
    const labels = { paid:'✅ Paid', partial:'⚠️ Partial', unpaid:'❌ Unpaid' };
    setText('statFeeStatus', labels[feeRec.status] || '—');
  }

  // Overview exams list
  const oe = $('overviewExamsList');
  if (oe) {
    if (active.length === 0) {
      oe.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span>No exams available</div>';
    } else {
      oe.innerHTML = active.slice(0,4).map(e => {
        const taken = myRes.find(r => r.examId === e.id);
        return `<div class="overview-item">
          <div><div class="overview-item-title">${e.title}</div>
          <div class="overview-item-sub">${e.subject} · ${e.questions.length}Qs · ${e.duration}min</div></div>
          ${taken ? `<span class="badge badge-submitted">Done</span>` : `<span class="badge badge-active">Available</span>`}
        </div>`;
      }).join('');
    }
  }

  // Overview results list
  const or = $('overviewResultsList');
  if (or) {
    if (myRes.length === 0) {
      or.innerHTML = '<div class="empty-state"><span class="empty-icon">📊</span>No results yet</div>';
    } else {
      or.innerHTML = myRes.slice(-4).reverse().map(r => `
        <div class="overview-item">
          <div><div class="overview-item-title">${r.examTitle}</div>
          <div class="overview-item-sub">${r.subject}</div></div>
          <div style="text-align:right">
            <div style="font-weight:800;color:var(--primary)">${r.score}/${r.total}</div>
            <div style="font-size:.75rem;color:var(--text-2)">${r.grade}</div>
          </div>
        </div>`).join('');
    }
  }
}

// ── STUDENT SUBJECTS ───────────────────────────────────── //
function renderStudentSubjects() {
  const grid = $('subjectsGrid');
  if (!grid) return;
  grid.innerHTML = SUBJECTS.map(s => `
    <div class="subject-card">
      <div class="subject-icon">${s.icon}</div>
      <div class="subject-name">${s.name}</div>
    </div>`).join('');
}

// ── STUDENT EXAMS ──────────────────────────────────────── //
function renderStudentExams(session) {
  const list    = $('examsList');
  if (!list) return;
  const exams   = Store.get('edu_exams', []);
  const results = Store.get('edu_results', []);
  const student = getStudent(session.studentId);
  const myClass = student ? student.class : '';
  const available = exams.filter(e => e.status === 'approved' && (e.targetClass === myClass || e.targetClass === 'All'));

  if (available.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span>No exams available for your class right now.</div>';
    return;
  }
  list.innerHTML = available.map(e => {
    const taken = results.find(r => r.studentId === session.studentId && r.examId === e.id);
    return `<div class="exam-card">
      <div class="exam-card-info">
        <div class="exam-card-title">${e.title}</div>
        <div class="exam-card-meta">
          <span>📚 ${e.subject}</span>
          <span>🏫 ${e.targetClass}</span>
          <span>❓ ${e.questions.length} Questions</span>
          <span>⏱ ${e.duration} minutes</span>
        </div>
        ${taken ? `<div style="margin-top:8px"><span class="badge badge-submitted">Completed — Score: ${taken.score}/${taken.total} (${taken.percent}%)</span></div>` : ''}
      </div>
      <div class="exam-card-actions">
        ${taken
          ? `<button class="btn-secondary" onclick="viewExamResult('${e.id}','${session.studentId}')">📊 View Result</button>`
          : `<button class="btn-primary" onclick="startExam('${e.id}')">Start Exam →</button>`
        }
      </div>
    </div>`;
  }).join('');
}

// ── START EXAM ─────────────────────────────────────────── //
function startExam(examId) {
  const exams = Store.get('edu_exams', []);
  const exam  = exams.find(e => e.id === examId);
  if (!exam) return;
  currentExam = { ...exam, answers: {}, startTime: Date.now() };

  // Show modal
  $('examModal').classList.remove('hidden');
  setText('examModalTitle', exam.title);
  setText('examModalSubject', exam.subject);

  // Render questions
  const qWrap = $('examQuestions');
  qWrap.innerHTML = exam.questions.map((q, i) => `
    <div class="exam-question" id="eq-${i}">
      <div class="exam-q-text">Q${i+1}. ${q.text}</div>
      <div class="exam-options">
        ${q.options.map((opt, oi) => `
          <label class="exam-option" id="opt-${i}-${oi}" onclick="selectAnswer(${i}, ${oi}, this)">
            <input type="radio" name="q${i}" value="${oi}" /> ${opt}
          </label>`).join('')}
      </div>
    </div>`).join('');

  updateExamProgress();
  setText('examQCount', `0 / ${exam.questions.length} answered`);

  // Timer
  let remaining = exam.duration * 60;
  clearInterval(examTimerInterval);
  updateTimerDisplay(remaining);
  examTimerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay(remaining);
    if (remaining <= 60) $('examTimer').classList.add('danger');
    if (remaining <= 0) { clearInterval(examTimerInterval); submitExam(); }
  }, 1000);
}

function updateTimerDisplay(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  setText('examTimer', `⏱ ${m}:${s}`);
}

function selectAnswer(qIdx, optIdx, label) {
  // Deselect all options for this question
  document.querySelectorAll(`[id^="opt-${qIdx}-"]`).forEach(el => el.classList.remove('selected'));
  label.classList.add('selected');
  currentExam.answers[qIdx] = optIdx;
  // Update progress
  const answered = Object.keys(currentExam.answers).length;
  const total    = currentExam.questions.length;
  setText('examQCount', `${answered} / ${total} answered`);
  updateExamProgress();
}

function updateExamProgress() {
  if (!currentExam) return;
  const answered = Object.keys(currentExam.answers).length;
  const pct = (answered / currentExam.questions.length) * 100;
  $('examProgress').style.width = pct + '%';
}

function submitExam() {
  clearInterval(examTimerInterval);
  const session = Session.get();
  if (!currentExam || !session) return;

  // Calculate score
  let score = 0;
  const breakdown = [];
  currentExam.questions.forEach((q, i) => {
    const studentAns = currentExam.answers[i];
    const correct = studentAns === q.answer;
    if (correct) score++;
    breakdown.push({ text: q.text, correct, studentAns: studentAns !== undefined ? q.options[studentAns] : 'Not answered', correctAns: q.options[q.answer] });
  });

  const total   = currentExam.questions.length;
  const percent = Math.round((score / total) * 100);
  const grade   = calcGrade(percent);

  // Save result
  const results = Store.get('edu_results', []);
  const existing = results.findIndex(r => r.studentId === session.studentId && r.examId === currentExam.id);
  const resultObj = {
    id: 'r' + Date.now(),
    studentId: session.studentId,
    studentName: session.name,
    examId: currentExam.id,
    examTitle: currentExam.title,
    subject: currentExam.subject,
    score, total, percent, grade, breakdown,
    submittedAt: new Date().toISOString(),
    status: 'submitted', // submitted | marked | released
    released: false
  };
  if (existing >= 0) results[existing] = resultObj; else results.push(resultObj);
  Store.set('edu_results', results);

  // Close exam modal, show result modal
  $('examModal').classList.add('hidden');
  showResultModal(score, total, percent, grade, breakdown);
  addNotification(session.studentId, `You completed "${currentExam.title}" — Score: ${score}/${total} (${percent}%)`);
  renderNotifications(session.studentId);
  currentExam = null;
}

function showResultModal(score, total, percent, grade, breakdown) {
  $('resultModal').classList.remove('hidden');
  setText('resultTitle', '🎉 Exam Submitted!');
  setText('resultScore', `${score} / ${total}`);
  setText('resultPercent', percent + '%');
  setText('resultGrade', 'Grade: ' + grade);

  const gradeColors = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  $('resultGrade').style.color = gradeColors[grade[0]] || '#64748b';

  $('resultBreakdown').innerHTML = breakdown.map((b, i) => `
    <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">
      <div style="font-weight:600;margin-bottom:2px">Q${i+1}: ${b.text}</div>
      <div>Your answer: <span style="color:${b.correct?'#22c55e':'#ef4444'};font-weight:700">${b.studentAns || 'Not answered'}</span></div>
      ${!b.correct ? `<div>Correct answer: <span style="color:#22c55e;font-weight:700">${b.correctAns}</span></div>` : ''}
    </div>`).join('');
}

function closeResultModal() {
  $('resultModal').classList.add('hidden');
  renderStudentExams(Session.get());
}

function viewExamResult(examId, studentId) {
  const results = Store.get('edu_results', []);
  const r = results.find(res => res.examId === examId && res.studentId === studentId);
  if (!r) return;
  showResultModal(r.score, r.total, r.percent, r.grade, r.breakdown || []);
}

// ── STUDENT RESULTS TABLE ──────────────────────────────── //
function renderStudentResults(session) {
  const cont = $('resultsContent');
  if (!cont) return;
  const results = Store.get('edu_results', []).filter(r => r.studentId === session.studentId && r.released);

  if (results.length === 0) {
    cont.innerHTML = '<div class="empty-state"><span class="empty-icon">📊</span>No released results yet. Check back after your teacher submits results to admin.</div>';
    return;
  }
  cont.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>#</th><th>Subject</th><th>Exam</th><th>Score</th><th>%</th><th>Grade</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${results.map((r, i) => `
            <tr>
              <td>${i+1}</td>
              <td>${r.subject}</td>
              <td>${r.examTitle}</td>
              <td><strong>${r.score}/${r.total}</strong></td>
              <td>${r.percent}%</td>
              <td><span class="badge ${gradeBadge(r.grade)}">${r.grade}</span></td>
              <td>${formatDate(r.submittedAt)}</td>
              <td><button class="btn-secondary btn-sm" onclick="viewExamResult('${r.examId}','${session.studentId}')">View</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── STUDENT FEES ───────────────────────────────────────── //
function renderStudentFees(session) {
  const cont = $('feesContent');
  if (!cont) return;
  const fees   = Store.get('edu_fees', {});
  const feeRec = fees[session.studentId];

  if (!feeRec) {
    cont.innerHTML = '<div class="empty-state"><span class="empty-icon">💳</span>No fee record found. Please contact admin.</div>';
    return;
  }

  const statusConfig = {
    paid:    { icon: '✅', label: 'Fully Paid', color: '#16a34a' },
    partial: { icon: '⚠️', label: 'Partial Payment', color: '#d97706' },
    unpaid:  { icon: '❌', label: 'Unpaid', color: '#dc2626' }
  };
  const cfg = statusConfig[feeRec.status] || statusConfig.unpaid;
  const balance = feeRec.total - feeRec.paid;

  cont.innerHTML = `
    <div class="fee-card">
      <div class="fee-status-icon">${cfg.icon}</div>
      <div class="fee-status-label" style="color:${cfg.color}">${cfg.label}</div>
      <div class="fee-details">
        <div class="fee-detail-row">
          <span class="fee-detail-label">Total Fee</span>
          <span class="fee-detail-value">₦${feeRec.total.toLocaleString()}</span>
        </div>
        <div class="fee-detail-row">
          <span class="fee-detail-label">Amount Paid</span>
          <span class="fee-detail-value" style="color:#16a34a">₦${feeRec.paid.toLocaleString()}</span>
        </div>
        <div class="fee-detail-row">
          <span class="fee-detail-label">Balance</span>
          <span class="fee-detail-value" style="color:${balance>0?'#dc2626':'#16a34a'}">₦${balance.toLocaleString()}</span>
        </div>
        <div class="fee-detail-row">
          <span class="fee-detail-label">Status</span>
          <span class="badge badge-${feeRec.status}">${cfg.label}</span>
        </div>
      </div>
    </div>`;
}

// ── STUDENT PROFILE ────────────────────────────────────── //
function renderStudentProfile(session) {
  const cont = $('profileContent');
  if (!cont) return;
  const student = getStudent(session.studentId);
  if (!student) return;

  cont.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar-lg">${student.firstName[0]}${student.lastName[0]}</div>
      <div class="profile-name">${student.firstName} ${student.lastName}</div>
      <span class="badge badge-active">Student</span>
      <div class="profile-fields">
        <div class="profile-field"><span class="profile-field-label">Username</span><span class="profile-field-value">@${student.username}</span></div>
        <div class="profile-field"><span class="profile-field-label">Email</span><span class="profile-field-value">${student.email}</span></div>
        <div class="profile-field"><span class="profile-field-label">Class</span><span class="profile-field-value">${student.class}</span></div>
        <div class="profile-field"><span class="profile-field-label">Student ID</span><span class="profile-field-value">${student.id.toUpperCase()}</span></div>
        <div class="profile-field"><span class="profile-field-label">Registered</span><span class="profile-field-value">${student.createdAt}</span></div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   ADMIN PORTAL
   ═══════════════════════════════════════════════════════════ */

function initAdminPortal() {
  const session = Session.get();
  if (!session || session.role !== 'admin') { window.location.href = 'index.html'; return; }
  renderAdminOverview();
  renderNotifications('admin');
}

// ── ADMIN OVERVIEW ─────────────────────────────────────── //
function renderAdminOverview() {
  const students = Store.get('edu_students', []);
  const exams    = Store.get('edu_exams', []);
  const pending  = exams.filter(e => e.status === 'pending');
  const active   = exams.filter(e => e.status === 'approved');

  setText('adminStatStudents', students.length);
  setText('adminStatTeachers', PREDEFINED_USERS.teachers.length);
  setText('adminStatPending',  pending.length);
  setText('adminStatActive',   active.length);

  // Pending approvals preview
  const pendEl = $('adminOverviewPending');
  if (pendEl) {
    pendEl.innerHTML = pending.length === 0
      ? '<div class="empty-state"><span class="empty-icon">✅</span>No pending approvals</div>'
      : pending.slice(0,3).map(e => `
          <div class="overview-item">
            <div><div class="overview-item-title">${e.title}</div>
            <div class="overview-item-sub">By ${e.createdByName} · ${e.subject}</div></div>
            <span class="badge badge-pending">Pending</span>
          </div>`).join('');
  }

  // Recent students
  const studEl = $('adminOverviewStudents');
  if (studEl) {
    studEl.innerHTML = students.length === 0
      ? '<div class="empty-state"><span class="empty-icon">🎒</span>No students yet</div>'
      : students.slice(-4).reverse().map(s => `
          <div class="overview-item">
            <div><div class="overview-item-title">${s.firstName} ${s.lastName}</div>
            <div class="overview-item-sub">${s.class} · @${s.username}</div></div>
            <span class="badge badge-active">Active</span>
          </div>`).join('');
  }
}

// ── STUDENTS TABLE ─────────────────────────────────────── //
function renderStudentsTable() {
  const students = Store.get('edu_students', []);
  renderStudentsRows(students);
}
function renderStudentsRows(students) {
  const tbody = $('studentsTableBody');
  if (!tbody) return;
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--text-3)">No students found</td></tr>';
    return;
  }
  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${s.firstName} ${s.lastName}</strong></td>
      <td>@${s.username}</td>
      <td>${s.class}</td>
      <td>${s.email}</td>
      <td>${s.createdAt}</td>
      <td>
        <div class="action-btns">
          <button class="btn-secondary btn-sm" onclick="editStudent('${s.id}')">✏️ Edit</button>
          <button class="btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterStudents() {
  const q   = getVal('studentSearch').toLowerCase();
  const cls = getVal('studentClassFilter');
  let students = Store.get('edu_students', []);
  if (q)   students = students.filter(s => `${s.firstName} ${s.lastName} ${s.username} ${s.email}`.toLowerCase().includes(q));
  if (cls) students = students.filter(s => s.class === cls);
  renderStudentsRows(students);
}

// Student CRUD
let editingStudentId = null;
function openStudentModal(id = null) {
  editingStudentId = id;
  setText('studentModalTitle', id ? 'Edit Student' : 'Add Student');
  if (id) {
    const s = getStudent(id);
    if (s) {
      setVal('modalFirstName', s.firstName);
      setVal('modalLastName',  s.lastName);
      setVal('modalUsername',  s.username);
      setVal('modalEmail',     s.email);
      setVal('modalClass',     s.class);
      setVal('modalPassword',  s.password);
      setVal('modalStudentId', s.id);
    }
  } else {
    ['modalFirstName','modalLastName','modalUsername','modalEmail','modalPassword'].forEach(id => setVal(id, ''));
    setVal('modalClass', '');
    setVal('modalStudentId', '');
  }
  $('studentModalOverlay').classList.remove('hidden');
}
function closeStudentModal() { $('studentModalOverlay').classList.add('hidden'); }
function editStudent(id) { openStudentModal(id); }

function saveStudent(e) {
  e.preventDefault();
  const students  = Store.get('edu_students', []);
  const firstName = getVal('modalFirstName').trim();
  const lastName  = getVal('modalLastName').trim();
  const username  = getVal('modalUsername').trim();
  const email     = getVal('modalEmail').trim();
  const cls       = getVal('modalClass');
  const password  = getVal('modalPassword').trim();
  const id        = getVal('modalStudentId');

  if (id) {
    const idx = students.findIndex(s => s.id === id);
    if (idx >= 0) { students[idx] = { ...students[idx], firstName, lastName, username, email, class: cls, password }; }
  } else {
    const newId = 's' + Date.now();
    students.push({ id: newId, firstName, lastName, username, password, email, class: cls, createdAt: new Date().toISOString().split('T')[0] });
    const fees = Store.get('edu_fees', {});
    fees[newId] = { total: 85000, paid: 0, status: 'unpaid' };
    Store.set('edu_fees', fees);
  }
  Store.set('edu_students', students);
  closeStudentModal();
  renderStudentsTable();
  renderAdminOverview();
  showToast(id ? 'Student updated!' : 'Student added!', 'success');
}

function deleteStudent(id) {
  confirm2('Delete Student', 'Are you sure you want to remove this student? This cannot be undone.', () => {
    let students = Store.get('edu_students', []);
    students = students.filter(s => s.id !== id);
    Store.set('edu_students', students);
    renderStudentsTable();
    renderAdminOverview();
    showToast('Student removed.', 'success');
  });
}

// ── TEACHERS TABLE ─────────────────────────────────────── //
function renderTeachersTable() {
  const tbody = $('teachersTableBody');
  if (!tbody) return;
  tbody.innerHTML = PREDEFINED_USERS.teachers.map((t, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${t.name}</strong></td>
      <td>@${t.username}</td>
      <td>${t.subject}</td>
    </tr>`).join('');
}

// ── EXAM QUEUE ─────────────────────────────────────────── //
let currentQueueFilter = 'pending';
function renderExamQueue(filter) {
  currentQueueFilter = filter;
  const list  = $('examQueueList');
  if (!list) return;
  const exams = Store.get('edu_exams', []);
  const shown = filter === 'all' ? exams : exams.filter(e => e.status === filter);

  if (shown.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span>No exams in this category.</div>';
    return;
  }
  list.innerHTML = shown.map(e => `
    <div class="queue-card">
      <div class="queue-card-info">
        <div class="queue-card-title">${e.title}</div>
        <div class="queue-card-meta">
          <span>📚 ${e.subject}</span>
          <span>🏫 ${e.targetClass}</span>
          <span>❓ ${e.questions.length} Questions</span>
          <span>⏱ ${e.duration}min</span>
          <span>👩‍🏫 ${e.createdByName}</span>
          <span>📅 ${e.createdAt}</span>
        </div>
      </div>
      <div class="queue-card-actions">
        <span class="badge badge-${e.status}">${cap(e.status)}</span>
        <button class="btn-secondary btn-sm" onclick="previewExam('${e.id}')">👁 Preview</button>
        ${e.status === 'pending' ? `
          <button class="btn-success btn-sm" onclick="approveExam('${e.id}')">✅ Approve</button>
          <button class="btn-danger btn-sm" onclick="rejectExam('${e.id}')">❌ Reject</button>
        ` : ''}
        ${e.status === 'approved' ? `<button class="btn-danger btn-sm" onclick="revokeExam('${e.id}')">Revoke</button>` : ''}
      </div>
    </div>`).join('');
}

function filterExamQueue(filter, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderExamQueue(filter);
}

function approveExam(id) {
  updateExamStatus(id, 'approved');
  const exam = Store.get('edu_exams', []).find(e => e.id === id);
  if (exam) addNotification(exam.createdBy, `Your exam "${exam.title}" was approved by Admin.`);
  showToast('Exam approved and posted to students!', 'success');
}
function rejectExam(id) {
  updateExamStatus(id, 'rejected');
  const exam = Store.get('edu_exams', []).find(e => e.id === id);
  if (exam) addNotification(exam.createdBy, `Your exam "${exam.title}" was rejected by Admin.`);
  showToast('Exam rejected.', 'error');
}
function revokeExam(id) {
  updateExamStatus(id, 'pending');
  showToast('Exam revoked back to pending.', 'info');
}
function updateExamStatus(id, status) {
  const exams = Store.get('edu_exams', []);
  const idx   = exams.findIndex(e => e.id === id);
  if (idx >= 0) { exams[idx].status = status; Store.set('edu_exams', exams); }
  renderExamQueue(currentQueueFilter);
  renderAdminOverview();
}

function previewExam(id) {
  const exam = Store.get('edu_exams', []).find(e => e.id === id);
  if (!exam) return;
  $('examPreviewContent').innerHTML = `
    <div style="margin-bottom:16px">
      <strong>Subject:</strong> ${exam.subject} &nbsp;|&nbsp;
      <strong>Class:</strong> ${exam.targetClass} &nbsp;|&nbsp;
      <strong>Duration:</strong> ${exam.duration} mins &nbsp;|&nbsp;
      <strong>Teacher:</strong> ${exam.createdByName}
    </div>
    ${exam.questions.map((q, i) => `
      <div class="preview-q">
        <div class="preview-q-text">Q${i+1}. ${q.text}</div>
        ${q.options.map((opt, oi) => `<div class="preview-opt ${oi===q.answer?'correct':''}">
          ${String.fromCharCode(65+oi)}. ${opt} ${oi===q.answer?'✓ (Correct)':''}
        </div>`).join('')}
      </div>`).join('')}`;
  $('examPreviewActions').innerHTML = exam.status === 'pending'
    ? `<button class="btn-danger btn-sm" onclick="rejectExam('${id}');closeExamPreview()">❌ Reject</button>
       <button class="btn-success" onclick="approveExam('${id}');closeExamPreview()">✅ Approve</button>`
    : `<button class="btn-secondary" onclick="closeExamPreview()">Close</button>`;
  $('examPreviewOverlay').classList.remove('hidden');
}
function closeExamPreview() { $('examPreviewOverlay').classList.add('hidden'); }

// ── RESULTS RELEASE ────────────────────────────────────── //
function renderResultsRelease() {
  const cont = $('resultsReleaseList');
  if (!cont) return;
  const results = Store.get('edu_results', []);
  const pending = results.filter(r => r.status === 'marked' && !r.released);

  if (pending.length === 0) {
    cont.innerHTML = '<div class="empty-state"><span class="empty-icon">📬</span>No results pending release. Wait for teachers to submit marked results.</div>';
    return;
  }
  cont.innerHTML = pending.map(r => `
    <div class="release-card">
      <div>
        <div style="font-weight:700">${r.examTitle}</div>
        <div style="font-size:.8rem;color:var(--text-2)">${r.studentName} · ${r.subject} · Score: ${r.score}/${r.total} (${r.percent}%)</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge badge-pending">Pending Release</span>
        <button class="btn-success btn-sm" onclick="releaseResult('${r.id}')">📤 Release to Student</button>
      </div>
    </div>`).join('');
}

function releaseResult(resultId) {
  const results = Store.get('edu_results', []);
  const idx     = results.findIndex(r => r.id === resultId);
  if (idx >= 0) {
    const r = results[idx];
    results[idx] = { ...r, released: true, status: 'released' };
    Store.set('edu_results', results);
    addNotification(r.studentId, `Your result for "${r.examTitle}" has been released. Score: ${r.score}/${r.total}`);
    showToast('Result released to student!', 'success');
    renderResultsRelease();
  }
}

// ── FEES MANAGEMENT ────────────────────────────────────── //
function renderFeesTable() {
  const students = Store.get('edu_students', []);
  const fees     = Store.get('edu_fees', {});
  renderFeesRows(students, fees);
}
function renderFeesRows(students, fees) {
  const tbody = $('feesTableBody');
  if (!tbody) return;
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--text-3)">No students</td></tr>';
    return;
  }
  tbody.innerHTML = students.map(s => {
    const f = fees[s.id] || { total: 85000, paid: 0, status: 'unpaid' };
    const balance = f.total - f.paid;
    return `<tr>
      <td><strong>${s.firstName} ${s.lastName}</strong></td>
      <td>${s.class}</td>
      <td>₦${f.total.toLocaleString()}</td>
      <td>₦${f.paid.toLocaleString()}</td>
      <td style="color:${balance>0?'#dc2626':'#16a34a'}">₦${balance.toLocaleString()}</td>
      <td><span class="badge badge-${f.status}">${cap(f.status)}</span></td>
      <td><button class="btn-secondary btn-sm" onclick="openFeeModal('${s.id}')">✏️ Update</button></td>
    </tr>`;
  }).join('');
}
function filterFees() {
  const q       = getVal('feeSearch').toLowerCase();
  const status  = getVal('feeStatusFilter');
  let students  = Store.get('edu_students', []);
  const fees    = Store.get('edu_fees', {});
  if (q) students = students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q));
  if (status) students = students.filter(s => (fees[s.id] || {}).status === status);
  renderFeesRows(students, fees);
}

let feeModalStudentId = null;
function openFeeModal(studentId) {
  feeModalStudentId = studentId;
  const s = getStudent(studentId);
  const f = (Store.get('edu_fees', {}))[studentId] || { total: 85000, paid: 0, status: 'unpaid' };
  setVal('feeModalStudent', s ? `${s.firstName} ${s.lastName}` : '');
  setVal('feeModalTotal', f.total);
  setVal('feeModalPaid', f.paid);
  setVal('feeModalBalance', '₦' + (f.total - f.paid).toLocaleString());
  setVal('feeModalStatus', f.status);
  setVal('feeModalStudentId', studentId);
  $('feeModalOverlay').classList.remove('hidden');
}
function closeFeeModal() { $('feeModalOverlay').classList.add('hidden'); }
function calcBalance() {
  const total = parseFloat(getVal('feeModalTotal')) || 0;
  const paid  = parseFloat(getVal('feeModalPaid'))  || 0;
  setVal('feeModalBalance', '₦' + (total - paid).toLocaleString());
  // Auto-set status
  if (paid >= total) setVal('feeModalStatus', 'paid');
  else if (paid > 0) setVal('feeModalStatus', 'partial');
  else               setVal('feeModalStatus', 'unpaid');
}
function saveFee(e) {
  e.preventDefault();
  const id     = getVal('feeModalStudentId');
  const total  = parseFloat(getVal('feeModalTotal'));
  const paid   = parseFloat(getVal('feeModalPaid'));
  const status = getVal('feeModalStatus');
  const fees   = Store.get('edu_fees', {});
  fees[id]     = { total, paid, status };
  Store.set('edu_fees', fees);
  closeFeeModal();
  renderFeesTable();
  showToast('Fee record updated!', 'success');
  // Notify student
  const s = getStudent(id);
  if (s) addNotification(id, `Your fee status has been updated to: ${cap(status)}. Paid: ₦${paid.toLocaleString()}`);
}

/* ═══════════════════════════════════════════════════════════
   TEACHER PORTAL
   ═══════════════════════════════════════════════════════════ */

function initTeacherPortal() {
  const session = Session.get();
  if (!session || session.role !== 'teacher') { window.location.href = 'index.html'; return; }

  setText('welcomeName', session.name.split(' ')[0]);
  setText('sidebarName', session.name);
  setText('topbarUser', session.name.split(' ')[0]);
  const av = $('sidebarAvatar');
  if (av) av.textContent = session.name[0].toUpperCase();

  renderTeacherOverview(session);
  renderNotifications(session.username);
}

// ── TEACHER OVERVIEW ───────────────────────────────────── //
function renderTeacherOverview(session) {
  const exams   = Store.get('edu_exams', []).filter(e => e.createdBy === session.username);
  const results = Store.get('edu_results', []);
  // Submissions for teacher's exams
  const myExamIds = exams.map(e => e.id);
  const subs = results.filter(r => myExamIds.includes(r.examId));

  setText('teacherStatExams',       exams.length);
  setText('teacherStatPending',     exams.filter(e => e.status === 'pending').length);
  setText('teacherStatApproved',    exams.filter(e => e.status === 'approved').length);
  setText('teacherStatSubmissions', subs.length);

  // Recent exams
  const oe = $('teacherOverviewExams');
  if (oe) {
    oe.innerHTML = exams.length === 0
      ? '<div class="empty-state"><span class="empty-icon">📝</span>No exams created yet</div>'
      : exams.slice(-4).reverse().map(e => `
          <div class="overview-item">
            <div><div class="overview-item-title">${e.title}</div>
            <div class="overview-item-sub">${e.subject} · ${e.targetClass}</div></div>
            <span class="badge badge-${e.status}">${cap(e.status)}</span>
          </div>`).join('');
  }

  // Recent submissions
  const os = $('teacherOverviewSubmissions');
  if (os) {
    os.innerHTML = subs.length === 0
      ? '<div class="empty-state"><span class="empty-icon">📬</span>No submissions yet</div>'
      : subs.slice(-4).reverse().map(r => `
          <div class="overview-item">
            <div><div class="overview-item-title">${r.studentName}</div>
            <div class="overview-item-sub">${r.examTitle}</div></div>
            <div style="text-align:right;font-weight:800;color:var(--primary)">${r.score}/${r.total}</div>
          </div>`).join('');
  }
}

// ── CREATE EXAM ────────────────────────────────────────── //
// Full exam creator logic (autosave, objective+theory, marks)
// is handled by exam-creator.js which is loaded after script.js
// in teacher.html. The functions initCreateExam, submitExamToAdmin,
// clearExamForm, addObjectiveQuestion, addTheoryQuestion, etc.
// are all defined in exam-creator.js and called from here.

// ── MY EXAMS (TEACHER) ────────────────────────────────── //
function renderTeacherMyExams(session) {
  const list  = $('myExamsList');
  if (!list) return;
  const exams = Store.get('edu_exams', []).filter(e => e.createdBy === session.username);

  if (exams.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">📝</span>No exams created yet. Go to "Create Exam" to start.</div>';
    return;
  }
  list.innerHTML = exams.map(e => `
    <div class="queue-card">
      <div class="queue-card-info">
        <div class="queue-card-title">${e.title}</div>
        <div class="queue-card-meta">
          <span>📚 ${e.subject}</span>
          <span>🏫 ${e.targetClass}</span>
          <span>❓ ${e.questions.length} Questions</span>
          <span>⏱ ${e.duration}min</span>
          <span>📅 ${e.createdAt}</span>
        </div>
      </div>
      <span class="badge badge-${e.status}">${cap(e.status)}</span>
    </div>`).join('');
}

// ── SUBMISSIONS (TEACHER) ─────────────────────────────── //
function renderTeacherSubmissions(session) {
  const list    = $('submissionsList');
  if (!list) return;
  const myExams = Store.get('edu_exams', []).filter(e => e.createdBy === session.username).map(e => e.id);
  const results = Store.get('edu_results', []).filter(r => myExams.includes(r.examId));

  if (results.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">📬</span>No student submissions for your exams yet.</div>';
    return;
  }
  list.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>#</th><th>Student</th><th>Exam</th><th>Subject</th><th>Score</th><th>%</th><th>Grade</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${results.map((r,i) => `
            <tr>
              <td>${i+1}</td>
              <td>${r.studentName}</td>
              <td>${r.examTitle}</td>
              <td>${r.subject}</td>
              <td><strong>${r.score}/${r.total}</strong></td>
              <td>${r.percent}%</td>
              <td><span class="badge ${gradeBadge(r.grade)}">${r.grade}</span></td>
              <td><span class="badge badge-${r.status}">${cap(r.status)}</span></td>
              <td>${formatDate(r.submittedAt)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── MARKING & SUBMIT RESULTS ──────────────────────────── //
function renderTeacherMarking(session) {
  const list    = $('markingList');
  if (!list) return;
  const myExams = Store.get('edu_exams', []).filter(e => e.createdBy === session.username).map(e => e.id);
  const results = Store.get('edu_results', []).filter(r => myExams.includes(r.examId) && r.status === 'submitted');

  if (results.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">✔️</span>No submissions pending marking. All done or no submissions yet!</div>';
    return;
  }
  list.innerHTML = results.map(r => `
    <div class="marking-card">
      <div class="marking-card-header">
        <div>
          <div class="marking-card-title">${r.studentName} — ${r.examTitle}</div>
          <div style="font-size:.8rem;color:var(--text-2)">${r.subject} · Score: ${r.score}/${r.total} (${r.percent}%) · Grade: ${r.grade}</div>
        </div>
        <div style="display:flex;gap:8px">
          <span class="badge badge-pending">Pending Submission</span>
          <button class="btn-success btn-sm" onclick="submitResultToAdmin('${r.id}')">📤 Submit to Admin</button>
        </div>
      </div>
      <div style="font-size:.82rem;color:var(--text-2)">
        Auto-graded result. Review and submit to Admin for release to student.
      </div>
    </div>`).join('');
}

function submitResultToAdmin(resultId) {
  const results = Store.get('edu_results', []);
  const idx     = results.findIndex(r => r.id === resultId);
  if (idx >= 0) {
    results[idx].status = 'marked';
    Store.set('edu_results', results);
    addNotification('admin', `New result submitted by teacher for "${results[idx].examTitle}". Student: ${results[idx].studentName}`);
    showToast('Result submitted to Admin!', 'success');
    renderTeacherMarking(Session.get());
    renderTeacherOverview(Session.get());
  }
}

/* ═══════════════════════════════════════════════════════════
   TOAST & CONFIRM HELPERS
   ═══════════════════════════════════════════════════════════ */
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

function confirm2(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h4>${title}</h4>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn-secondary" id="cnfCancel">Cancel</button>
        <button class="btn-danger" id="cnfOk">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cnfOk').addEventListener('click', () => { onConfirm(); overlay.remove(); });
  overlay.querySelector('#cnfCancel').addEventListener('click', () => overlay.remove());
}

/* ═══════════════════════════════════════════════════════════
   MISC UTILITIES
   ═══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const getVal  = id => { const el = $(id); return el ? el.value : ''; };
const setVal  = (id, v) => { const el = $(id); if (el) el.value = v; };
const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const showEl  = (el, msg) => { if (typeof el === 'string') el = $(el); if (el) { el.textContent = msg; el.style.display='block'; } };
const hideEl  = (el) => { if (typeof el === 'string') el = $(el); if (el) el.style.display='none'; };
const showError   = (el, msg) => { el.textContent = msg; el.classList.add('show'); };
const hideError   = (el) => { el.textContent = ''; el.classList.remove('show'); };
const showSuccess = (el, msg) => { el.textContent = msg; el.classList.add('show'); };
const hideSuccess = (el) => { el.textContent = ''; el.classList.remove('show'); };
const cap = str => str ? str[0].toUpperCase() + str.slice(1) : '';
const getStudent = id => (Store.get('edu_students', []) || []).find(s => s.id === id);
const formatDate = iso => iso ? new Date(iso).toLocaleDateString() : '';

function calcGrade(pct) {
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 45) return 'D';
  return 'F';
}
function gradeBadge(grade) {
  if (!grade) return '';
  const g = grade[0];
  if (g === 'A') return 'badge-approved';
  if (g === 'B') return 'badge-active';
  if (g === 'C') return 'badge-partial';
  if (g === 'D') return 'badge-pending';
  return 'badge-rejected';
}

function togglePass(inputId, btn) {
  const el = $(inputId);
  if (el.type === 'password') { el.type = 'text'; btn.textContent = '🙈'; }
  else                        { el.type = 'password'; btn.textContent = '👁️'; }
}

/* ═══════════════════════════════════════════════════════════
   BOOT — Determine which page we're on and initialise
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initDefaultData();
  initTheme();

  // Close notifications on outside click
  document.addEventListener('click', (e) => {
    const nd = $('notifDropdown');
    if (nd && !nd.classList.contains('hidden') && !e.target.closest('.notif-btn') && !e.target.closest('.notif-dropdown')) {
      nd.classList.add('hidden');
    }
  });

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'student.html') {
    initStudentPortal();
  } else if (page === 'admin.html') {
    initAdminPortal();
  } else if (page === 'teacher.html') {
    initTeacherPortal();
  } else {
    // index.html — auth page
    // Redirect if already logged in
    const session = Session.get();
    if (session) {
      const routes = { student: 'student.html', admin: 'admin.html', teacher: 'teacher.html' };
      if (routes[session.role]) window.location.href = routes[session.role];
    }
    // Theme toggle for auth page
    const btn = $('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      const theme = document.documentElement.getAttribute('data-theme');
      btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }
});
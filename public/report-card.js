/* ═══════════════════════════════════════════════════════════
   EduPortal — public/report-card.js

   Admin Report Cards screen. Pure addition — does not modify
   or depend on anything in script.js besides the shared global
   helpers already defined there ($ , Api, setText, getVal,
   showToast, gradeColor, loadingHTML, emptyHTML).

   Data source: GET/PUT /api/report-cards/* (routes/reportCards.js),
   which itself only reads/writes the EXISTING SubjectResult
   collection plus a new, separate ReportCardComment collection.
   Nothing here touches exams, results, or test-score marking.
   ═══════════════════════════════════════════════════════════ */

var RC = {
  lastData: null   // last generated report card payload, for save/release/print
};

function rcInit() {
  var wrap = document.getElementById('reportCardWrap');
  if (wrap && !RC.lastData) {
    wrap.innerHTML = emptyHTML('🧾', 'Select a class and student above, then click "Generate Report Card".');
  }
}

/* Populate the student dropdown once a class is chosen */
async function rcLoadStudentOptions() {
  var cls = getVal('rcClassFilter');
  var sel = document.getElementById('rcStudentSelect');
  if (!sel) return;

  if (!cls) {
    sel.innerHTML = '<option value="">Select class first…</option>';
    return;
  }

  sel.innerHTML = '<option value="">Loading students…</option>';
  try {
    var students = await Api.get('/students/by-class?class=' + encodeURIComponent(cls));
    if (!students || students.length === 0) {
      sel.innerHTML = '<option value="">No students in this class</option>';
      return;
    }
    sel.innerHTML = '<option value="">Select Student</option>' + students.map(function (s) {
      var name = ((s.firstName || '') + ' ' + (s.lastName || '')).trim() || s.username;
      return '<option value="' + s._id + '">' + name + ' (' + (s.username || '') + ')</option>';
    }).join('');
  } catch (err) {
    sel.innerHTML = '<option value="">Failed to load students</option>';
    showToast(err.message || 'Could not load students.', 'error');
  }
}

/* Fetch + render the report card for the selected student/session/term */
async function rcGenerate() {
  var studentId = getVal('rcStudentSelect');
  var session   = getVal('rcSessionFilter');
  var term      = getVal('rcTermFilter');
  var wrap      = document.getElementById('reportCardWrap');
  if (!wrap) return;

  if (!studentId) {
    showToast('Please select a student first.', 'error');
    return;
  }

  wrap.innerHTML = loadingHTML('Generating report card…');
  try {
    var url = '/report-cards/student/' + studentId + '?session=' + encodeURIComponent(session) + '&term=' + encodeURIComponent(term);
    var data = await Api.get(url);
    RC.lastData = data;
    rcRenderCard(data);
  } catch (err) {
    wrap.innerHTML = emptyHTML('⚠️', err.message || 'Could not generate report card.');
  }
}

function rcRenderCard(data) {
  var wrap = document.getElementById('reportCardWrap');
  if (!wrap) return;

  var schoolName = (document.getElementById('sidebarSchool') || {}).textContent || 'School';
  var gc = gradeColor(data.grade);

  var rowsHtml = '';
  if (data.subjectCount === 0) {
    rowsHtml = '<tr><td colspan="7" style="text-align:center;color:var(--text-2);padding:20px">No subject results recorded yet for this student in this session/term.</td></tr>';
  } else {
    data.subjects.forEach(function (r) {
      var rgc = gradeColor(r.grade);
      rowsHtml += '<tr>'
        + '<td><strong>' + r.subject + '</strong></td>'
        + '<td>' + r.objScore + '/20</td>'
        + '<td>' + r.theoryScore + '/40</td>'
        + '<td>' + (r.testScore > 0 ? r.testScore : '—') + '/40</td>'
        + '<td><strong style="color:var(--primary)">' + r.totalScore + '</strong>/100</td>'
        + '<td><span style="font-weight:800;color:' + rgc + '">' + r.grade + '</span></td>'
        + '<td style="color:var(--text-2);font-size:.85rem">' + r.remark + '</td>'
        + '</tr>';
    });
  }

  var releaseBadge = data.allReleased
    ? '<span class="badge badge-approved">✅ Released to Student</span>'
    : '<span class="badge badge-pending">⏳ Not Released Yet</span>';

  var html = ''
    + '<div class="rc-actions no-print" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
    +   '<button class="btn-secondary" onclick="rcPrint()">🖨️ Print / Save as PDF</button>'
    +   (data.subjectCount > 0
          ? '<button class="btn-success" onclick="rcRelease()" ' + (data.allReleased ? 'disabled' : '') + '>'
            + (data.allReleased ? '✅ Already Released' : '📤 Release Report Card') + '</button>'
          : '')
    + '</div>'
    + '<div class="card" id="reportCardPrintArea" style="padding:0;overflow:hidden">'
    +   '<div style="background:linear-gradient(135deg,var(--primary),var(--primary-dark,var(--primary)));color:#fff;padding:22px 26px">'
    +     '<div style="font-size:1.3rem;font-weight:800">' + schoolName + '</div>'
    +     '<div style="opacity:.9;font-size:.9rem;margin-top:2px">Student Report Card — ' + data.session + ' · ' + data.term + '</div>'
    +   '</div>'
    +   '<div style="padding:20px 26px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;border-bottom:1px solid var(--border)">'
    +     '<div><div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase">Student Name</div><div style="font-weight:700">' + (data.student.name || '—') + '</div></div>'
    +     '<div><div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase">Class</div><div style="font-weight:700">' + (data.student.class || '—') + '</div></div>'
    +     '<div><div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase">Username</div><div style="font-weight:700">' + (data.student.username || '—') + '</div></div>'
    +     '<div><div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase">Status</div>' + releaseBadge + '</div>'
    +   '</div>'
    +   '<div style="overflow-x:auto"><table class="data-table">'
    +     '<thead><tr><th>Subject</th><th>Obj (20)</th><th>Theory (40)</th><th>Test (40)</th><th>Total (100)</th><th>Grade</th><th>Remark</th></tr></thead>'
    +     '<tbody>' + rowsHtml + '</tbody>'
    +   '</table></div>'
    +   '<div style="padding:16px 26px;background:var(--surface-2);border-top:1px solid var(--border);display:flex;gap:24px;flex-wrap:wrap;font-size:.9rem">'
    +     '<span>📚 Subjects: <strong>' + data.subjectCount + '</strong></span>'
    +     '<span>📊 Cumulative Score: <strong>' + data.cumulativeScore + '/' + data.maxPossible + '</strong></span>'
    +     '<span>📈 Total Percentage: <strong>' + data.percentage + '%</strong></span>'
    +     '<span>🏅 Overall Grade: <strong style="color:' + gc + '">' + data.grade + '</strong></span>'
    +   '</div>'
    +   '<div style="padding:20px 26px">'
    +     '<label style="font-size:.8rem;font-weight:700;color:var(--text-2);text-transform:uppercase;display:block;margin-bottom:8px">Performance Comment</label>'
    +     '<textarea id="rcCommentBox" rows="3" style="width:100%;font-family:inherit;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text-1)">'
           + escapeHtml(data.comment || data.suggestedComment || '') + '</textarea>'
    +     '<div class="no-print" style="margin-top:10px">'
    +       '<button class="btn-primary btn-sm" onclick="rcSaveComment()">💾 Save Comment</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  wrap.innerHTML = html;
}

async function rcSaveComment() {
  if (!RC.lastData) return;
  var box = document.getElementById('rcCommentBox');
  if (!box) return;
  try {
    await Api.put('/report-cards/student/' + RC.lastData.student.id + '/comment', {
      session: RC.lastData.session,
      term: RC.lastData.term,
      comment: box.value
    });
    RC.lastData.comment = box.value;
    showToast('✅ Comment saved.', 'success');
  } catch (err) {
    showToast(err.message || 'Could not save comment.', 'error');
  }
}

async function rcRelease() {
  if (!RC.lastData) return;
  if (RC.lastData.subjectCount === 0) return;
  if (!confirm('Release this report card? The student will be able to view it immediately under their Academic Report.')) return;
  try {
    await Api.put('/report-cards/student/' + RC.lastData.student.id + '/release', {
      session: RC.lastData.session,
      term: RC.lastData.term
    });
    showToast('📤 Report card released.', 'success');
    rcGenerate();   // refresh to show the updated "Released" badge
  } catch (err) {
    showToast(err.message || 'Could not release report card.', 'error');
  }
}

function rcPrint() {
  window.print();
}

function escapeHtml(str) {
  var d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

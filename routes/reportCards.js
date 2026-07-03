/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/reportCards.js

   Admin-only Report Card generator. Builds a per-student,
   per-term report card from the EXISTING SubjectResult data
   (Objective 20 + Theory 40 + Test 40 = 100 per subject) —
   no new scoring logic, just aggregation + presentation.

   Does NOT change how SubjectResult, Result, or TestScore work.
   Purely additive: reads SubjectResult, writes only to the new
   ReportCardComment collection, and can flip `released` on the
   student's existing SubjectResult docs (same field the
   "Subject Results" screen already uses).
   ═══════════════════════════════════════════════════════════ */
const express            = require('express');
const router              = express.Router();
const SubjectResult       = require('../models/SubjectResult');
const ReportCardComment   = require('../models/ReportCardComment');
const User                = require('../models/User');
const auth                = require('../middleware/auth');
const schoolTenant        = require('../middleware/schoolTenant');
const { requireRole }     = require('../middleware/requireRole');

router.use(auth);
router.use(schoolTenant);
router.use(requireRole('admin'));   // Report Cards screen is admin-only

/* ── grade / remark helpers (mirrors SubjectResult's own logic,
   applied here to the student's OVERALL average) ─────────────── */
function overallGrade(pct) {
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 45) return 'D';
  return 'F';
}

function suggestComment(pct, studentFirstName) {
  const name = studentFirstName || 'The student';
  if (pct >= 75) return `${name} has performed excellently this term. Keep up the outstanding work!`;
  if (pct >= 65) return `${name} has performed very well this term. Consistent effort is showing good results.`;
  if (pct >= 55) return `${name} has a good result this term. More consistent effort could push this even higher.`;
  if (pct >= 45) return `${name}'s result this term is fair. More attention and consistent study is encouraged.`;
  return `${name} needs to put in significantly more effort next term. Extra support is recommended.`;
}

/* ── GET /api/report-cards/student/:studentId?session=&term=
   Returns the full report card payload for one student. ────── */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) {
      return res.status(400).json({ message: 'Please select both a Session and a Term.' });
    }

    const student = await User.findOne({
      _id: studentId, schoolId: req.schoolId, role: 'student'
    }).select('firstName lastName username class department');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const subjects = await SubjectResult.find({
      schoolId: req.schoolId, student: studentId, session, term
    }).sort({ subject: 1 }).lean();

    const subjectCount    = subjects.length;
    const cumulativeScore = subjects.reduce((sum, s) => sum + (Number(s.totalScore) || 0), 0);
    const maxPossible     = subjectCount * 100;
    const percentage      = subjectCount > 0 ? Math.round((cumulativeScore / maxPossible) * 100) : 0;
    const grade           = subjectCount > 0 ? overallGrade(percentage) : '—';
    const allReleased     = subjectCount > 0 && subjects.every(s => s.released);

    const existing = await ReportCardComment.findOne({
      schoolId: req.schoolId, student: studentId, session, term
    }).lean();

    res.json({
      student: {
        id       : student._id,
        name     : `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        username : student.username || '',
        class    : student.class || '',
        department: student.department || '',
      },
      session, term,
      subjects,
      subjectCount,
      cumulativeScore,
      maxPossible,
      percentage,
      grade,
      allReleased,
      comment: existing ? existing.comment : '',
      suggestedComment: suggestComment(percentage, student.firstName),
    });
  } catch (err) {
    console.error('[GET /report-cards/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT /api/report-cards/student/:studentId/comment
   Saves (or updates) the admin's performance comment. ───────── */
router.put('/student/:studentId/comment', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term, comment } = req.body;
    if (!session || !term) {
      return res.status(400).json({ message: 'Session and term are required.' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId, role: 'student' }).select('_id');
    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });

    const saved = await ReportCardComment.findOneAndUpdate(
      { schoolId: req.schoolId, student: studentId, session, term },
      {
        schoolId: req.schoolId,
        student : studentId,
        session, term,
        comment : String(comment || '').slice(0, 1000),
        updatedBy: req.user.username || req.user.name || 'admin',
      },
      { upsert: true, new: true }
    );
    res.json({ message: 'Comment saved.', comment: saved.comment });
  } catch (err) {
    console.error('[PUT /report-cards/comment]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT /api/report-cards/student/:studentId/release
   Releases this student's report card for the given term —
   flips `released: true` on every SubjectResult that makes up
   this report card (same field the Subject Results screen and
   the student's Academic Report page already read). ─────────── */
router.put('/student/:studentId/release', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.body;
    if (!session || !term) {
      return res.status(400).json({ message: 'Session and term are required.' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId, role: 'student' }).select('_id');
    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });

    const result = await SubjectResult.updateMany(
      { schoolId: req.schoolId, student: studentId, session, term },
      { released: true }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No subject results found for this student/session/term yet.' });
    }
    res.json({
      message: 'Report card released. The student can now view it under their Academic Report.',
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error('[PUT /report-cards/release]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

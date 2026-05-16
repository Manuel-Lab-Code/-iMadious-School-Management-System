// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/subjectResults.js
//    Terminal subject results per student per term.
//    Combines Objective(20) + Theory(40) + Test(40) = 100
//    ═══════════════════════════════════════════════════════════ */
// const express       = require('express');
// const router        = express.Router();
// const SubjectResult = require('../models/SubjectResult');
// const auth          = require('../middleware/auth');

// /* ── GET all subject results — admin compound view ─────────── */
// router.get('/', auth, async (req, res) => {
//   try {
//     const { session, term, class: cls, subject } = req.query;
//     const filter = {};
//     if (session) filter.session = session;
//     if (term)    filter.term    = term;
//     if (cls)     filter.class   = cls;
//     if (subject) filter.subject = subject;

//     const results = await SubjectResult.find(filter)
//       .populate('student', 'firstName lastName username class')
//       .sort({ session: -1, term: 1, class: 1, studentName: 1, subject: 1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /subject-results]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* ── GET released results for one student ──────────────────── */
// router.get('/student/:studentId', auth, async (req, res) => {
//   try {
//     const results = await SubjectResult.find({
//       student  : req.params.studentId,
//       released : true
//     }).sort({ session: -1, term: 1, subject: 1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /subject-results/student]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* ── GET released results for a student filtered by term ────── */
// router.get('/student/:studentId/term', auth, async (req, res) => {
//   try {
//     const { session, term } = req.query;
//     const filter = { student: req.params.studentId, released: true };
//     if (session) filter.session = session;
//     if (term)    filter.term    = term;

//     const results = await SubjectResult.find(filter)
//       .sort({ subject: 1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /subject-results/student/term]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* ── PUT — admin releases one subject result ───────────────── */
// router.put('/:id/release', auth, async (req, res) => {
//   try {
//     const r = await SubjectResult.findByIdAndUpdate(
//       req.params.id,
//       { released: true },
//       { new: true }
//     );
//     if (!r) return res.status(404).json({ message: 'Result not found.' });
//     res.json(r);
//   } catch (err) {
//     console.error('[PUT /subject-results/release]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* ── PUT — bulk release all results for session + term ──────── */
// router.put('/release-bulk', auth, async (req, res) => {
//   try {
//     const { session, term, class: cls } = req.body;
//     const filter = {};
//     if (session) filter.session = session;
//     if (term)    filter.term    = term;
//     if (cls)     filter.class   = cls;

//     await SubjectResult.updateMany(filter, { released: true });
//     res.json({ message: 'Subject results released successfully.' });
//   } catch (err) {
//     console.error('[PUT /subject-results/release-bulk]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;


/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/subjectResults.js
   Terminal subject results per student per term.
   Combines Objective(20) + Theory(40) + Test(40) = 100

   FIXED:
   1. Every query scoped to req.schoolId via schoolTenant.
   2. Student-is-me check for students viewing their own data.
   3. Bulk release (PUT /release-bulk) previously released
      results across every school — now scoped to this school.
   4. Registered '/release-bulk' BEFORE '/:id/release' so
      Express does not mis-route bulk requests as single-id.
   ═══════════════════════════════════════════════════════════ */
const express       = require('express');
const router        = express.Router();
const SubjectResult = require('../models/SubjectResult');
const User          = require('../models/User');
const auth          = require('../middleware/auth');
const schoolTenant  = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

router.use(auth);
router.use(schoolTenant);

/* ── GET all subject results — admin/teacher compound view ── */
router.get('/', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { session, term, class: cls, subject } = req.query;
    const filter = { schoolId: req.schoolId };
    if (session) filter.session = session;
    if (term)    filter.term    = term;
    if (cls)     filter.class   = cls;
    if (subject) filter.subject = subject;

    const results = await SubjectResult.find(filter)
      .populate('student', 'firstName lastName username class')
      .sort({ session: -1, term: 1, class: 1, studentName: 1, subject: 1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /subject-results]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET released results for one student ───────────────────
   Student can view own; admin/teacher can view any in school. */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const results = await SubjectResult.find({
      student  : studentId,
      schoolId : req.schoolId,
      released : true,
    }).sort({ session: -1, term: 1, subject: 1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /subject-results/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET released results for a student filtered by term ──── */
router.get('/student/:studentId/term', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const { session, term } = req.query;
    const filter = {
      student  : studentId,
      schoolId : req.schoolId,
      released : true,
    };
    if (session) filter.session = session;
    if (term)    filter.term    = term;

    const results = await SubjectResult.find(filter).sort({ subject: 1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /subject-results/student/term]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT — bulk release (admin only, THIS SCHOOL ONLY) ─────
   Registered BEFORE '/:id/release' so the specific literal
   path wins route matching.                                   */
router.put('/release-bulk', requireRole('admin'), async (req, res) => {
  try {
    const { session, term, class: cls } = req.body;
    const filter = { schoolId: req.schoolId };
    if (session) filter.session = session;
    if (term)    filter.term    = term;
    if (cls)     filter.class   = cls;

    const result = await SubjectResult.updateMany(filter, { released: true });
    res.json({
      message: 'Subject results released successfully.',
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error('[PUT /subject-results/release-bulk]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT — admin releases one subject result ─────────────── */
router.put('/:id/release', requireRole('admin'), async (req, res) => {
  try {
    const r = await SubjectResult.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { released: true },
      { new: true }
    );
    if (!r) return res.status(404).json({ message: 'Result not found in this school.' });
    res.json(r);
  } catch (err) {
    console.error('[PUT /subject-results/release]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

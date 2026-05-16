// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/testScores.js
//    IMPORTANT: Does NOT import any other route file.
//    recalc() called via SubjectResult static method only.
//    ═══════════════════════════════════════════════════════════ */
// const express       = require('express');
// const router        = express.Router();
// const TestScore     = require('../models/TestScore');
// const SubjectResult = require('../models/SubjectResult');
// const auth          = require('../middleware/auth');

// /* GET — all test scores */
// router.get('/', auth, async (req, res) => {
//   try {
//     const scores = await TestScore.find()
//       .populate('student', 'firstName lastName username class')
//       .sort({ createdAt: -1 });
//     res.json(scores);
//   } catch (err) {
//     console.error('[GET /test-scores]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* GET — scores for one student */
// router.get('/student/:studentId', auth, async (req, res) => {
//   try {
//     const scores = await TestScore.find({ student: req.params.studentId })
//       .sort({ session: -1, term: 1 });
//     res.json(scores);
//   } catch (err) {
//     console.error('[GET /test-scores/student]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* GET — released scores for one student */
// router.get('/student/:studentId/released', auth, async (req, res) => {
//   try {
//     const scores = await TestScore.find({
//       student  : req.params.studentId,
//       released : true
//     }).sort({ session: -1, term: 1 });
//     res.json(scores);
//   } catch (err) {
//     console.error('[GET /test-scores/student/released]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* POST — teacher saves/updates a test score (upsert) */
// router.post('/', auth, async (req, res) => {
//   try {
//     const { student, subject, session, term, score, remarks, studentName, class: cls } = req.body;

//     if (!student || !subject || !session || !term) {
//       return res.status(400).json({ message: 'student, subject, session and term are required.' });
//     }

//     const capped = Math.min(Number(score) || 0, 40);

//     const testScore = await TestScore.findOneAndUpdate(
//       { student, subject, session, term },
//       {
//         student,
//         studentName   : studentName || '',
//         subject,
//         session,
//         term,
//         class         : cls || '',
//         score         : capped,
//         maxScore      : 40,
//         remarks       : remarks || '',
//         enteredBy     : req.user.username || '',
//         enteredByName : req.user.name     || '',
//         status        : 'submitted',
//         released      : false
//       },
//       { returnDocument: 'after', upsert: true }
//     );

//     SubjectResult.recalc(student, subject, session, term)
//       .catch(e => console.warn('[testScores POST recalc]', e.message));

//     res.json(testScore);
//   } catch (err) {
//     console.error('[POST /test-scores]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* PUT — admin releases one test score */
// router.put('/:id/release', auth, async (req, res) => {
//   try {
//     const ts = await TestScore.findByIdAndUpdate(
//       req.params.id,
//       { status: 'released', released: true },
//       { returnDocument: 'after' }
//     );
//     if (!ts) return res.status(404).json({ message: 'Test score not found.' });

//     SubjectResult.recalc(ts.student, ts.subject, ts.session, ts.term)
//       .catch(e => console.warn('[testScores release recalc]', e.message));

//     res.json(ts);
//   } catch (err) {
//     console.error('[PUT /test-scores/release]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* PUT — bulk release all scores for a session + term */
// router.put('/release-bulk', auth, async (req, res) => {
//   try {
//     const { session, term } = req.body;
//     if (!session || !term) {
//       return res.status(400).json({ message: 'session and term are required.' });
//     }
//     /* Release all test scores matching session and term */
//     await TestScore.updateMany({ session, term }, { status: 'released', released: true });
    
//     /* Recalculate SubjectResult for each affected student+subject combination */
//     const affectedScores = await TestScore.find({ session, term, released: true });
//     const uniqueRecalcs = new Set();
    
//     for (const ts of affectedScores) {
//       const key = `${ts.student}_${ts.subject}`;
//       if (!uniqueRecalcs.has(key)) {
//         uniqueRecalcs.add(key);
//         SubjectResult.recalc(ts.student, ts.subject, session, term)
//           .catch(e => console.warn('[testScores release-bulk recalc]', e.message));
//       }
//     }
    
//     res.json({ message: `All scores for ${session} ${term} released.` });
//   } catch (err) {
//     console.error('[PUT /test-scores/release-bulk]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* DELETE */
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     await TestScore.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Test score deleted.' });
//   } catch (err) {
//     console.error('[DELETE /test-scores]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;



/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/testScores.js

   FIXED:
   1. Every query scoped to req.schoolId via schoolTenant.
   2. Bulk release — which previously released EVERY school's
      test scores for a given session+term — is now scoped.
      This was the single worst leak in the codebase.
   3. Teachers verified to belong to the same school as the
      student they are grading.
   4. SubjectResult.recalc is called with schoolId first.
   ═══════════════════════════════════════════════════════════ */
const express       = require('express');
const router        = express.Router();
const TestScore     = require('../models/TestScore');
const SubjectResult = require('../models/SubjectResult');
const User          = require('../models/User');
const auth          = require('../middleware/auth');
const schoolTenant  = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

router.use(auth);
router.use(schoolTenant);

/* ── GET all test scores (admin/teacher) ─────────────────── */
router.get('/', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const scores = await TestScore.find({ schoolId: req.schoolId })
      .populate('student', 'firstName lastName username class')
      .sort({ createdAt: -1 });
    res.json(scores);
  } catch (err) {
    console.error('[GET /test-scores]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET scores for one student ──────────────────────────── */
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

    const scores = await TestScore.find({ student: studentId, schoolId: req.schoolId })
      .sort({ session: -1, term: 1 });
    res.json(scores);
  } catch (err) {
    console.error('[GET /test-scores/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET released scores for one student ─────────────────── */
router.get('/student/:studentId/released', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const scores = await TestScore.find({
      student  : studentId,
      schoolId : req.schoolId,
      released : true,
    }).sort({ session: -1, term: 1 });
    res.json(scores);
  } catch (err) {
    console.error('[GET /test-scores/student/released]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST — teacher upserts a test score ─────────────────── */
router.post('/', requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    /* Strip any client-supplied schoolId */
    delete req.body.schoolId;

    const { student, subject, session, term, score, remarks, studentName, class: cls } = req.body;

    if (!student || !subject || !session || !term) {
      return res.status(400).json({ message: 'student, subject, session and term are required.' });
    }

    /* Verify the student belongs to this school */
    const studentDoc = await User.findOne({ _id: student, schoolId: req.schoolId }).select('_id');
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const capped = Math.min(Number(score) || 0, 40);

    const testScore = await TestScore.findOneAndUpdate(
      { student, subject, session, term, schoolId: req.schoolId },
      {
        schoolId      : req.schoolId,
        student,
        studentName   : studentName || '',
        subject,
        session,
        term,
        class         : cls || '',
        score         : capped,
        maxScore      : 40,
        remarks       : remarks || '',
        enteredBy     : req.user.username || '',
        enteredByName : req.user.name     || '',
        status        : 'submitted',
        released      : false,
      },
      { returnDocument: 'after', upsert: true, new: true, setDefaultsOnInsert: true }
    );

    SubjectResult.recalc(req.schoolId, student, subject, session, term)
      .catch(e => console.warn('[testScores POST recalc]', e.message));

    res.json(testScore);
  } catch (err) {
    console.error('[POST /test-scores]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT — admin releases a SINGLE test score ─────────────
   NOTE: This route is registered BEFORE /release-bulk because
   Express matches routes in registration order. The bulk route
   uses a distinct path ('/release-bulk'), so ordering alone is
   not strictly required, but keeping specific before generic
   is a safer habit.                                            */
router.put('/:id/release', requireRole('admin'), async (req, res) => {
  try {
    const ts = await TestScore.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { status: 'released', released: true },
      { returnDocument: 'after' }
    );
    if (!ts) return res.status(404).json({ message: 'Test score not found in this school.' });

    SubjectResult.recalc(req.schoolId, ts.student, ts.subject, ts.session, ts.term)
      .catch(e => console.warn('[testScores release recalc]', e.message));

    res.json(ts);
  } catch (err) {
    console.error('[PUT /test-scores/release]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT — bulk release for a session + term (THIS SCHOOL ONLY) ──
   SEVERE LEAK FIXED: previously this updated every school. */
router.put('/release-bulk', requireRole('admin'), async (req, res) => {
  try {
    const { session, term } = req.body;
    if (!session || !term) {
      return res.status(400).json({ message: 'session and term are required.' });
    }

    const filter = { session, term, schoolId: req.schoolId };

    await TestScore.updateMany(filter, { status: 'released', released: true });

    /* Recalculate SubjectResult for each affected (student, subject) pair
       — still scoped to this school. */
    const affectedScores = await TestScore.find(filter).select('student subject').lean();
    const seen = new Set();
    for (const ts of affectedScores) {
      const key = `${ts.student}_${ts.subject}`;
      if (seen.has(key)) continue;
      seen.add(key);
      SubjectResult.recalc(req.schoolId, ts.student, ts.subject, session, term)
        .catch(e => console.warn('[testScores release-bulk recalc]', e.message));
    }

    res.json({ message: `All scores for ${session} ${term} released.` });
  } catch (err) {
    console.error('[PUT /test-scores/release-bulk]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE — admin only, within this school ──────────────── */
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await TestScore.findOneAndDelete({
      _id      : req.params.id,
      schoolId : req.schoolId,
    });
    if (!deleted) return res.status(404).json({ message: 'Test score not found in this school.' });
    res.json({ message: 'Test score deleted.' });
  } catch (err) {
    console.error('[DELETE /test-scores]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

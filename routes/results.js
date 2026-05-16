// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/results.js
//    IMPORTANT: Does NOT import any other route file.
//    recalc() called via SubjectResult static method only.
//    ═══════════════════════════════════════════════════════════ */
// const express       = require('express');
// const router        = express.Router();
// const Result        = require('../models/Result');
// const SubjectResult = require('../models/SubjectResult');
// const auth          = require('../middleware/auth');

// /* GET — all results */
// router.get('/', auth, async (req, res) => {
//   try {
//     const results = await Result.find()
//       .populate('student', 'firstName lastName username class')
//       .populate('exam',    'title subject targetClass session term')
//       .sort({ createdAt: -1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /results]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* GET — results for one student */
// router.get('/student/:studentId', auth, async (req, res) => {
//   try {
//     const results = await Result.find({ student: req.params.studentId })
//       .populate('exam', 'title subject targetClass session term')
//       .sort({ createdAt: -1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /results/student]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* GET — released results for one student */
// router.get('/student/:studentId/released', auth, async (req, res) => {
//   try {
//     const results = await Result.find({
//       student  : req.params.studentId,
//       released : true
//     })
//       .populate('exam', 'title subject targetClass session term')
//       .sort({ createdAt: -1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /results/student/released]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* GET — results for one exam */
// router.get('/exam/:examId', auth, async (req, res) => {
//   try {
//     const results = await Result.find({ exam: req.params.examId })
//       .populate('student', 'firstName lastName username class')
//       .sort({ createdAt: -1 });
//     res.json(results);
//   } catch (err) {
//     console.error('[GET /results/exam]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* POST — student submits exam */
// router.post('/', auth, async (req, res) => {
//   try {
//     const existing = await Result.findOne({
//       student : req.body.student,
//       exam    : req.body.exam
//     });
//     if (existing) {
//       return res.status(400).json({ message: 'You have already submitted this exam.' });
//     }
//     const result = new Result(req.body);
//     await result.save();
//     res.json(result);
//   } catch (err) {
//     console.error('[POST /results]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// /* PUT — teacher marks theory OR admin releases result */
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const result = await Result.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { returnDocument: 'after' }
//     ).populate('exam', 'title subject session term');

//     if (!result) {
//       return res.status(404).json({ message: 'Result not found.' });
//     }

//     /* Trigger recalc when theory is scored or result is released */
//     const needsRecalc = req.body.theoryScore !== undefined || req.body.released === true;
//     if (needsRecalc) {
//       const exam    = result.exam || {};
//       const subject = result.subject || exam.subject || '';
//       const session = exam.session   || '';
//       const term    = exam.term      || '';
//       SubjectResult.recalc(result.student, subject, session, term)
//         .catch(e => console.warn('[results PUT recalc]', e.message));
//     }

//     res.json(result);
//   } catch (err) {
//     console.error('[PUT /results]', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/results.js

   FIXED:
   1. Every query scoped to req.schoolId via schoolTenant.
   2. Students/exams referenced in a submission are verified
      to belong to the admin's school before any write.
   3. schoolId is stripped from req.body to prevent hijack.
   4. Non-admin users can only see their own results.
   5. SubjectResult.recalc is called with schoolId first.
   ═══════════════════════════════════════════════════════════ */
const express       = require('express');
const router        = express.Router();
const Result        = require('../models/Result');
const SubjectResult = require('../models/SubjectResult');
const User          = require('../models/User');
const Exam          = require('../models/Exam');
const auth          = require('../middleware/auth');
const schoolTenant  = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

router.use(auth);
router.use(schoolTenant);

/* ── GET all results (admin = all; teacher = only their own exams) ── */
router.get('/', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const filter = { schoolId: req.schoolId };

    if (req.user.role === 'teacher') {
      /* Find the exams this teacher created, then restrict results to those. */
      const myExams = await Exam.find(
        {
          schoolId: req.schoolId,
          $or: [
            { createdBy    : req.user.username },
            { createdBy    : req.user.id },
            { createdByName: req.user.name },
          ],
        },
        '_id'
      ).lean();
      filter.exam = { $in: myExams.map(e => e._id) };
    }

    const results = await Result.find(filter)
      .populate('student', 'firstName lastName username class')
      .populate('exam',    'title subject targetClass session term createdBy createdByName')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /results]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET results for one student ─────────────────────────── *
   Students may view their own results; admins/teachers
   may view any student within their school.                   */
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

    const results = await Result.find({ student: studentId, schoolId: req.schoolId })
      .populate('exam', 'title subject targetClass session term')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /results/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET released results for one student ────────────────── */
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

    const results = await Result.find({
      student  : studentId,
      schoolId : req.schoolId,
      released : true,
    })
      .populate('exam', 'title subject targetClass session term')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /results/student/released]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET results for one exam (admin/teacher) ────────────── */
router.get('/exam/:examId', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const { examId } = req.params;
    /* Verify exam belongs to this school */
    const exam = await Exam.findOne({ _id: examId, schoolId: req.schoolId }).select('_id');
    if (!exam) return res.status(404).json({ message: 'Exam not found in this school.' });

    const results = await Result.find({ exam: examId, schoolId: req.schoolId })
      .populate('student', 'firstName lastName username class')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error('[GET /results/exam]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST — student submits an exam ──────────────────────── */
router.post('/', async (req, res) => {
  try {
    /* Strip any client-supplied schoolId */
    delete req.body.schoolId;

    const { student, exam } = req.body;
    if (!student || !exam) {
      return res.status(400).json({ message: 'student and exam are required.' });
    }

    /* A student can only submit for themselves */
    if (req.user.role === 'student' && String(req.user.id) !== String(student)) {
      return res.status(403).json({ message: 'You can only submit your own results.' });
    }

    /* Verify student and exam both belong to this school */
    const [studentDoc, examDoc] = await Promise.all([
      User.findOne({ _id: student, schoolId: req.schoolId }).select('_id'),
      Exam.findOne({ _id: exam,    schoolId: req.schoolId }).select('_id'),
    ]);
    if (!studentDoc) return res.status(404).json({ message: 'Student not found in this school.' });
    if (!examDoc)    return res.status(404).json({ message: 'Exam not found in this school.'    });

    const existing = await Result.findOne({ student, exam, schoolId: req.schoolId });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this exam.' });
    }

    const result = new Result({ ...req.body, schoolId: req.schoolId });
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    console.error('[POST /results]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT — teacher marks theory OR admin releases result ── */
router.put('/:id', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    delete req.body.schoolId;

    /* A teacher may only mark / update results for exams they themselves
       created. Admins can touch any result in their school.               */
    if (req.user.role === 'teacher') {
      const existing = await Result.findOne(
        { _id: req.params.id, schoolId: req.schoolId }
      ).populate('exam', 'createdBy createdByName');

      if (!existing) {
        return res.status(404).json({ message: 'Result not found in this school.' });
      }

      const creator = existing.exam && (existing.exam.createdBy || '');
      const mine = creator && (
        creator === req.user.username ||
        creator === req.user.id ||
        creator === req.user.name
      );
      if (!mine) {
        return res.status(403).json({
          message: 'You can only mark results for exams you created.',
        });
      }
    }

    const result = await Result.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      req.body,
      { returnDocument: 'after' }
    ).populate('exam', 'title subject session term');

    if (!result) {
      return res.status(404).json({ message: 'Result not found in this school.' });
    }

    /* Trigger recalc when theory score is set or result is released */
    const needsRecalc = req.body.theoryScore !== undefined || req.body.released === true;
    if (needsRecalc) {
      const exam    = result.exam || {};
      const subject = result.subject || exam.subject || '';
      const session = exam.session   || '';
      const term    = exam.term      || '';
      SubjectResult.recalc(req.schoolId, result.student, subject, session, term)
        .catch(e => console.warn('[results PUT recalc]', e.message));
    }

    res.json(result);
  } catch (err) {
    console.error('[PUT /results]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

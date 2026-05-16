// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/fees.js
//    ═══════════════════════════════════════════════════════════ */
// const express = require('express');
// const router  = express.Router();
// const Fee     = require('../models/Fee');
// const auth    = require('../middleware/auth');

// /* GET — all fee records (admin) */
// router.get('/', auth, async (req, res) => {
//   try {
//     const fees = await Fee.find()
//       .populate('student', 'firstName lastName username class')
//       .sort({ createdAt: -1 });
//     res.json(fees);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* GET — fee record for a specific student */
// router.get('/student/:studentId', auth, async (req, res) => {
//   try {
//     const fee = await Fee.findOne({ student: req.params.studentId })
//       .populate('student', 'firstName lastName username class');
//     if (!fee) return res.status(404).json({ message: 'No fee record found.' });
//     res.json(fee);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — update fee record (admin) */
// router.put('/student/:studentId', auth, async (req, res) => {
//   try {
//     const fee = await Fee.findOneAndUpdate(
//       { student: req.params.studentId },
//       req.body,
//       { new: true, upsert: true }
//     ).populate('student', 'firstName lastName username class');
//     res.json(fee);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;


/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/fees.js

   FIXED: Every query is scoped to req.schoolId. Students
   referenced in fee records are verified to belong to the
   same school before any fee is read, created, or updated.
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const router  = express.Router();
const Fee     = require('../models/Fee');
const User    = require('../models/User');
const auth    = require('../middleware/auth');
const schoolTenant = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

/* All fee routes require auth + school isolation */
router.use(auth);
router.use(schoolTenant);

/* ── GET all fee records for this school (admin) ─────────── */
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const fees = await Fee.find({ schoolId: req.schoolId })
      .populate('student', 'firstName lastName username class')
      .sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    console.error('[GET /fees]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── GET fee record for a specific student ────────────────── *
   A student can view their own fee; admins can view any fee
   within their school.                                         */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    /* Non-admins can only see their own fee */
    if (req.user.role !== 'admin' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    /* Verify the student actually belongs to this school */
    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const fee = await Fee.findOne({ student: studentId, schoolId: req.schoolId })
      .populate('student', 'firstName lastName username class');
    if (!fee) return res.status(404).json({ message: 'No fee record found.' });
    res.json(fee);
  } catch (err) {
    console.error('[GET /fees/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT upsert fee record (admin only) ───────────────────── */
router.put('/student/:studentId', requireRole('admin'), async (req, res) => {
  try {
    const { studentId } = req.params;

    /* Strip any client-supplied schoolId — never trust it */
    delete req.body.schoolId;

    /* Verify student belongs to this school before modifying */
    const student = await User.findOne({ _id: studentId, schoolId: req.schoolId }).select('_id');
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const fee = await Fee.findOneAndUpdate(
      { student: studentId, schoolId: req.schoolId },
      { ...req.body, student: studentId, schoolId: req.schoolId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('student', 'firstName lastName username class');
    res.json(fee);
  } catch (err) {
    console.error('[PUT /fees/student]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

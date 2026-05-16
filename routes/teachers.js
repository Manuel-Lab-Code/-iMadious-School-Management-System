// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/teachers.js
//    Handles teacher management and salary tracking for admins.
   
//    IMPORTANT: Route order matters! Specific routes must come
//    BEFORE generic /:id routes to avoid catch-all conflicts.
//    ═══════════════════════════════════════════════════════════ */
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const TeacherPayment = require('../models/TeacherPayment');
// const auth = require('../middleware/auth');

// /* ── MIDDLEWARE: Check if user is admin ──────────────────── */
// function requireAdmin(req, res, next) {
//   if (req.user?.role !== 'admin') {
//     return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
//   }
//   next();
// }

// /* ═══════════════════════════════════════════════════════════
//    GENERIC ROUTES (no parameters)
//    ═══════════════════════════════════════════════════════════ */

// /* Get all approved teachers with pagination */
// router.get('/', auth, async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 20;
//     const skip = (page - 1) * limit;

//     const teachers = await User.find({
//       role: 'teacher',
//       approvalStatus: 'approved',
//     })
//       .select('-password')
//       .sort({ employmentDate: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await User.countDocuments({
//       role: 'teacher',
//       approvalStatus: 'approved',
//     });

//     res.json({
//       teachers,
//       pagination: { page, limit, total, pages: Math.ceil(total / limit) },
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Add new teacher (admin only) */
// router.post('/', auth, requireAdmin, async (req, res) => {
//   try {
//     const { firstName, lastName, username, email, subject, salary } = req.body;

//     // Check if username already exists
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ error: 'Username already exists' });
//     }

//     const teacher = new User({
//       firstName,
//       lastName,
//       username,
//       email,
//       role: 'teacher',
//       subject,
//       salary: salary || 0,
//       employmentDate: new Date(),
//       password: 'temp123',  // Should be changed by teacher
//       approvalStatus: 'approved',  // Auto-approved if added by admin
//       approvedBy: req.user?.username || 'admin',
//       approvalDate: new Date(),
//     });

//     const bcrypt = require('bcryptjs');
//     const salt = await bcrypt.genSalt(10);
//     teacher.password = await bcrypt.hash(teacher.password, salt);

//     await teacher.save();
//     res.status(201).json({ message: 'Teacher added successfully', teacher: teacher._id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ═══════════════════════════════════════════════════════════
//    SPECIFIC NAMED ROUTES (must come before /:id)
//    ═══════════════════════════════════════════════════════════ */

// /* Get pending teacher registrations (for approval) */
// router.get('/pending-registrations', auth, requireAdmin, async (req, res) => {
//   try {
//     const pending = await User.find({
//       role: 'teacher',
//       approvalStatus: 'pending',
//     }).select('-password');

//     res.json({ pending });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ═══════════════════════════════════════════════════════════
//    ROUTES WITH /:id AND SUBPATHS (must come before generic /:id)
//    ═══════════════════════════════════════════════════════════ */

// /* Get teacher salary payments and history */
// router.get('/:id/salary', auth, requireAdmin, async (req, res) => {
//   try {
//     const { year, month } = req.query;
//     let filter = { teacherId: req.params.id };

//     if (year && month) {
//       const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
//       filter.month = monthStr;
//     } else if (year) {
//       filter.month = new RegExp(`^${year}`);
//     }

//     const payments = await TeacherPayment.find(filter).sort({ month: -1 });
//     const teacher = await User.findById(req.params.id).select('firstName lastName salary');

//     res.json({ teacher, payments });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Record teacher salary payment (admin only) */
// router.post('/:id/salary', auth, requireAdmin, async (req, res) => {
//   try {
//     const { month, salary, status, notes } = req.body;

//     // Check if payment already exists for this month
//     const existing = await TeacherPayment.findOne({
//       teacherId: req.params.id,
//       month,
//     });

//     if (existing) {
//       return res.status(400).json({ error: 'Payment already recorded for this month' });
//     }

//     const payment = new TeacherPayment({
//       teacherId: req.params.id,
//       month,
//       salary: salary || 0,
//       status: status || 'pending',
//       notes,
//       paidBy: req.user?.username || 'admin',
//       paidOn: status === 'paid' ? new Date() : null,
//     });

//     await payment.save();
//     res.status(201).json({ message: 'Salary payment recorded', payment });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Approve teacher registration (admin only) */
// router.put('/:id/approve', auth, requireAdmin, async (req, res) => {
//   try {
//     const teacher = await User.findByIdAndUpdate(
//       req.params.id,
//       {
//         approvalStatus: 'approved',
//         approvedBy: req.user?.username || 'admin',
//         approvalDate: new Date(),
//       },
//       { new: true }
//     ).select('-password');

//     res.json({ message: 'Teacher approved successfully', teacher });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Reject teacher registration (admin only) */
// router.put('/:id/reject', auth, requireAdmin, async (req, res) => {
//   try {
//     const { reason } = req.body;

//     const teacher = await User.findByIdAndUpdate(
//       req.params.id,
//       {
//         approvalStatus: 'rejected',
//         approvedBy: req.user?.username || 'admin',
//         approvalDate: new Date(),
//         rejectionReason: reason || 'No reason provided',
//       },
//       { new: true }
//     ).select('-password');

//     res.json({ message: 'Teacher rejected', teacher });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Edit teacher profile (admin only) */
// router.put('/:id/admin-edit', auth, requireAdmin, async (req, res) => {
//   try {
//     const { firstName, lastName, email, subject, salary, employmentDate } = req.body;

//     const teacher = await User.findByIdAndUpdate(
//       req.params.id,
//       {
//         firstName,
//         lastName,
//         email,
//         subject,
//         salary,
//         ...(employmentDate && { employmentDate: new Date(employmentDate) }),
//       },
//       { new: true }
//     ).select('-password');

//     if (!teacher) {
//       return res.status(404).json({ error: 'Teacher not found' });
//     }

//     res.json({ message: 'Teacher profile updated', teacher });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Update salary payment status (admin only) */
// router.put('/payment/:paymentId', auth, requireAdmin, async (req, res) => {
//   try {
//     const { status, notes } = req.body;

//     const payment = await TeacherPayment.findByIdAndUpdate(
//       req.params.paymentId,
//       {
//         status,
//         ...(status === 'paid' && { paidOn: new Date() }),
//         ...(notes && { notes }),
//         paidBy: req.user?.username || 'admin',
//       },
//       { new: true }
//     );

//     res.json({ message: 'Payment status updated', payment });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ═══════════════════════════════════════════════════════════
//    GENERIC /:id ROUTES (must come last)
//    ═══════════════════════════════════════════════════════════ */

// /* Get specific teacher by ID */
// router.get('/:id', auth, requireAdmin, async (req, res) => {
//   try {
//     const teacher = await User.findById(req.params.id).select('-password');
//     if (!teacher || teacher.role !== 'teacher') {
//       return res.status(404).json({ error: 'Teacher not found' });
//     }
//     res.json(teacher);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* Delete teacher (admin only) */
// router.delete('/:id', auth, requireAdmin, async (req, res) => {
//   try {
//     const teacher = await User.findByIdAndDelete(req.params.id);

//     if (!teacher) {
//       return res.status(404).json({ error: 'Teacher not found' });
//     }

//     // Also delete all salary payments for this teacher
//     await TeacherPayment.deleteMany({ teacherId: req.params.id });

//     res.json({ message: 'Teacher and associated payments deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;



/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/teachers.js
   Teacher management and salary tracking.

   FIXED:
   1. Every User and TeacherPayment query scoped to req.schoolId.
   2. Teacher created by POST / now carries schoolId and
      schoolName (copied from the admin's token).
   3. Username-uniqueness check is now per-school, matching the
      UserSchema compound index { email: 1, schoolId: 1 }.
   4. /:id/salary and payment operations verify the teacher
      belongs to the admin's school before proceeding.
   5. DELETE cleans up only payments tied to this teacher in
      this school.
   6. Route-ordering preserved: /pending-registrations, /:id/*
      subpaths, /payment/:paymentId all come before generic /:id.
   ═══════════════════════════════════════════════════════════ */
const express         = require('express');
const router          = express.Router();
const bcrypt          = require('bcryptjs');
const User            = require('../models/User');
const TeacherPayment  = require('../models/TeacherPayment');
const auth            = require('../middleware/auth');
const schoolTenant    = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

router.use(auth);
router.use(schoolTenant);

/* Alias for legacy naming inside this file */
const requireAdmin = requireRole('admin');

/* ═══════════════════════════════════════════════════════════
   GENERIC ROUTES (no parameters)
   ═══════════════════════════════════════════════════════════ */

/* Get all approved teachers (THIS SCHOOL) with pagination */
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const skip  = (page - 1) * limit;

    const filter = {
      role           : 'teacher',
      approvalStatus : 'approved',
      schoolId       : req.schoolId,
    };

    const [teachers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ employmentDate: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      teachers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /teachers]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Add new teacher (admin only) — scoped to admin's school */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, username, email, subject, salary } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required.' });
    }

    /* Uniqueness is per-school (matches the compound index in User.js) */
    const [usernameTaken, emailTaken] = await Promise.all([
      User.findOne({ username, schoolId: req.schoolId }).select('_id'),
      User.findOne({ email,    schoolId: req.schoolId }).select('_id'),
    ]);
    if (usernameTaken) return res.status(400).json({ error: 'Username already exists in this school.' });
    if (emailTaken)    return res.status(400).json({ error: 'Email already exists in this school.'    });

    /* Hash a default password — teacher should reset on first login */
    const hash = await bcrypt.hash('temp123', 10);

    const teacher = new User({
      firstName,
      lastName,
      username,
      email,
      role           : 'teacher',
      subject,
      salary         : Number(salary) || 0,
      employmentDate : new Date(),
      password       : hash,
      approvalStatus : 'approved',
      approvedBy     : req.user?.username || 'admin',
      approvalDate   : new Date(),
      schoolId       : req.schoolId,
      schoolName     : req.school?.name || '',
    });

    await teacher.save();
    res.status(201).json({ message: 'Teacher added successfully', teacherId: teacher._id });
  } catch (err) {
    console.error('[POST /teachers]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   SPECIFIC NAMED ROUTES (must come before /:id)
   ═══════════════════════════════════════════════════════════ */

/* Get pending teacher registrations (for approval) */
router.get('/pending-registrations', requireAdmin, async (req, res) => {
  try {
    const pending = await User.find({
      role           : 'teacher',
      approvalStatus : 'pending',
      schoolId       : req.schoolId,
    }).select('-password');

    res.json({ pending });
  } catch (err) {
    console.error('[GET /teachers/pending-registrations]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Update salary payment status — scoped to admin's school.
   IMPORTANT: this literal path must appear before generic /:id. */
router.put('/payment/:paymentId', requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const payment = await TeacherPayment.findOneAndUpdate(
      { _id: req.params.paymentId, schoolId: req.schoolId },
      {
        status,
        ...(status === 'paid' && { paidOn: new Date() }),
        ...(notes && { notes }),
        paidBy: req.user?.username || 'admin',
      },
      { new: true }
    );

    if (!payment) return res.status(404).json({ error: 'Payment not found in this school.' });
    res.json({ message: 'Payment status updated', payment });
  } catch (err) {
    console.error('[PUT /teachers/payment]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   /:id SUBPATH ROUTES (must come before generic /:id)
   ═══════════════════════════════════════════════════════════ */

/* Helper — ensure the teacher belongs to this school */
async function findTeacherInSchool(id, schoolId) {
  return User.findOne({ _id: id, role: 'teacher', schoolId });
}

/* Get teacher salary payments & history */
router.get('/:id/salary', requireAdmin, async (req, res) => {
  try {
    const teacher = await findTeacherInSchool(req.params.id, req.schoolId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });

    const { year, month } = req.query;
    const filter = { teacherId: req.params.id, schoolId: req.schoolId };

    if (year && month) {
      filter.month = `${year}-${month.toString().padStart(2, '0')}`;
    } else if (year) {
      filter.month = new RegExp(`^${year}`);
    }

    const payments = await TeacherPayment.find(filter).sort({ month: -1 });
    const summary  = await User.findById(req.params.id).select('firstName lastName salary');

    res.json({ teacher: summary, payments });
  } catch (err) {
    console.error('[GET /teachers/:id/salary]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Record teacher salary payment */
router.post('/:id/salary', requireAdmin, async (req, res) => {
  try {
    const teacher = await findTeacherInSchool(req.params.id, req.schoolId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });

    const { month, salary, status, notes } = req.body;
    if (!month) return res.status(400).json({ error: 'month is required (YYYY-MM format).' });

    const existing = await TeacherPayment.findOne({
      teacherId : req.params.id,
      schoolId  : req.schoolId,
      month,
    });
    if (existing) {
      return res.status(400).json({ error: 'Payment already recorded for this month.' });
    }

    const payment = new TeacherPayment({
      schoolId  : req.schoolId,
      teacherId : req.params.id,
      month,
      salary    : Number(salary) || 0,
      status    : status || 'pending',
      notes,
      paidBy    : req.user?.username || 'admin',
      paidOn    : status === 'paid' ? new Date() : null,
    });

    await payment.save();
    res.status(201).json({ message: 'Salary payment recorded', payment });
  } catch (err) {
    console.error('[POST /teachers/:id/salary]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Approve teacher registration */
router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher', schoolId: req.schoolId },
      {
        approvalStatus : 'approved',
        approvedBy     : req.user?.username || 'admin',
        approvalDate   : new Date(),
      },
      { new: true }
    ).select('-password');

    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });
    res.json({ message: 'Teacher approved successfully', teacher });
  } catch (err) {
    console.error('[PUT /teachers/:id/approve]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Reject teacher registration */
router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher', schoolId: req.schoolId },
      {
        approvalStatus  : 'rejected',
        approvedBy      : req.user?.username || 'admin',
        approvalDate    : new Date(),
        rejectionReason : reason || 'No reason provided',
      },
      { new: true }
    ).select('-password');

    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });
    res.json({ message: 'Teacher rejected', teacher });
  } catch (err) {
    console.error('[PUT /teachers/:id/reject]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Edit teacher profile */
router.put('/:id/admin-edit', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, subject, salary, employmentDate } = req.body;

    /* Strip schoolId from body — never allow reassignment */
    const update = {
      firstName,
      lastName,
      email,
      subject,
      salary,
      ...(employmentDate && { employmentDate: new Date(employmentDate) }),
    };

    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher', schoolId: req.schoolId },
      update,
      { new: true }
    ).select('-password');

    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });
    res.json({ message: 'Teacher profile updated', teacher });
  } catch (err) {
    console.error('[PUT /teachers/:id/admin-edit]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GENERIC /:id ROUTES (must come last)
   ═══════════════════════════════════════════════════════════ */

/* Get specific teacher by ID */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id      : req.params.id,
      role     : 'teacher',
      schoolId : req.schoolId,
    }).select('-password');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });
    res.json(teacher);
  } catch (err) {
    console.error('[GET /teachers/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* Delete teacher and all their payments in this school */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({
      _id      : req.params.id,
      role     : 'teacher',
      schoolId : req.schoolId,
    });

    if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });

    await TeacherPayment.deleteMany({
      teacherId : req.params.id,
      schoolId  : req.schoolId,
    });

    res.json({ message: 'Teacher and associated payments deleted.' });
  } catch (err) {
    console.error('[DELETE /teachers/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

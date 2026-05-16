// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const Fee = require('../models/Fee');
// const auth = require('../middleware/auth');
// const { getSubjectsByDepartment, validateSubjects, requiresDepartment } = require('../config/subjectCombinations');

// /* ═══════════════════════════════════════════════════════════
//    Get all students (admin only)
//    GET /api/students
//    ═══════════════════════════════════════════════════════════ */
// router.get('/', auth, async (req, res) => {
//   try {
//     // Check if user is admin (admin has role 'admin' in token)
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     // Filter by schoolId if present (school admin), otherwise get all (global admin)
//     const filter = { role: 'student' };
//     if (req.user.schoolId) {
//       filter.schoolId = req.user.schoolId;
//     }

//     const students = await User.find(filter).select('-password');
//     res.json(students);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    Student Dashboard - View own profile & subjects
//    GET /api/students/dashboard
//    ═══════════════════════════════════════════════════════════ */
// router.get('/dashboard', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'student') {
//       return res.status(403).json({ message: 'Student access only.' });
//     }

//     const student = await User.findById(req.user.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     // Get fee information
//     const fee = await Fee.findOne({ student: req.user.id });

//     // Build response with subjects
//     const isDepartmentBased = requiresDepartment(student.class);

//     const dashboardData = {
//       profile: {
//         id: student._id,
//         firstName: student.firstName,
//         lastName: student.lastName,
//         username: student.username,
//         email: student.email,
//         class: student.class,
//         department: student.department || null,
//         parentPhoneNumber: student.parentPhoneNumber || null,
//         role: student.role,
//         isActive: student.isActive,
//         createdAt: student.createdAt
//       },
//       subjects: {
//         list: student.subjects,
//         count: student.subjects.length,
//         isDepartmentBased: isDepartmentBased,
//         classLevel: student.class
//       },
//       fees: fee ? {
//         total: fee.total,
//         paid: fee.paid,
//         pending: fee.total - fee.paid,
//         status: fee.status
//       } : null
//     };

//     res.json(dashboardData);

//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    Get specific student profile (admin only)
//    GET /api/students/:id
//    NOTE: This must come AFTER all specific routes like /dashboard, 
//    /pending-registrations, etc. because /:id matches any path
//    ═══════════════════════════════════════════════════════════ */

// /* ═══════════════════════════════════════════════════════════
//    GET PENDING REGISTRATIONS (students & teachers)
//    GET /api/students/pending-registrations
//    ═══════════════════════════════════════════════════════════ */
// router.get('/pending-registrations', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     // Filter by schoolId if present (school admin), otherwise get all (global admin)
//     const filter = {
//       approvalStatus: 'pending',
//       role: { $in: ['student', 'teacher'] }
//     };
//     if (req.user.schoolId) {
//       filter.schoolId = req.user.schoolId;
//     }

//     // Get all pending registrations (students and teachers)
//     const pending = await User.find(filter).select('-password').sort({ createdAt: -1 });

//     // Get counts
//     const approvedFilter = {
//       approvalStatus: 'approved',
//       role: { $in: ['student', 'teacher'] }
//     };
//     if (req.user.schoolId) {
//       approvedFilter.schoolId = req.user.schoolId;
//     }
//     const approved = await User.countDocuments(approvedFilter);

//     const rejectedFilter = {
//       approvalStatus: 'rejected',
//       role: { $in: ['student', 'teacher'] }
//     };
//     if (req.user.schoolId) {
//       rejectedFilter.schoolId = req.user.schoolId;
//     }
//     const rejected = await User.countDocuments(rejectedFilter);

//     res.json({
//       pending,
//       counts: {
//         pending: pending.length,
//         approved,
//         rejected
//       }
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    Get specific student profile (admin only)
//    GET /api/students/:id
//    ════════════════════════════════════════════════════════════ */
// router.get('/:id', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const student = await User.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     // Ensure school admin can only access their school's students
//     if (req.user.schoolId && student.schoolId?.toString() !== req.user.schoolId.toString()) {
//       return res.status(403).json({ message: 'You can only access students from your school.' });
//     }

//     // Get fee information
//     const fee = await Fee.findOne({ student: req.params.id });

//     res.json({
//       ...student.toObject(),
//       __v: undefined,
//       fee: fee || null
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // Add student (admin only)
// router.post('/', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const { firstName, lastName, username, email, password, class: cls, department, subjects, parentPhoneNumber } = req.body;

//     const hashed = await bcrypt.hash(password, 10);
//     const student = new User({
//       firstName,
//       lastName,
//       username,
//       email,
//       password: hashed,
//       role: 'student',
//       class: cls,
//       department: department || undefined,
//       subjects: subjects || [],
//       parentPhoneNumber: parentPhoneNumber || undefined
//     });

//     await student.save();
//     await new Fee({ schoolId, student: student._id }).save();

//     res.json({ message: 'Student added successfully.', student: student.toObject() });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    APPROVE REGISTRATION (specific route before /:id)
//    PUT /api/students/:id/approve
//    ═══════════════════════════════════════════════════════════ */
// router.put('/:id/approve', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Ensure school admin can only approve their school's registrations
//     if (req.user.schoolId && user.schoolId?.toString() !== req.user.schoolId.toString()) {
//       return res.status(403).json({ message: 'You can only approve registrations from your school.' });
//     }

//     if (user.approvalStatus !== 'pending') {
//       return res.status(400).json({ message: 'Only pending registrations can be approved.' });
//     }

//     user.approvalStatus = 'approved';
//     user.approvedBy = req.user.username;
//     user.approvalDate = new Date();
//     await user.save();

//     res.json({
//       message: `${user.role === 'student' ? 'Student' : 'Teacher'} approved successfully.`,
//       user: user.toObject()
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    REJECT REGISTRATION (specific route before /:id)
//    PUT /api/students/:id/reject
//    Body: { reason }
//    ═══════════════════════════════════════════════════════════ */
// router.put('/:id/reject', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const { reason } = req.body;
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Ensure school admin can only reject their school's registrations
//     if (req.user.schoolId && user.schoolId?.toString() !== req.user.schoolId.toString()) {
//       return res.status(403).json({ message: 'You can only reject registrations from your school.' });
//     }

//     user.approvedBy = req.user.username;
//     user.approvalDate = new Date();
//     await user.save();

//     res.json({
//       message: `${user.role === 'student' ? 'Student' : 'Teacher'} registration rejected.`,
//       user: user.toObject()
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* ═══════════════════════════════════════════════════════════
//    ADMIN EDIT STUDENT PROFILE
//    PUT /api/students/:id/admin-edit
//    Admin can edit: names, username, class, email, parent phone,
//    password, department, and payment status
//    ═══════════════════════════════════════════════════════════ */
// router.put('/:id/admin-edit', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const student = await User.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     // Ensure school admin can only edit their school's students
//     if (req.user.schoolId && student.schoolId?.toString() !== req.user.schoolId.toString()) {
//       return res.status(403).json({ message: 'You can only edit students from your school.' });
//     }

//     const { firstName, lastName, username, email, password, class: cls, department, parentPhoneNumber, paymentStatus } = req.body;

//     // Update basic info
//     if (firstName !== undefined) student.firstName = firstName;
//     if (lastName !== undefined) student.lastName = lastName;
//     if (email !== undefined) {
//       // Check if email already exists
//       const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
//       if (existing) {
//         return res.status(400).json({ message: 'Email already in use by another student.' });
//       }
//       student.email = email;
//     }
//     if (username !== undefined) {
//       // Check if username already exists
//       const existing = await User.findOne({ username, _id: { $ne: req.params.id } });
//       if (existing) {
//         return res.status(400).json({ message: 'Username already taken.' });
//       }
//       student.username = username;
//     }
//     if (password !== undefined) {
//       student.password = await bcrypt.hash(password, 10);
//     }
//     if (parentPhoneNumber !== undefined) {
//       student.parentPhoneNumber = parentPhoneNumber;
//     }

//     // Handle class change
//     if (cls !== undefined) {
//       student.class = cls;

//       // If class changed and it's SSS, department is required
//       const isDepartmentBased = requiresDepartment(cls);
//       if (isDepartmentBased) {
//         if (!department) {
//           return res.status(400).json({
//             message: `${cls} requires a department (SCIENCE, ART, or COMMERCIAL).`
//           });
//         }
//         student.department = department;
//         // Auto-assign subjects for the new department
//         student.subjects = getSubjectsByDepartment(department);
//       } else {
//         // It's JSS — clear department, subjects remain editable
//         student.department = undefined;
//       }
//     }

//     // Handle department change (for SSS students)
//     if (department !== undefined) {
//       const isDepartmentBased = requiresDepartment(student.class);
//       if (!isDepartmentBased) {
//         return res.status(400).json({
//           message: `${student.class} students cannot have a department.`
//         });
//       }
//       student.department = department;
//       // Auto-assign subjects for the department
//       student.subjects = getSubjectsByDepartment(department);
//     }

//     // Update fee/payment status
//     if (paymentStatus !== undefined) {
//       const fee = await Fee.findOne({ student: req.params.id });
//       if (fee) {
//         if (['unpaid', 'partial', 'paid'].includes(paymentStatus)) {
//           fee.status = paymentStatus;
//           await fee.save();
//         } else {
//           return res.status(400).json({
//             message: 'Invalid payment status. Use: unpaid, partial, or paid'
//           });
//         }
//       }
//     }

//     await student.save();

//     res.json({
//       message: 'Student profile updated successfully.',
//       student: student.toObject()
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// /* ═══════════════════════════════════════════════════════════
//    UPDATE STUDENT (legacy endpoint, use admin-edit for admin)
//    PUT /api/students/:id
//    ═══════════════════════════════════════════════════════════ */
// router.put('/:id', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const updates = { ...req.body };
//     if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
//     const student = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
//     res.json(student);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // Delete student
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Admin access only.' });
//     }

//     const student = await User.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found.' });
//     }

//     // Ensure school admin can only delete their school's students
//     if (req.user.schoolId && student.schoolId?.toString() !== req.user.schoolId.toString()) {
//       return res.status(403).json({ message: 'You can only delete students from your school.' });
//     }

//     await User.findByIdAndDelete(req.params.id);
//     await Fee.findOneAndDelete({ student: req.params.id });
//     res.json({ message: 'Student deleted.' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/students.js

   FIXED:
   1. Switched to auth + schoolTenant middleware (was ad-hoc
      req.user.schoolId checks before).
   2. GET /  — scoped.
   3. GET /dashboard — student sees own data only; Fee lookup
      also filtered by schoolId as defence in depth.
   4. GET /pending-registrations — scoped.
   5. GET /:id — scoped (student-in-school verification).
   6. POST / — CRITICAL FIX: previously `new Fee({ schoolId })`
      referenced a bare `schoolId` variable that did not exist,
      so every admin-created student would crash or create an
      orphan fee row. Now schoolId/schoolName are injected
      from req.schoolId / req.school. Per-school username/email
      uniqueness matches the User compound index.
   7. PUT /:id/approve, /reject — scoped.
   8. PUT /:id/admin-edit — scoped; Fee update also scoped;
      username/email uniqueness is per-school.
   9. PUT /:id (legacy) — now strips schoolId, verifies school.
   10. DELETE /:id — Fee/Result/TestScore/SubjectResult for the
       student within the school also cleaned up.
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User           = require('../models/User');
const Fee            = require('../models/Fee');
const Result         = require('../models/Result');
const TestScore      = require('../models/TestScore');
const SubjectResult  = require('../models/SubjectResult');
const auth           = require('../middleware/auth');
const schoolTenant   = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');
const {
  getSubjectsByDepartment,
  validateSubjects,
  requiresDepartment,
} = require('../config/subjectCombinations');

router.use(auth);
router.use(schoolTenant);

/* ═══════════════════════════════════════════════════════════
   Get all students in this school (admin only)
   GET /api/students
   ═══════════════════════════════════════════════════════════ */
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const students = await User.find({
      role     : 'student',
      schoolId : req.schoolId,
    }).select('-password');
    res.json(students);
  } catch (err) {
    console.error('[GET /students]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Get students by class — accessible to teachers AND admins
   GET /api/students/by-class?class=JSS%201
   Returns students in this school (optionally filtered by class)
   so teachers can load their school's students for test scoring.
   ═══════════════════════════════════════════════════════════ */
router.get('/by-class', requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const filter = {
      role           : 'student',
      schoolId       : req.schoolId,
      approvalStatus : 'approved',   // only show approved students
    };

    if (req.query.class) {
      // Case-insensitive, space-flexible match so "JSS 2", "jss2", "JSS2"
      // all find the same students regardless of how they were stored.
      const raw = req.query.class.trim();
      const normalized = raw.replace(/\s+/g, '\\s*');
      filter.class = { $regex: new RegExp('^' + normalized + '$', 'i') };
    }

    const students = await User.find(filter)
      .select('_id firstName lastName username class schoolId approvalStatus')
      .sort({ lastName: 1, firstName: 1 });

    console.log('[GET /students/by-class] schoolId=' + req.schoolId + ' class="' + req.query.class + '" -> ' + students.length + ' student(s)');
    res.json(students);
  } catch (err) {
    console.error('[GET /students/by-class]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Student Dashboard — view own profile, subjects, fees
   GET /api/students/dashboard
   ═══════════════════════════════════════════════════════════ */
router.get('/dashboard', requireRole('student'), async (req, res) => {
  try {
    const student = await User.findOne({
      _id      : req.user.id,
      schoolId : req.schoolId,
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    /* Defense in depth: Fee lookup scoped by schoolId too */
    const fee = await Fee.findOne({
      student  : req.user.id,
      schoolId : req.schoolId,
    });

    const isDepartmentBased = requiresDepartment(student.class);

    res.json({
      profile: {
        id                : student._id,
        firstName         : student.firstName,
        lastName          : student.lastName,
        username          : student.username,
        email             : student.email,
        class             : student.class,
        department        : student.department || null,
        parentPhoneNumber : student.parentPhoneNumber || null,
        role              : student.role,
        isActive          : student.isActive,
        createdAt         : student.createdAt,
      },
      subjects: {
        list             : student.subjects,
        count            : student.subjects.length,
        isDepartmentBased,
        classLevel       : student.class,
      },
      fees: fee ? {
        total   : fee.total,
        paid    : fee.paid,
        pending : fee.total - fee.paid,
        status  : fee.status,
      } : null,
    });
  } catch (err) {
    console.error('[GET /students/dashboard]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Get pending registrations (students & teachers) for admin
   GET /api/students/pending-registrations
   Registered BEFORE '/:id' so Express matches it first.
   ═══════════════════════════════════════════════════════════ */
router.get('/pending-registrations', requireRole('admin'), async (req, res) => {
  try {
    const baseFilter = {
      role     : { $in: ['student', 'teacher'] },
      schoolId : req.schoolId,
    };

    const [pending, approved, rejected] = await Promise.all([
      User.find({ ...baseFilter, approvalStatus: 'pending' })
        .select('-password')
        .sort({ createdAt: -1 }),
      User.countDocuments({ ...baseFilter, approvalStatus: 'approved' }),
      User.countDocuments({ ...baseFilter, approvalStatus: 'rejected' }),
    ]);

    res.json({
      pending,
      counts: { pending: pending.length, approved, rejected },
    });
  } catch (err) {
    console.error('[GET /students/pending-registrations]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Get specific student profile (admin only)
   GET /api/students/:id
   ═══════════════════════════════════════════════════════════ */
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const student = await User.findOne({
      _id      : req.params.id,
      role     : 'student',
      schoolId : req.schoolId,
    });
    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });

    const fee = await Fee.findOne({
      student  : req.params.id,
      schoolId : req.schoolId,
    });

    res.json({
      ...student.toObject(),
      __v : undefined,
      fee : fee || null,
    });
  } catch (err) {
    console.error('[GET /students/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Add student (admin only) — CRITICAL FIX: schoolId injected
   POST /api/students
   ═══════════════════════════════════════════════════════════ */
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const {
      firstName, lastName, username, email, password,
      class: cls, department, subjects, parentPhoneNumber,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required.' });
    }

    /* Per-school uniqueness (matches User compound index) */
    const [usernameTaken, emailTaken] = await Promise.all([
      User.findOne({ username, schoolId: req.schoolId }).select('_id'),
      User.findOne({ email,    schoolId: req.schoolId }).select('_id'),
    ]);
    if (usernameTaken) return res.status(400).json({ message: 'Username already exists in this school.' });
    if (emailTaken)    return res.status(400).json({ message: 'Email already exists in this school.'    });

    const hashed = await bcrypt.hash(password, 10);
    const student = new User({
      firstName,
      lastName,
      username,
      email,
      password          : hashed,
      role              : 'student',
      class             : cls,
      department        : department || undefined,
      subjects          : subjects || [],
      parentPhoneNumber : parentPhoneNumber || undefined,
      schoolId          : req.schoolId,        // ← was missing
      schoolName        : req.school?.name || '',
      approvalStatus    : 'approved',          // admin-created → auto-approved
      approvedBy        : req.user.username || 'admin',
      approvalDate      : new Date(),
    });

    await student.save();

    /* Create fee record — use req.schoolId (previously `schoolId` was undefined) */
    await new Fee({
      schoolId : req.schoolId,
      student  : student._id,
    }).save();

    res.status(201).json({
      message : 'Student added successfully.',
      student : student.toObject(),
    });
  } catch (err) {
    console.error('[POST /students]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Approve pending registration
   PUT /api/students/:id/approve
   ═══════════════════════════════════════════════════════════ */
router.put('/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findOne({
      _id      : req.params.id,
      schoolId : req.schoolId,
    });
    if (!user) return res.status(404).json({ message: 'User not found in this school.' });

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Only pending registrations can be approved.' });
    }

    user.approvalStatus = 'approved';
    user.approvedBy     = req.user.username;
    user.approvalDate   = new Date();
    await user.save();

    res.json({
      message : `${user.role === 'student' ? 'Student' : 'Teacher'} approved successfully.`,
      user    : user.toObject(),
    });
  } catch (err) {
    console.error('[PUT /students/:id/approve]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Reject registration
   PUT /api/students/:id/reject
   ═══════════════════════════════════════════════════════════ */
router.put('/:id/reject', requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findOne({
      _id      : req.params.id,
      schoolId : req.schoolId,
    });
    if (!user) return res.status(404).json({ message: 'User not found in this school.' });

    user.approvalStatus  = 'rejected';
    user.approvedBy      = req.user.username;
    user.approvalDate    = new Date();
    user.rejectionReason = reason || 'No reason provided';
    await user.save();

    res.json({
      message : `${user.role === 'student' ? 'Student' : 'Teacher'} registration rejected.`,
      user    : user.toObject(),
    });
  } catch (err) {
    console.error('[PUT /students/:id/reject]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Admin edits student profile
   PUT /api/students/:id/admin-edit
   ═══════════════════════════════════════════════════════════ */
router.put('/:id/admin-edit', requireRole('admin'), async (req, res) => {
  try {
    const student = await User.findOne({
      _id      : req.params.id,
      role     : 'student',
      schoolId : req.schoolId,
    });
    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });

    const {
      firstName, lastName, username, email, password,
      class: cls, department, parentPhoneNumber, paymentStatus,
    } = req.body;

    if (firstName         !== undefined) student.firstName         = firstName;
    if (lastName          !== undefined) student.lastName          = lastName;
    if (parentPhoneNumber !== undefined) student.parentPhoneNumber = parentPhoneNumber;

    if (email !== undefined) {
      /* Per-school uniqueness */
      const existing = await User.findOne({
        email,
        schoolId : req.schoolId,
        _id      : { $ne: req.params.id },
      }).select('_id');
      if (existing) return res.status(400).json({ message: 'Email already in use in this school.' });
      student.email = email;
    }

    if (username !== undefined) {
      const existing = await User.findOne({
        username,
        schoolId : req.schoolId,
        _id      : { $ne: req.params.id },
      }).select('_id');
      if (existing) return res.status(400).json({ message: 'Username already taken in this school.' });
      student.username = username;
    }

    if (password !== undefined) {
      student.password = await bcrypt.hash(password, 10);
    }

    /* Handle class change */
    if (cls !== undefined) {
      student.class = cls;
      const isDeptBased = requiresDepartment(cls);
      if (isDeptBased) {
        if (!department) {
          return res.status(400).json({
            message: `${cls} requires a department (SCIENCE, ART, or COMMERCIAL).`,
          });
        }
        student.department = department;
        student.subjects   = getSubjectsByDepartment(department);
      } else {
        student.department = undefined;
      }
    }

    /* Handle department change (for SSS students) */
    if (department !== undefined && cls === undefined) {
      const isDeptBased = requiresDepartment(student.class);
      if (!isDeptBased) {
        return res.status(400).json({
          message: `${student.class} students cannot have a department.`,
        });
      }
      student.department = department;
      student.subjects   = getSubjectsByDepartment(department);
    }

    /* Update fee / payment status (scoped) */
    if (paymentStatus !== undefined) {
      if (!['unpaid', 'partial', 'paid'].includes(paymentStatus)) {
        return res.status(400).json({
          message: 'Invalid payment status. Use: unpaid, partial, or paid.',
        });
      }
      const fee = await Fee.findOne({
        student  : req.params.id,
        schoolId : req.schoolId,
      });
      if (fee) {
        fee.status = paymentStatus;
        await fee.save();
      }
    }

    await student.save();
    res.json({
      message : 'Student profile updated successfully.',
      student : student.toObject(),
    });
  } catch (err) {
    console.error('[PUT /students/:id/admin-edit]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Legacy update student
   PUT /api/students/:id
   ═══════════════════════════════════════════════════════════ */
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };

    /* NEVER let the client move a student between schools */
    delete updates.schoolId;
    delete updates.schoolName;
    delete updates.role;     // also prevent role escalation

    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true }
    ).select('-password');

    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });
    res.json(student);
  } catch (err) {
    console.error('[PUT /students/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   Delete student and related records in this school
   DELETE /api/students/:id
   ═══════════════════════════════════════════════════════════ */
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const student = await User.findOneAndDelete({
      _id      : req.params.id,
      schoolId : req.schoolId,
    });
    if (!student) return res.status(404).json({ message: 'Student not found in this school.' });

    /* Cascade delete of school-scoped related data */
    await Promise.all([
      Fee.deleteMany({            student: req.params.id, schoolId: req.schoolId }),
      Result.deleteMany({         student: req.params.id, schoolId: req.schoolId }),
      TestScore.deleteMany({      student: req.params.id, schoolId: req.schoolId }),
      SubjectResult.deleteMany({  student: req.params.id, schoolId: req.schoolId }),
    ]);

    res.json({ message: 'Student and associated records deleted.' });
  } catch (err) {
    console.error('[DELETE /students/:id]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

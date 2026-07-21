// // /* ═══════════════════════════════════════════════════════════
// //    EduPortal — routes/exams.js
// //    ═══════════════════════════════════════════════════════════ */
// // const express = require('express');
// // const router  = express.Router();
// // const Exam    = require('../models/Exam');
// // const auth    = require('../middleware/auth');

// // /* GET — all exams */
// // router.get('/', auth, async (req, res) => {
// //   try {
// //     const exams = await Exam.find().sort({ createdAt: -1 });
// //     res.json(exams);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* GET — single exam by id */
// // router.get('/:id', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findById(req.params.id);
// //     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* POST — create exam (teacher) */
// // router.post('/', auth, async (req, res) => {
// //   try {
// //     const exam = new Exam({
// //       ...req.body,
// //       createdBy     : req.user.username || req.user.id,
// //       createdByName : req.user.name,
// //     });
// //     await exam.save();
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* PUT — update exam status (admin: approve/reject) */
// // router.put('/:id/status', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findByIdAndUpdate(
// //       req.params.id,
// //       { status: req.body.status },
// //       { new: true }
// //     );
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* PUT — update full exam (teacher edits before approval) */
// // router.put('/:id', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findByIdAndUpdate(
// //       req.params.id,
// //       req.body,
// //       { new: true }
// //     );
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* DELETE — remove exam */
// // router.delete('/:id', auth, async (req, res) => {
// //   try {
// //     await Exam.findByIdAndDelete(req.params.id);
// //     res.json({ message: 'Exam deleted.' });
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // module.exports = router;

// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/exams.js
//    All queries scoped to req.schoolId via schoolTenant middleware.
//    ═══════════════════════════════════════════════════════════ */
// const express      = require('express');
// const router       = express.Router();
// const Exam         = require('../models/Exam');
// const auth         = require('../middleware/auth');
// const schoolTenant = require('../middleware/schoolTenant');
// const { requireRole } = require('../middleware/requireRole');

// /* All exam routes require auth + school isolation */
// router.use(auth, schoolTenant);

// /* GET — all exams for this school only */
// router.get('/', async (req, res) => {
//   try {
//     const exams = await Exam.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
//     res.json(exams);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* GET — single exam (must belong to same school) */
// router.get('/:id', async (req, res) => {
//   try {
//     const exam = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* POST — create exam (teacher/admin) — schoolId injected automatically */
// router.post('/', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     const exam = new Exam({
//       ...req.body,
//       schoolId     : req.schoolId,          // always overwrite — never trust client
//       createdBy    : req.user.username || req.user.id,
//       createdByName: req.user.name,
//     });
//     await exam.save();
//     res.status(201).json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — approve/reject exam (admin only) */
// router.put('/:id/status', requireRole('admin'), async (req, res) => {
//   try {
//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       { status: req.body.status },
//       { new: true }
//     );
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — update full exam (teacher edits own exam before approval) */
// router.put('/:id', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     delete req.body.schoolId;    // prevent schoolId hijack
//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       req.body,
//       { new: true }
//     );
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* DELETE — remove exam (admin only) */
// router.delete('/:id', requireRole('admin'), async (req, res) => {
//   try {
//     const exam = await Exam.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json({ message: 'Exam deleted.' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/exams.js
   All queries scoped to req.schoolId via schoolTenant.
   ═══════════════════════════════════════════════════════════ */
// const express      = require('express');
// const router       = express.Router();
// const Exam         = require('../models/Exam');
// const Notification = require('../models/Notification');
// const User         = require('../models/User');
// const auth         = require('../middleware/auth');
// const schoolTenant = require('../middleware/schoolTenant');
// const { requireRole } = require('../middleware/requireRole');

// /* Normalize a class label for comparisons — "  Jss 1 " → "JSS1" */
// function normClass(c) {
//   return String(c || '').toUpperCase().replace(/\s+/g, '').trim();
// }

// /* Strip answer keys and marking guides before sending an exam to a student.
//    Students must never receive the correct-answer index for objective
//    questions, or the teacher's marking guide for theory questions — both
//    are visible in the browser's Network tab otherwise. */
// function sanitizeExamForStudent(exam) {
//   const clean = { ...exam };
//   if (Array.isArray(clean.questions)) {
//     clean.questions = clean.questions.map(q => {
//       const { answer, ...rest } = q;
//       return rest;
//     });
//   }
//   if (Array.isArray(clean.theoryQuestions)) {
//     clean.theoryQuestions = clean.theoryQuestions.map(q => {
//       const { guide, ...rest } = q;
//       return rest;
//     });
//   }
//   return clean;
// }

// /* Apply auth then schoolTenant as separate calls — Express 5 safe */
// router.use(auth);
// router.use(schoolTenant);

// /* GET — list exams for this school.
//    Students get only APPROVED exams for their class; teachers/admins see all. */
// router.get('/', async (req, res) => {
//   try {
//     const base = { schoolId: req.schoolId };

//     if (req.user.role === 'student') {
//       /* Class from JWT first (added at login); fall back to a DB lookup
//          so sessions minted before we added `class` to the token still work. */
//       let myClass = normClass(req.user.class);
//       console.log(`[GET /exams student] rawClass from JWT: "${req.user.class}", normalized: "${myClass}"`);

//       if (!myClass) {
//         const student = await User.findOne(
//           { _id: req.user.id, schoolId: req.schoolId },
//           'class'
//         ).lean();
//         myClass = normClass(student && student.class);
//         console.log(`[GET /exams student] fallback DB class: "${student && student.class}", normalized: "${myClass}"`);
//       }

//       const approvedRaw = await Exam.find({ ...base, status: 'approved' })
//         .sort({ createdAt: -1 })
//         .lean();

//       /* Hide exams past their deadline; exams with no expiresAt are always visible. */
//       const now = new Date();
//       const approved = approvedRaw.filter(e => !e.expiresAt || new Date(e.expiresAt) > now);

//       console.log(`[GET /exams student] found ${approved.length} approved exams for school ${req.schoolId}`);
//       approved.forEach((e, i) => {
//         console.log(`  [${i}] "${e.title}" targetClass="${e.targetClass}" → normalized="${normClass(e.targetClass)}"`);
//       });

//       /* If we genuinely can't determine the class, don't silently hide
//          everything — return all approved exams for the school rather than
//          locking the student out of their dashboard. */
//    if (!myClass) {
//         console.log(`[GET /exams student] class could not be determined, returning all ${approved.length} approved exams as fallback`);
//         return res.json(approved.map(sanitizeExamForStudent));
//       }

//       const visible = approved.filter(e => {
//         const tc = normClass(e.targetClass);
//         const matches = !tc || tc === 'ALL' || tc === myClass;
//         console.log(`  [filter] "${e.title}" tc="${tc}" vs myClass="${myClass}" → ${matches ? 'MATCH' : 'NO MATCH'}`);
//         return matches;
//       });
//       console.log(`[GET /exams student] filtered to ${visible.length} exams matching class`);
//       return res.json(visible.map(sanitizeExamForStudent));
//     }

//     /* Teachers + admins — full school-scoped list */
//     const exams = await Exam.find(base).sort({ createdAt: -1 });
//     res.json(exams);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* GET — single exam (must belong to same school) */
// router.get('/:id', async (req, res) => {
//   try {
//     const exam = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* POST — create exam. schoolId injected server-side, never trusted from client.
//    Also fires an admin notification when a teacher submits — doing this here
//    (rather than asking the client to POST /notifications) avoids the
//    non-admin-cannot-notify-other-users policy on the notifications route. */
// router.post('/', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     /* Strip any client-supplied schoolId — always use the tenant's. */
//     delete req.body.schoolId;

//     const exam = new Exam({
//       ...req.body,
//       schoolId     : req.schoolId,
//       createdBy    : req.user.username || req.user.id,
//       createdByName: req.user.name,
//     });
//     await exam.save();

//     if (req.user.role === 'teacher') {
//       Notification.create({
//         schoolId: req.schoolId,
//         userId  : 'admin',
//         message : `New exam "${exam.title}" submitted by ${req.user.name || req.user.username} for approval.`,
//       }).catch(e => console.error('[POST /exams admin notify]', e.message));
//     }

//     res.status(201).json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — approve/reject (admin only).
//    On approval, fan out notifications to:
//      • the teacher who created the exam
//      • every APPROVED student in the same school whose class matches
//        the exam's targetClass (or everyone in the school if 'All'). */
// router.put('/:id/status', requireRole('admin'), async (req, res) => {
//   try {
//     const status = req.body.status;
//     const reason = String(req.body.reason || '').trim();

//     if (!['pending', 'approved', 'rejected'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status.' });
//     }
//     if (status === 'rejected' && !reason) {
//       return res.status(400).json({ message: 'Please provide a reason for rejecting this exam.' });
//     }

//     const prev = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
//     if (!prev) return res.status(404).json({ message: 'Exam not found' });

//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       { status, rejectionReason: status === 'rejected' ? reason : '' },
//       { new: true }
//     );

//     const becameApproved = prev.status !== 'approved' && exam.status === 'approved';
//     const becameRejected = prev.status !== 'rejected' && exam.status === 'rejected';

//     if (becameApproved) {
//       /* Teacher-facing notification */
//       if (exam.createdBy) {
//         Notification.create({
//           schoolId: req.schoolId,
//           userId  : exam.createdBy,
//           message : `Your exam "${exam.title}" was approved by Admin.`,
//         }).catch(e => console.error('[approve → teacher notify]', e.message));
//       }

//       /* Student fan-out — scoped to this school, approved, matching class */
//       (async () => {
//         try {
//           const tc = normClass(exam.targetClass);
//           const studentQuery = {
//             schoolId      : req.schoolId,
//             role          : 'student',
//             approvalStatus: 'approved',
//             isActive      : true,
//           };
//           const students = await User.find(studentQuery, '_id username class').lean();
//           const recipients = students.filter(s =>
//             tc === 'ALL' || normClass(s.class) === tc
//           );

//           if (recipients.length) {
//             const msg = `New exam available: "${exam.title}" (${exam.subject || ''}) — ${exam.targetClass}.`;
//             const docs = recipients.map(s => ({
//               schoolId: req.schoolId,
//               userId  : String(s._id),
//               message : msg,
//             }));
//             await Notification.insertMany(docs, { ordered: false });
//           }
//         } catch (e) {
//           console.error('[approve → student fan-out]', e.message);
//         }
//       })();
//     }

//     if (becameRejected && exam.createdBy) {
//       Notification.create({
//         schoolId: req.schoolId,
//         userId  : exam.createdBy,
//         message : `Your exam "${exam.title}" was rejected by Admin. Reason: ${exam.rejectionReason}`,
//       }).catch(e => console.error('[reject → teacher notify]', e.message));
//     }

//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — update exam */
// router.put('/:id', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     delete req.body.schoolId;
//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       req.body,
//       { new: true }
//     );
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* DELETE — admin only */
// router.delete('/:id', requireRole('admin'), async (req, res) => {
//   try {
//     const exam = await Exam.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });
//     res.json({ message: 'Exam deleted' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;


// // /* ═══════════════════════════════════════════════════════════
// //    EduPortal — routes/exams.js
// //    ═══════════════════════════════════════════════════════════ */
// // const express = require('express');
// // const router  = express.Router();
// // const Exam    = require('../models/Exam');
// // const auth    = require('../middleware/auth');

// // /* GET — all exams */
// // router.get('/', auth, async (req, res) => {
// //   try {
// //     const exams = await Exam.find().sort({ createdAt: -1 });
// //     res.json(exams);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* GET — single exam by id */
// // router.get('/:id', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findById(req.params.id);
// //     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* POST — create exam (teacher) */
// // router.post('/', auth, async (req, res) => {
// //   try {
// //     const exam = new Exam({
// //       ...req.body,
// //       createdBy     : req.user.username || req.user.id,
// //       createdByName : req.user.name,
// //     });
// //     await exam.save();
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* PUT — update exam status (admin: approve/reject) */
// // router.put('/:id/status', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findByIdAndUpdate(
// //       req.params.id,
// //       { status: req.body.status },
// //       { new: true }
// //     );
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* PUT — update full exam (teacher edits before approval) */
// // router.put('/:id', auth, async (req, res) => {
// //   try {
// //     const exam = await Exam.findByIdAndUpdate(
// //       req.params.id,
// //       req.body,
// //       { new: true }
// //     );
// //     res.json(exam);
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // /* DELETE — remove exam */
// // router.delete('/:id', auth, async (req, res) => {
// //   try {
// //     await Exam.findByIdAndDelete(req.params.id);
// //     res.json({ message: 'Exam deleted.' });
// //   } catch (err) { res.status(500).json({ message: err.message }); }
// // });

// // module.exports = router;

// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/exams.js
//    All queries scoped to req.schoolId via schoolTenant middleware.
//    ═══════════════════════════════════════════════════════════ */
// const express      = require('express');
// const router       = express.Router();
// const Exam         = require('../models/Exam');
// const auth         = require('../middleware/auth');
// const schoolTenant = require('../middleware/schoolTenant');
// const { requireRole } = require('../middleware/requireRole');

// /* All exam routes require auth + school isolation */
// router.use(auth, schoolTenant);

// /* GET — all exams for this school only */
// router.get('/', async (req, res) => {
//   try {
//     const exams = await Exam.find({ schoolId: req.schoolId }).sort({ createdAt: -1 });
//     res.json(exams);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* GET — single exam (must belong to same school) */
// router.get('/:id', async (req, res) => {
//   try {
//     const exam = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* POST — create exam (teacher/admin) — schoolId injected automatically */
// router.post('/', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     const exam = new Exam({
//       ...req.body,
//       schoolId     : req.schoolId,          // always overwrite — never trust client
//       createdBy    : req.user.username || req.user.id,
//       createdByName: req.user.name,
//     });
//     await exam.save();
//     res.status(201).json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — approve/reject exam (admin only) */
// router.put('/:id/status', requireRole('admin'), async (req, res) => {
//   try {
//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       { status: req.body.status },
//       { new: true }
//     );
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — update full exam (teacher edits own exam before approval) */
// router.put('/:id', requireRole(['teacher', 'admin']), async (req, res) => {
//   try {
//     delete req.body.schoolId;    // prevent schoolId hijack
//     const exam = await Exam.findOneAndUpdate(
//       { _id: req.params.id, schoolId: req.schoolId },
//       req.body,
//       { new: true }
//     );
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json(exam);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* DELETE — remove exam (admin only) */
// router.delete('/:id', requireRole('admin'), async (req, res) => {
//   try {
//     const exam = await Exam.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
//     if (!exam) return res.status(404).json({ message: 'Exam not found.' });
//     res.json({ message: 'Exam deleted.' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/exams.js
   All queries scoped to req.schoolId via schoolTenant.
   ═══════════════════════════════════════════════════════════ */
const express      = require('express');
const router       = express.Router();
const Exam         = require('../models/Exam');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const Result       = require('../models/Result');
const auth         = require('../middleware/auth');
const schoolTenant = require('../middleware/schoolTenant');
const { requireRole } = require('../middleware/requireRole');

/* Normalize a class label for comparisons — "  Jss 1 " → "JSS1" */
function normClass(c) {
  return String(c || '').toUpperCase().replace(/\s+/g, '').trim();
}

/* Strip answer keys and marking guides before sending an exam to a student.
   Students must never receive the correct-answer index for objective
   questions, or the teacher's marking guide for theory questions — both
   are visible in the browser's Network tab otherwise. */
function sanitizeExamForStudent(exam) {
  const clean = { ...exam };
  if (Array.isArray(clean.questions)) {
    clean.questions = clean.questions.map(q => {
      const { answer, ...rest } = q;
      return rest;
    });
  }
  if (Array.isArray(clean.theoryQuestions)) {
    clean.theoryQuestions = clean.theoryQuestions.map(q => {
      const { guide, ...rest } = q;
      return rest;
    });
  }
  return clean;
}

/* Apply auth then schoolTenant as separate calls — Express 5 safe */
router.use(auth);
router.use(schoolTenant);

/* GET — list exams for this school.
   Students get only APPROVED exams for their class; teachers/admins see all. */
router.get('/', async (req, res) => {
  try {
    const base = { schoolId: req.schoolId };

    if (req.user.role === 'student') {
      /* Class from JWT first (added at login); fall back to a DB lookup
         so sessions minted before we added `class` to the token still work. */
      let myClass = normClass(req.user.class);
      console.log(`[GET /exams student] rawClass from JWT: "${req.user.class}", normalized: "${myClass}"`);

      if (!myClass) {
        const student = await User.findOne(
          { _id: req.user.id, schoolId: req.schoolId },
          'class'
        ).lean();
        myClass = normClass(student && student.class);
        console.log(`[GET /exams student] fallback DB class: "${student && student.class}", normalized: "${myClass}"`);
      }

      const approvedRaw = await Exam.find({ ...base, status: 'approved' })
        .sort({ createdAt: -1 })
        .lean();

      /* Hide exams past their deadline; exams with no expiresAt are always visible. */
      const now = new Date();
      const approved = approvedRaw.filter(e => !e.expiresAt || new Date(e.expiresAt) > now);

      console.log(`[GET /exams student] found ${approved.length} approved exams for school ${req.schoolId}`);
      approved.forEach((e, i) => {
        console.log(`  [${i}] "${e.title}" targetClass="${e.targetClass}" → normalized="${normClass(e.targetClass)}"`);
      });

      /* If we genuinely can't determine the class, don't silently hide
         everything — return all approved exams for the school rather than
         locking the student out of their dashboard. */
   if (!myClass) {
        console.log(`[GET /exams student] class could not be determined, returning all ${approved.length} approved exams as fallback`);
        return res.json(approved.map(sanitizeExamForStudent));
      }

      const visible = approved.filter(e => {
        const tc = normClass(e.targetClass);
        const matches = !tc || tc === 'ALL' || tc === myClass;
        console.log(`  [filter] "${e.title}" tc="${tc}" vs myClass="${myClass}" → ${matches ? 'MATCH' : 'NO MATCH'}`);
        return matches;
      });
      console.log(`[GET /exams student] filtered to ${visible.length} exams matching class`);
      return res.json(visible.map(sanitizeExamForStudent));
    }

    /* Teachers + admins — full school-scoped list */
    const exams = await Exam.find(base).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET — single exam (must belong to same school).
   Teacher/admin only — unlike the list route, this returns the FULL exam
   including answer keys and marking guides, which must never reach a
   student's browser. */
router.get('/:id', requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST — create exam. schoolId injected server-side, never trusted from client.
   Also fires an admin notification when a teacher submits — doing this here
   (rather than asking the client to POST /notifications) avoids the
   non-admin-cannot-notify-other-users policy on the notifications route. */
router.post('/', requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    /* Strip any client-supplied schoolId — always use the tenant's. */
    delete req.body.schoolId;

    const exam = new Exam({
      ...req.body,
      schoolId     : req.schoolId,
      createdBy    : req.user.username || req.user.id,
      createdByName: req.user.name,
    });
    await exam.save();

    if (req.user.role === 'teacher') {
      Notification.create({
        schoolId: req.schoolId,
        userId  : 'admin',
        message : `New exam "${exam.title}" submitted by ${req.user.name || req.user.username} for approval.`,
      }).catch(e => console.error('[POST /exams admin notify]', e.message));
    }

    res.status(201).json(exam);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PUT — approve/reject (admin only).
   On approval, fan out notifications to:
     • the teacher who created the exam
     • every APPROVED student in the same school whose class matches
       the exam's targetClass (or everyone in the school if 'All'). */
router.put('/:id/status', requireRole('admin'), async (req, res) => {
  try {
    const status = req.body.status;
    const reason = String(req.body.reason || '').trim();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    if (status === 'rejected' && !reason) {
      return res.status(400).json({ message: 'Please provide a reason for rejecting this exam.' });
    }

    const prev = await Exam.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!prev) return res.status(404).json({ message: 'Exam not found' });

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { status, rejectionReason: status === 'rejected' ? reason : '' },
      { new: true }
    );

    const becameApproved = prev.status !== 'approved' && exam.status === 'approved';
    const becameRejected = prev.status !== 'rejected' && exam.status === 'rejected';

    if (becameApproved) {
      /* Teacher-facing notification */
      if (exam.createdBy) {
        Notification.create({
          schoolId: req.schoolId,
          userId  : exam.createdBy,
          message : `Your exam "${exam.title}" was approved by Admin.`,
        }).catch(e => console.error('[approve → teacher notify]', e.message));
      }

      /* Student fan-out — scoped to this school, approved, matching class */
      (async () => {
        try {
          const tc = normClass(exam.targetClass);
          const studentQuery = {
            schoolId      : req.schoolId,
            role          : 'student',
            approvalStatus: 'approved',
            isActive      : true,
          };
          const students = await User.find(studentQuery, '_id username class').lean();
          const recipients = students.filter(s =>
            tc === 'ALL' || normClass(s.class) === tc
          );

          if (recipients.length) {
            const msg = `New exam available: "${exam.title}" (${exam.subject || ''}) — ${exam.targetClass}.`;
            const docs = recipients.map(s => ({
              schoolId: req.schoolId,
              userId  : String(s._id),
              message : msg,
            }));
            await Notification.insertMany(docs, { ordered: false });
          }
        } catch (e) {
          console.error('[approve → student fan-out]', e.message);
        }
      })();
    }

    if (becameRejected && exam.createdBy) {
      Notification.create({
        schoolId: req.schoolId,
        userId  : exam.createdBy,
        message : `Your exam "${exam.title}" was rejected by Admin. Reason: ${exam.rejectionReason}`,
      }).catch(e => console.error('[reject → teacher notify]', e.message));
    }

    res.json(exam);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PUT — update exam.
   Grading is done server-side by matching a student's submitted answers
   against the exam's CURRENT questions by array position (see
   routes/results.js). Editing an exam's questions after students have
   already submitted for it would silently regrade — or misgrade —
   their answers against different content than what they actually saw.
   So once any Result exists for this exam, direct edits are blocked;
   the client should offer to duplicate it as a new exam instead. */
router.put('/:id', requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    delete req.body.schoolId;
    delete req.body.status;           // status transitions are decided server-side only, never trusted from the client
    delete req.body.rejectionReason;  // same — only this route's own logic below may set it

    const [submissionCount, currentExam] = await Promise.all([
      Result.countDocuments({ exam: req.params.id, schoolId: req.schoolId }),
      Exam.findOne({ _id: req.params.id, schoolId: req.schoolId }, 'status title createdBy createdByName').lean()
    ]);
    if (!currentExam) return res.status(404).json({ message: 'Exam not found' });

    if (submissionCount > 0) {
      return res.status(409).json({
        message: submissionCount + (submissionCount === 1 ? ' student has' : ' students have')
          + ' already submitted this exam. Editing it directly could create grading inconsistencies for them — duplicate it as a new exam instead.',
        submissionCount
      });
    }

    /* A rejected exam that gets fixed should re-enter the approval queue
       rather than sitting invisible as "rejected" forever. */
    const isResubmission = currentExam.status === 'rejected';
    if (isResubmission) {
      req.body.status = 'pending';
      req.body.rejectionReason = '';
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      req.body,
      { new: true }
    );
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (isResubmission) {
      Notification.create({
        schoolId: req.schoolId,
        userId  : 'admin',
        message : `Exam "${exam.title}" was corrected and resubmitted for approval by ${exam.createdByName || exam.createdBy || 'a teacher'}.`,
      }).catch(e => console.error('[resubmit → admin notify]', e.message));
    }

    res.json(exam);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE — admin only */
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
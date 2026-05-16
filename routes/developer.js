// // /* ═══════════════════════════════════════════════════════════
// //    EduPortal — routes/developer.js
   
// //    Developer/Super-Admin routes for managing multiple schools.
// //    ═══════════════════════════════════════════════════════════ */
// // console.log('\n🟣 [DEVELOPER.JS] Loading developer routes...');
// // const express = require('express');
// // const mongoose = require('mongoose');
// // const bcryptjs = require('bcryptjs');

// // const router = express.Router();
// // console.log('🟣 [DEVELOPER.JS] Router created');

// // // Import models directly (not via mongoose.model)
// // const School = require('../models/School');
// // const User = require('../models/User');
// // const Exam = require('../models/Exam');
// // const Fee = require('../models/Fee');
// // console.log('🟣 [DEVELOPER.JS] All models imported successfully');

// // /* ── Middleware to verify developer key ──────────────────── */
// // const verifyDevKey = (req, res, next) => {
// //     console.log('🔴 [MIDDLEWARE] verifyDevKey called');
// //     console.log('🔴 [MIDDLEWARE] next type:', typeof next);
// //     const key = (req.headers['x-developer-key'] || '').trim();
// //     const expected = (process.env.DEVELOPER_KEY || '').trim();

// //     if (key === expected && expected) {
// //         console.log('🟢 [MIDDLEWARE] Key matches, calling next()');
// //         return next();
// //     }
// //     console.log('🟡 [MIDDLEWARE] Key does not match');
// //     res.status(403).json({ error: 'Invalid developer key' });
// // };

// // /* POST /api/developer/test ──────────────────────────────── */
// // router.post('/test', verifyDevKey, (req, res) => {
// //     res.json({ message: 'Test endpoint works' });
// // });

// // /* POST /api/developer/school/register ──────────────────── */
// // router.post('/school/register', verifyDevKey, async (req, res) => {
// //     console.log('\n🔵 [DEV-ROUTE] School register endpoint called at:', new Date().toISOString());
// //     try {
// //         console.log('[DEV-ROUTE] Inside try block');
// //         const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;
// //         console.log('[DEV-ROUTE] Destructured params, checking validation');

// //         if (!name || !email || !phone || !address || !city || !principalName || !adminUsername || !adminPassword) {
// //             console.log('[DEV-ROUTE] Validation failed');
// //             return res.status(400).json({ error: 'All fields are required' });
// //         }

// //         console.log('[DEV-ROUTE] Passed validation, creating salt');
// //         const salt = await bcryptjs.genSalt(10);
// //         console.log('[DEV-ROUTE] Salt generated:', salt ? 'OK' : 'FAIL');

// //         console.log('[DEV-ROUTE] Hashing password');
// //         const hashedPwd = await bcryptjs.hash(adminPassword, salt);
// //         console.log('[DEV-ROUTE] Password hashed:', hashedPwd.length, 'chars');

// //         console.log('[DEV-ROUTE] Creating School instance');
// //         const school = new School({
// //             name,
// //             email,
// //             phone,
// //             address,
// //             city,
// //             principalName,
// //             adminUsername,
// //             adminPassword: hashedPwd
// //         });
// //         console.log('[DEV-ROUTE] School instance created');

// //         console.log('[DEV-ROUTE] About to call school.save()');
// //         await school.save();
// //         console.log('[DEV-ROUTE] School saved successfully');

// //         res.status(201).json({
// //             message: 'School registered successfully',
// //             school: { id: school._id, name, email, adminUsername }
// //         });
// //     } catch (err) {
// //         console.error('\n🔴 [DEV-ROUTE] ERROR caught:');
// //         console.error('Message:', err.message);
// //         console.error('Stack:', err.stack);
// //         res.status(500).json({ error: 'Server error: ' + err.message });
// //     }
// // });

// // /* GET /api/developer/schools ──────────────────────────── */
// // router.get('/schools', verifyDevKey, async (req, res) => {
// //     try {
// //         const schools = await School.find({ isActive: true }).select('-adminPassword');

// //         // Enrich each school with stats
// //         const enrichedSchools = await Promise.all(schools.map(async (school) => {
// //             const students = await User.countDocuments({ schoolId: school._id, role: 'student' });
// //             const teachers = await User.countDocuments({ schoolId: school._id, role: 'teacher' });
// //             const exams = await Exam.countDocuments({ schoolId: school._id });
// //             const fees = await Fee.countDocuments({ schoolId: school._id });

// //             return {
// //                 ...school.toObject(),
// //                 students,
// //                 teachers,
// //                 exams,
// //                 fees
// //             };
// //         }));

// //         res.json({ schools: enrichedSchools });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // /* GET /api/developer/school/:schoolId ─────────────────── */
// // router.get('/school/:schoolId', verifyDevKey, async (req, res) => {
// //     try {
// //         const school = await School.findById(req.params.schoolId).select('-adminPassword');
// //         if (!school) return res.status(404).json({ error: 'School not found' });

// //         // Get school stats
// //         const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
// //         const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });
// //         const examCount = await Exam.countDocuments({ schoolId: school._id });
// //         const feeCount = await Fee.countDocuments({ schoolId: school._id });

// //         res.json({
// //             school: school.toObject(),
// //             studentCount,
// //             teacherCount,
// //             examCount,
// //             feeCount
// //         });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // /* PUT /api/developer/school/:schoolId ──────────────────── */
// // router.put('/school/:schoolId', verifyDevKey, async (req, res) => {
// //     try {
// //         const school = await School.findByIdAndUpdate(req.params.schoolId, req.body, { new: true }).select('-adminPassword');
// //         if (!school) return res.status(404).json({ error: 'School not found' });
// //         res.json(school);
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // /* DELETE /api/developer/school/:schoolId ──────────────── */
// // router.delete('/school/:schoolId', verifyDevKey, async (req, res) => {
// //     try {
// //         const school = await School.findByIdAndUpdate(req.params.schoolId, { isActive: false });
// //         if (!school) return res.status(404).json({ error: 'School not found' });
// //         res.json({ message: 'School deactivated' });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // /* GET /api/developer/stats/overview ────────────────────── */
// // router.get('/stats/overview', verifyDevKey, async (req, res) => {
// //     try {
// //         const totalSchools = await School.countDocuments({ isActive: true });
// //         const totalStudents = await User.countDocuments({ role: 'student' });
// //         const totalTeachers = await User.countDocuments({ role: 'teacher' });
// //         const totalExams = await Exam.countDocuments();
// //         const totalFees = await Fee.countDocuments();

// //         res.json({ totalSchools, totalStudents, totalTeachers, totalExams, totalFees });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // /* GET /api/developer/stats/school/:schoolId ────────────── */
// // router.get('/stats/school/:schoolId', verifyDevKey, async (req, res) => {
// //     try {
// //         const schoolId = new mongoose.Types.ObjectId(req.params.schoolId);
// //         const students = await User.countDocuments({ schoolId, role: 'student' });
// //         const teachers = await User.countDocuments({ schoolId, role: 'teacher' });
// //         const exams = await Exam.countDocuments({ schoolId });
// //         const fees = await Fee.countDocuments({ schoolId });

// //         res.json({ schoolId, students, teachers, exams, fees });
// //     } catch (err) {
// //         res.status(500).json({ error: err.message });
// //     }
// // });

// // console.log('🟣 [DEVELOPER.JS] All routes registered, exporting router');
// // module.exports = router;


// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/developer.js

//    Developer / Super-Admin routes.
//    Protected by DEVELOPER_KEY header — no JWT needed here.

//    What developers can do:
//      • Register new schools (each gets a unique schoolId + slug)
//      • Assign a custom UI theme to each school
//      • View all schools + per-school stats
//      • Suspend / reactivate a school
//      • Reset a school admin's password
//      • Full global analytics across all schools
//    ═══════════════════════════════════════════════════════════ */

// const express  = require('express');
// const mongoose = require('mongoose');
// const bcryptjs = require('bcryptjs');
// const router   = express.Router();

// const School = require('../models/School');
// const User   = require('../models/User');
// const Exam   = require('../models/Exam');
// const Fee    = require('../models/Fee');
// const schoolTenant = require('../middleware/schoolTenant');

// /* ── Developer key guard ─────────────────────────────────── */
// const verifyDevKey = (req, res, next) => {
//   const key      = (req.headers['x-developer-key'] || '').trim();
//   const expected = (process.env.DEVELOPER_KEY || '').trim();
//   if (!expected) {
//     return res.status(500).json({ error: 'DEVELOPER_KEY not set in environment.' });
//   }
//   if (key !== expected) {
//     return res.status(403).json({ error: 'Invalid developer key.' });
//   }
//   next();
// };

// /* ── Preset themes developers can choose from ────────────── */
// const PRESET_THEMES = {
//   ocean: {
//     primaryColor: '#0077b6', secondaryColor: '#caf0f8',
//     accentColor: '#00b4d8', textColor: '#03045e', fontFamily: 'Poppins, sans-serif',
//     borderRadius: '10px', darkMode: false,
//   },
//   forest: {
//     primaryColor: '#2d6a4f', secondaryColor: '#d8f3dc',
//     accentColor: '#52b788', textColor: '#1b4332', fontFamily: 'Nunito, sans-serif',
//     borderRadius: '8px', darkMode: false,
//   },
//   royal: {
//     primaryColor: '#5a189a', secondaryColor: '#f3e9ff',
//     accentColor: '#ff9f1c', textColor: '#240046', fontFamily: 'Raleway, sans-serif',
//     borderRadius: '12px', darkMode: false,
//   },
//   midnight: {
//     primaryColor: '#4361ee', secondaryColor: '#1a1a2e',
//     accentColor: '#f72585', textColor: '#e0e0e0', fontFamily: 'Inter, sans-serif',
//     borderRadius: '8px', darkMode: true,
//   },
//   sunset: {
//     primaryColor: '#e63946', secondaryColor: '#fff1f0',
//     accentColor: '#f4a261', textColor: '#1d1d1d', fontFamily: 'Montserrat, sans-serif',
//     borderRadius: '6px', darkMode: false,
//   },
//   slate: {
//     primaryColor: '#1a73e8', secondaryColor: '#f0f4ff',
//     accentColor: '#fbbc04', textColor: '#202124', fontFamily: 'Inter, sans-serif',
//     borderRadius: '8px', darkMode: false,
//   },
// };

// /* ─────────────────────────────────────────────────────────── *
//    POST /api/developer/school/register
//    Register a brand-new school.

//    Body:
//    {
//      name, email, phone, address, city, principalName,
//      adminUsername, adminPassword,
//      slug?,           // auto-generated from name if omitted
//      theme?,          // preset name OR custom object
//      plan?,           // free | basic | premium | enterprise
//      maxStudents?,
//      maxTeachers?
//    }
//  * ─────────────────────────────────────────────────────────── */
// router.post('/school/register', verifyDevKey, async (req, res) => {
//   try {
//     const {
//       name, email, phone, address, city, principalName,
//       adminUsername, adminPassword, slug,
//       theme, plan, maxStudents, maxTeachers, logoUrl,
//     } = req.body;

//     /* Validation */
//     if (!name || !email || !adminUsername || !adminPassword) {
//       return res.status(400).json({
//         error: 'name, email, adminUsername, and adminPassword are required.',
//       });
//     }

//     /* Duplicate checks */
//     const existing = await School.findOne({
//       $or: [{ adminUsername }, { email }],
//     });
//     if (existing) {
//       const field = existing.adminUsername === adminUsername ? 'adminUsername' : 'email';
//       return res.status(409).json({ error: `A school with this ${field} already exists.` });
//     }

//     /* Resolve theme */
//     let resolvedTheme = {};
//     if (typeof theme === 'string' && PRESET_THEMES[theme]) {
//       resolvedTheme = PRESET_THEMES[theme];
//     } else if (theme && typeof theme === 'object') {
//       resolvedTheme = theme;
//     }

//     /* Create school — password hashing is handled by the pre-save hook */
//     const school = new School({
//       name, email,
//       phone        : phone || '',
//       address      : address || '',
//       city         : city || '',
//       principalName: principalName || '',
//       adminUsername,
//       adminPassword,               // hashed by pre-save hook
//       slug         : slug || undefined,  // auto-generated if absent
//       theme        : resolvedTheme,
//       plan         : plan || 'free',
//       maxStudents  : maxStudents || 500,
//       maxTeachers  : maxTeachers || 50,
//       logoUrl      : logoUrl || '',
//     });

//     await school.save();

//     res.status(201).json({
//       message: 'School registered successfully.',
//       school: {
//         id           : school._id,
//         name         : school.name,
//         slug         : school.slug,
//         email        : school.email,
//         adminUsername: school.adminUsername,
//         theme        : school.theme,
//         plan         : school.plan,
//         loginUrl     : `/login/${school.slug}`,   // frontend route hint
//       },
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern || {})[0] || 'field';
//       return res.status(409).json({ error: `Duplicate value for ${field}.` });
//     }
//     console.error('[DEV register]', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/themes/presets
//    Return the list of built-in theme presets.
//  * ─────────────────────────────────────────────────────────── */
// router.get('/themes/presets', verifyDevKey, (req, res) => {
//   res.json({ presets: Object.keys(PRESET_THEMES), themes: PRESET_THEMES });
// });

// /* ─────────────────────────────────────────────────────────── *
//    PUT /api/developer/school/:schoolId/theme
//    Update a school's UI theme (preset name or custom object).

//    Body: { preset: 'ocean' }  OR  { theme: { primaryColor, … } }
//  * ─────────────────────────────────────────────────────────── */
// router.put('/school/:schoolId/theme', verifyDevKey, async (req, res) => {
//   try {
//     const { preset, theme } = req.body;
//     let newTheme;

//     if (preset && PRESET_THEMES[preset]) {
//       newTheme = PRESET_THEMES[preset];
//     } else if (theme && typeof theme === 'object') {
//       newTheme = theme;
//     } else {
//       return res.status(400).json({
//         error: `Provide a preset (${Object.keys(PRESET_THEMES).join(', ')}) or a theme object.`,
//       });
//     }

//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { theme: newTheme },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found.' });

//     // Invalidate tenant cache so next request picks up the new theme
//     schoolTenant.invalidateCache(school._id);

//     res.json({ message: 'Theme updated.', theme: school.theme });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/schools
//    List all schools with live stats.
//  * ─────────────────────────────────────────────────────────── */
// router.get('/schools', verifyDevKey, async (req, res) => {
//   try {
//     const { plan, isActive, page = 1, limit = 50 } = req.query;
//     const filter = {};
//     if (plan) filter.plan = plan;
//     if (isActive !== undefined) filter.isActive = isActive === 'true';

//     const schools = await School.find(filter)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     const total = await School.countDocuments(filter);

//     const enriched = await Promise.all(schools.map(async (s) => {
//       const [students, teachers, exams, fees] = await Promise.all([
//         User.countDocuments({ schoolId: s._id, role: 'student' }),
//         User.countDocuments({ schoolId: s._id, role: 'teacher' }),
//         Exam.countDocuments({ schoolId: s._id }),
//         Fee.countDocuments({ schoolId: s._id }),
//       ]);
//       return { ...s, adminPassword: undefined, stats: { students, teachers, exams, fees } };
//     }));

//     res.json({ total, page: Number(page), schools: enriched });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/school/:schoolId
//    Full detail for one school.
//  * ─────────────────────────────────────────────────────────── */
// router.get('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findById(req.params.schoolId).lean();
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     delete school.adminPassword;

//     const [students, teachers, exams, fees] = await Promise.all([
//       User.countDocuments({ schoolId: school._id, role: 'student' }),
//       User.countDocuments({ schoolId: school._id, role: 'teacher' }),
//       Exam.countDocuments({ schoolId: school._id }),
//       Fee.countDocuments({ schoolId: school._id }),
//     ]);

//     res.json({ school, stats: { students, teachers, exams, fees } });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/school/by-slug/:slug
//    Look up a school by its slug (used by frontend login page).
//    Returns theme + name so the login page can style itself
//    BEFORE the user has a JWT.
//    This route is PUBLIC — no dev key needed.
//  * ─────────────────────────────────────────────────────────── */
// router.get('/school/by-slug/:slug', async (req, res) => {
//   try {
//     const school = await School.findOne(
//       { slug: req.params.slug, isActive: true },
//       'name slug city principalName theme logoUrl plan'
//     ).lean();
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     res.json({ school });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    PUT /api/developer/school/:schoolId
//    Update school info (name, email, plan, limits, etc.)
//  * ─────────────────────────────────────────────────────────── */
// router.put('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     /* Prevent changing adminPassword via this route — use reset endpoint */
//     delete req.body.adminPassword;
//     const school = await School.findByIdAndUpdate(req.params.schoolId, req.body, { new: true });
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     schoolTenant.invalidateCache(school._id);
//     res.json({ message: 'School updated.', school });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    POST /api/developer/school/:schoolId/reset-password
//    Reset a school admin's password.
//    Body: { newPassword }
//  * ─────────────────────────────────────────────────────────── */
// router.post('/school/:schoolId/reset-password', verifyDevKey, async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     if (!newPassword || newPassword.length < 6) {
//       return res.status(400).json({ error: 'newPassword must be at least 6 characters.' });
//     }
//     const salt = await bcryptjs.genSalt(10);
//     const hashed = await bcryptjs.hash(newPassword, salt);

//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { adminPassword: hashed },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     res.json({ message: 'Admin password reset successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    POST /api/developer/school/:schoolId/suspend
//    Suspend a school (sets isActive = false).
//    Body: { reason? }
//  * ─────────────────────────────────────────────────────────── */
// router.post('/school/:schoolId/suspend', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { isActive: false, suspendedAt: new Date(), suspendedBy: 'developer' },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     schoolTenant.invalidateCache(school._id);
//     res.json({ message: `School "${school.name}" suspended.` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    POST /api/developer/school/:schoolId/reactivate
//  * ─────────────────────────────────────────────────────────── */
// router.post('/school/:schoolId/reactivate', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { isActive: true, suspendedAt: null, suspendedBy: null },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     schoolTenant.invalidateCache(school._id);
//     res.json({ message: `School "${school.name}" reactivated.` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    DELETE /api/developer/school/:schoolId
//    Permanently delete a school and ALL its data.
//    ⚠️  DESTRUCTIVE — requires confirmation token in body.
//    Body: { confirm: 'DELETE_SCHOOL_<schoolId>' }
//  * ─────────────────────────────────────────────────────────── */
// router.delete('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     const { confirm } = req.body;
//     const expected = `DELETE_SCHOOL_${req.params.schoolId}`;
//     if (confirm !== expected) {
//       return res.status(400).json({
//         error: `To permanently delete, send { "confirm": "${expected}" } in the request body.`,
//       });
//     }

//     const school = await School.findById(req.params.schoolId);
//     if (!school) return res.status(404).json({ error: 'School not found.' });

//     const sid = school._id;

//     /* Delete all school-scoped data */
//     const [u, ex, fe] = await Promise.all([
//       User.deleteMany({ schoolId: sid }),
//       Exam.deleteMany({ schoolId: sid }),
//       Fee.deleteMany({ schoolId: sid }),
//     ]);

//     await school.deleteOne();
//     schoolTenant.invalidateCache(sid);

//     res.json({
//       message: `School "${school.name}" and all its data permanently deleted.`,
//       deleted: { users: u.deletedCount, exams: ex.deletedCount, fees: fe.deletedCount },
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/stats/overview
//    Global numbers across ALL schools.
//  * ─────────────────────────────────────────────────────────── */
// router.get('/stats/overview', verifyDevKey, async (req, res) => {
//   try {
//     const [
//       totalSchools, activeSchools,
//       totalStudents, totalTeachers,
//       totalExams, totalFees,
//     ] = await Promise.all([
//       School.countDocuments(),
//       School.countDocuments({ isActive: true }),
//       User.countDocuments({ role: 'student' }),
//       User.countDocuments({ role: 'teacher' }),
//       Exam.countDocuments(),
//       Fee.countDocuments(),
//     ]);

//     const planBreakdown = await School.aggregate([
//       { $group: { _id: '$plan', count: { $sum: 1 } } },
//     ]);

//     res.json({
//       totalSchools, activeSchools,
//       suspendedSchools: totalSchools - activeSchools,
//       totalStudents, totalTeachers,
//       totalExams, totalFees,
//       planBreakdown,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ─────────────────────────────────────────────────────────── *
//    GET /api/developer/test
//  * ─────────────────────────────────────────────────────────── */
// router.get('/test', verifyDevKey, (req, res) => {
//   res.json({ message: 'Developer API is working.', timestamp: new Date() });
// });

// module.exports = router;

// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/developer.js
//    Developer / Super-Admin routes. Protected by x-developer-key.
//    ═══════════════════════════════════════════════════════════ */
// const express  = require('express');
// const mongoose = require('mongoose');
// const bcryptjs = require('bcryptjs');
// const router   = express.Router();

// const School        = require('../models/School');
// const User          = require('../models/User');
// const Exam          = require('../models/Exam');
// const Fee           = require('../models/Fee');
// const Result        = require('../models/Result');
// const Notification  = require('../models/Notification');
// const TestScore     = require('../models/TestScore');
// const SubjectResult = require('../models/SubjectResult');

// /* ── Developer key guard ─────────────────────────────────── */
// const verifyDevKey = (req, res, next) => {
//   const key      = (req.headers['x-developer-key'] || '').trim();
//   const expected = (process.env.DEVELOPER_KEY || '').trim();
//   if (!expected) {
//     return res.status(500).json({ error: 'DEVELOPER_KEY not configured in .env' });
//   }
//   if (key !== expected) {
//     return res.status(403).json({ error: 'Invalid developer key' });
//   }
//   next();
// };

// /* ── Built-in theme presets ──────────────────────────────── */
// const PRESET_THEMES = {
//   slate: {
//     primaryColor: '#1a73e8', secondaryColor: '#f0f4ff',
//     accentColor: '#fbbc04', textColor: '#202124',
//     fontFamily: 'Inter, sans-serif', borderRadius: '8px', darkMode: false,
//   },
//   ocean: {
//     primaryColor: '#0077b6', secondaryColor: '#caf0f8',
//     accentColor: '#00b4d8', textColor: '#03045e',
//     fontFamily: 'Poppins, sans-serif', borderRadius: '10px', darkMode: false,
//   },
//   forest: {
//     primaryColor: '#2d6a4f', secondaryColor: '#d8f3dc',
//     accentColor: '#52b788', textColor: '#1b4332',
//     fontFamily: 'Nunito, sans-serif', borderRadius: '8px', darkMode: false,
//   },
//   royal: {
//     primaryColor: '#5a189a', secondaryColor: '#f3e9ff',
//     accentColor: '#ff9f1c', textColor: '#240046',
//     fontFamily: 'Raleway, sans-serif', borderRadius: '12px', darkMode: false,
//   },
//   midnight: {
//     primaryColor: '#4361ee', secondaryColor: '#1a1a2e',
//     accentColor: '#f72585', textColor: '#e0e0e0',
//     fontFamily: 'Inter, sans-serif', borderRadius: '8px', darkMode: true,
//   },
//   sunset: {
//     primaryColor: '#e63946', secondaryColor: '#fff1f0',
//     accentColor: '#f4a261', textColor: '#1d1d1d',
//     fontFamily: 'Montserrat, sans-serif', borderRadius: '6px', darkMode: false,
//   },
// };

// /* ══════════════════════════════════════════════════════════
//    PUBLIC — no dev key needed
//    GET /api/developer/school/by-slug/:slug
//    MUST be defined BEFORE /school/:schoolId to avoid conflict
//    ══════════════════════════════════════════════════════════ */
// router.get('/school/by-slug/:slug', async (req, res) => {
//   try {
//     const school = await School.findOne(
//       { slug: req.params.slug, isActive: true },
//       'name slug city principalName theme logoUrl plan'
//     ).lean();
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ school });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    POST /api/developer/school/register
//    ══════════════════════════════════════════════════════════ */
// router.post('/school/register', verifyDevKey, async (req, res) => {
//   try {
//     const {
//       name, email, phone, address, city, principalName,
//       adminUsername, adminPassword, slug,
//       theme, plan, maxStudents, maxTeachers, logoUrl,
//     } = req.body;

//     if (!name || !email || !adminUsername || !adminPassword) {
//       return res.status(400).json({
//         error: 'name, email, adminUsername, and adminPassword are required',
//       });
//     }

//     const conflict = await School.findOne({
//       $or: [{ adminUsername }, { email: email.toLowerCase() }],
//     });
//     if (conflict) {
//       const field = conflict.adminUsername === adminUsername ? 'adminUsername' : 'email';
//       return res.status(409).json({ error: `A school with this ${field} already exists` });
//     }

//     let resolvedTheme = {};
//     if (typeof theme === 'string' && PRESET_THEMES[theme]) {
//       resolvedTheme = PRESET_THEMES[theme];
//     } else if (theme && typeof theme === 'object') {
//       resolvedTheme = theme;
//     }

//     const school = new School({
//       name, email,
//       phone         : phone || '',
//       address       : address || '',
//       city          : city || '',
//       principalName : principalName || '',
//       adminUsername,
//       adminPassword,
//       slug          : slug || undefined,
//       theme         : resolvedTheme,
//       plan          : plan || 'free',
//       maxStudents   : maxStudents || 500,
//       maxTeachers   : maxTeachers || 50,
//       logoUrl       : logoUrl || '',
//     });

//     await school.save();

//     res.status(201).json({
//       message: 'School registered successfully',
//       school: {
//         id           : school._id,
//         name         : school.name,
//         slug         : school.slug,
//         email        : school.email,
//         adminUsername: school.adminUsername,
//         theme        : school.theme,
//         plan         : school.plan,
//         loginUrl     : `/login/${school.slug}`,
//       },
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern || {})[0] || 'field';
//       return res.status(409).json({ error: `Duplicate value for "${field}"` });
//     }
//     console.error('[DEV /school/register]', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    GET /api/developer/themes/presets
//    ══════════════════════════════════════════════════════════ */
// router.get('/themes/presets', verifyDevKey, (req, res) => {
//   res.json({ presets: Object.keys(PRESET_THEMES), themes: PRESET_THEMES });
// });

// /* ══════════════════════════════════════════════════════════
//    GET /api/developer/schools
//    ══════════════════════════════════════════════════════════ */
// router.get('/schools', verifyDevKey, async (req, res) => {
//   try {
//     const { plan, isActive, page = 1, limit = 50 } = req.query;
//     const filter = {};
//     if (plan) filter.plan = plan;
//     if (isActive !== undefined) filter.isActive = isActive === 'true';

//     const [schools, total] = await Promise.all([
//       School.find(filter)
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(Number(limit))
//         .lean(),
//       School.countDocuments(filter),
//     ]);

//     const enriched = await Promise.all(schools.map(async (s) => {
//       const [students, teachers, exams, fees] = await Promise.all([
//         User.countDocuments({ schoolId: s._id, role: 'student' }),
//         User.countDocuments({ schoolId: s._id, role: 'teacher' }),
//         Exam.countDocuments({ schoolId: s._id }),
//         Fee.countDocuments({ schoolId: s._id }),
//       ]);
//       const { adminPassword: _, ...safe } = s;
//       return { ...safe, stats: { students, teachers, exams, fees } };
//     }));

//     res.json({ total, page: Number(page), schools: enriched });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    GET /api/developer/school/:schoolId
//    ══════════════════════════════════════════════════════════ */
// router.get('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findById(req.params.schoolId).lean();
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     delete school.adminPassword;

//     const [students, teachers, exams, fees] = await Promise.all([
//       User.countDocuments({ schoolId: school._id, role: 'student' }),
//       User.countDocuments({ schoolId: school._id, role: 'teacher' }),
//       Exam.countDocuments({ schoolId: school._id }),
//       Fee.countDocuments({ schoolId: school._id }),
//     ]);

//     res.json({ school, stats: { students, teachers, exams, fees } });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    PUT /api/developer/school/:schoolId/theme
//    Body: { preset: 'ocean' }  OR  { theme: { primaryColor, ... } }
//    ══════════════════════════════════════════════════════════ */
// router.put('/school/:schoolId/theme', verifyDevKey, async (req, res) => {
//   try {
//     const { preset, theme } = req.body;
//     let newTheme;

//     if (preset && PRESET_THEMES[preset]) {
//       newTheme = PRESET_THEMES[preset];
//     } else if (theme && typeof theme === 'object') {
//       newTheme = theme;
//     } else {
//       return res.status(400).json({
//         error: `Provide { preset } (${Object.keys(PRESET_THEMES).join(', ')}) or a { theme } object`,
//       });
//     }

//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { theme: newTheme },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ message: 'Theme updated', theme: school.theme });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    PUT /api/developer/school/:schoolId
//    Update school info. Cannot change password or slug here.
//    ══════════════════════════════════════════════════════════ */
// router.put('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     delete req.body.adminPassword;
//     delete req.body.slug;
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId, req.body, { new: true, runValidators: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ message: 'School updated', school });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    POST /api/developer/school/:schoolId/reset-password
//    Body: { newPassword }
//    ══════════════════════════════════════════════════════════ */
// router.post('/school/:schoolId/reset-password', verifyDevKey, async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     if (!newPassword || newPassword.length < 6) {
//       return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
//     }
//     const salt   = await bcryptjs.genSalt(10);
//     const hashed = await bcryptjs.hash(newPassword, salt);
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId, { adminPassword: hashed }, { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ message: `Admin password for "${school.name}" reset successfully` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    POST /api/developer/school/:schoolId/suspend
//    ══════════════════════════════════════════════════════════ */
// router.post('/school/:schoolId/suspend', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { isActive: false, suspendedAt: new Date(), suspendedBy: 'developer' },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ message: `School "${school.name}" suspended` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    POST /api/developer/school/:schoolId/reactivate
//    ══════════════════════════════════════════════════════════ */
// router.post('/school/:schoolId/reactivate', verifyDevKey, async (req, res) => {
//   try {
//     const school = await School.findByIdAndUpdate(
//       req.params.schoolId,
//       { isActive: true, suspendedAt: null, suspendedBy: null },
//       { new: true }
//     );
//     if (!school) return res.status(404).json({ error: 'School not found' });
//     res.json({ message: `School "${school.name}" reactivated` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    DELETE /api/developer/school/:schoolId
//    Hard delete — removes the school AND every document that
//    belongs to it across all collections.
//    ══════════════════════════════════════════════════════════ */
// router.delete('/school/:schoolId', verifyDevKey, async (req, res) => {
//   try {
//     const { schoolId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(schoolId)) {
//       return res.status(400).json({ error: 'Invalid schoolId format' });
//     }

//     const school = await School.findById(schoolId);
//     if (!school) return res.status(404).json({ error: 'School not found' });

//     const sid = school._id;

//     /* Cascade delete all school-scoped data in parallel */
//     const [users, exams, fees, results, notifications, testScores, subjectResults] =
//       await Promise.all([
//         User.deleteMany({ schoolId: sid }),
//         Exam.deleteMany({ schoolId: sid }),
//         Fee.deleteMany({ schoolId: sid }),
//         Result.deleteMany({ schoolId: sid }),
//         Notification.deleteMany({ schoolId: sid }),
//         TestScore.deleteMany({ schoolId: sid }),
//         SubjectResult.deleteMany({ schoolId: sid }),
//       ]);

//     await school.deleteOne();

//     res.json({
//       message: `School "${school.name}" and all its data permanently deleted`,
//       deleted: {
//         school        : 1,
//         users         : users.deletedCount,
//         exams         : exams.deletedCount,
//         fees          : fees.deletedCount,
//         results       : results.deletedCount,
//         notifications : notifications.deletedCount,
//         testScores    : testScores.deletedCount,
//         subjectResults: subjectResults.deletedCount,
//       },
//     });
//   } catch (err) {
//     console.error('[DEV DELETE /school]', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    GET /api/developer/stats/overview
//    ══════════════════════════════════════════════════════════ */
// router.get('/stats/overview', verifyDevKey, async (req, res) => {
//   try {
//     const [
//       totalSchools, activeSchools,
//       totalStudents, totalTeachers,
//       totalExams, planBreakdown,
//     ] = await Promise.all([
//       School.countDocuments(),
//       School.countDocuments({ isActive: true }),
//       User.countDocuments({ role: 'student' }),
//       User.countDocuments({ role: 'teacher' }),
//       Exam.countDocuments(),
//       School.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
//     ]);

//     res.json({
//       totalSchools,
//       activeSchools,
//       suspendedSchools: totalSchools - activeSchools,
//       totalStudents,
//       totalTeachers,
//       totalExams,
//       planBreakdown,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ══════════════════════════════════════════════════════════
//    GET /api/developer/test
//    ══════════════════════════════════════════════════════════ */
// router.get('/test', verifyDevKey, (req, res) => {
//   res.json({ message: 'Developer API is working', timestamp: new Date() });
// });

// module.exports = router;




/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/developer.js
   Developer / Super-Admin routes. Protected by x-developer-key.
   ═══════════════════════════════════════════════════════════ */
const express  = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const router   = express.Router();

const School        = require('../models/School');
const User          = require('../models/User');
const Exam          = require('../models/Exam');
const Fee           = require('../models/Fee');
const Result        = require('../models/Result');
const Notification  = require('../models/Notification');
const TestScore     = require('../models/TestScore');
const SubjectResult = require('../models/SubjectResult');

/* ── Email transporter (same Gmail SMTP as routes/auth.js) ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── Send welcome email to new school admin ────────────────── *
   Must be called AFTER school.save() but with the plain-text
   password captured BEFORE save (the pre-save hook hashes it).
   Fire-and-forget: any failure is logged but does not block
   the API response.                                             */
async function sendSchoolWelcomeEmail(school, plainPassword, requestHost) {
  if (!school || !school.email) return;
  const base  = requestHost ? `http://${requestHost}` : '';
  const login = base + '/login/' + (school.slug || '');
  const mailOptions = {
    from    : `"EduPortal" <${process.env.EMAIL_USER}>`,
    to      : school.email,
    subject : `Welcome to EduPortal — ${school.name} is now active`,
    html    : `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f6fb;padding:32px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#3b5bdb,#2f4ac2);padding:24px;border-radius:10px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:1.6rem">🎓 iMadious</h1>
          <p style="color:rgba(255,255,255,.8);margin:6px 0 0">School Management System</p>
        </div>
        <h2 style="color:#1a2236;margin-bottom:8px">Welcome, ${school.name}!</h2>
        <p style="color:#5a6a84;margin-bottom:20px">
          Your school has been registered on iMadious School Portal. You may now
          log in as the school administrator using the credentials below.
        </p>
        <table style="width:100%;background:white;border-radius:10px;border-collapse:separate;border-spacing:0 2px;padding:8px 16px;color:#1a2236">
          <tr><td style="padding:8px 4px;color:#5a6a84">School</td><td style="padding:8px 4px"><strong>${school.name}</strong></td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Login URL</td><td style="padding:8px 4px"><a href="${login}" style="color:#3b5bdb">${login}</a></td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Username</td><td style="padding:8px 4px"><strong>${school.adminUsername}</strong></td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Password</td><td style="padding:8px 4px"><code style="background:#eef2ff;padding:4px 8px;border-radius:4px">${plainPassword}</code></td></tr>
        </table>
        <div style="background:#fff4e6;border-left:4px solid #f59e0b;padding:12px 16px;margin-top:20px;border-radius:6px">
          <p style="color:#9a3412;margin:0;font-size:.9rem">
            <strong>Important:</strong> for your security, please change this
            password the first time you log in.
          </p>
        </div>
        <p style="color:#9aaabb;font-size:.8rem;text-align:center;margin-top:24px">
          This is an automated message. If you did not expect it, please contact support.
        </p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[sendSchoolWelcomeEmail] Failed:', err.message);
  }
}

/* ── Developer key guard ─────────────────────────────────── */
const verifyDevKey = (req, res, next) => {
  const key      = (req.headers['x-developer-key'] || '').trim();
  const expected = (process.env.DEVELOPER_KEY || '').trim();
  if (!expected) {
    return res.status(500).json({ error: 'DEVELOPER_KEY not configured in .env' });
  }
  if (key !== expected) {
    return res.status(403).json({ error: 'Invalid developer key' });
  }
  next();
};

/* ── Built-in theme presets ──────────────────────────────── */
const PRESET_THEMES = {
  slate: {
    primaryColor: '#1a73e8', secondaryColor: '#f0f4ff',
    accentColor: '#fbbc04', textColor: '#202124',
    fontFamily: 'Inter, sans-serif', borderRadius: '8px', darkMode: false,
  },
  ocean: {
    primaryColor: '#0077b6', secondaryColor: '#caf0f8',
    accentColor: '#00b4d8', textColor: '#03045e',
    fontFamily: 'Poppins, sans-serif', borderRadius: '10px', darkMode: false,
  },
  forest: {
    primaryColor: '#2d6a4f', secondaryColor: '#d8f3dc',
    accentColor: '#52b788', textColor: '#1b4332',
    fontFamily: 'Nunito, sans-serif', borderRadius: '8px', darkMode: false,
  },
  royal: {
    primaryColor: '#5a189a', secondaryColor: '#f3e9ff',
    accentColor: '#ff9f1c', textColor: '#240046',
    fontFamily: 'Raleway, sans-serif', borderRadius: '12px', darkMode: false,
  },
  midnight: {
    primaryColor: '#4361ee', secondaryColor: '#1a1a2e',
    accentColor: '#f72585', textColor: '#e0e0e0',
    fontFamily: 'Inter, sans-serif', borderRadius: '8px', darkMode: true,
  },
  sunset: {
    primaryColor: '#e63946', secondaryColor: '#fff1f0',
    accentColor: '#f4a261', textColor: '#1d1d1d',
    fontFamily: 'Montserrat, sans-serif', borderRadius: '6px', darkMode: false,
  },
};

/* ══════════════════════════════════════════════════════════
   PUBLIC — no dev key needed
   GET /api/developer/school/by-slug/:slug
   MUST be defined BEFORE /school/:schoolId to avoid conflict
   ══════════════════════════════════════════════════════════ */
router.get('/school/by-slug/:slug', async (req, res) => {
  try {
    const school = await School.findOne(
      { slug: req.params.slug, isActive: true },
      'name slug city principalName theme logoUrl plan'
    ).lean();
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/developer/school/register
   ══════════════════════════════════════════════════════════ */
router.post('/school/register', verifyDevKey, async (req, res) => {
  try {
    const {
      name, email, phone, address, city, principalName,
      adminUsername, adminPassword, slug,
      theme, plan, maxStudents, maxTeachers, logoUrl,
    } = req.body;

    if (!name || !email || !adminUsername || !adminPassword) {
      return res.status(400).json({
        error: 'name, email, adminUsername, and adminPassword are required',
      });
    }

    const conflict = await School.findOne({
      $or: [{ adminUsername }, { email: email.toLowerCase() }],
    });
    if (conflict) {
      const field = conflict.adminUsername === adminUsername ? 'adminUsername' : 'email';
      return res.status(409).json({ error: `A school with this ${field} already exists` });
    }

    let resolvedTheme = {};
    if (typeof theme === 'string' && PRESET_THEMES[theme]) {
      resolvedTheme = PRESET_THEMES[theme];
    } else if (theme && typeof theme === 'object') {
      resolvedTheme = theme;
    }

    const school = new School({
      name, email,
      phone         : phone || '',
      address       : address || '',
      city          : city || '',
      principalName : principalName || '',
      adminUsername,
      adminPassword,
      slug          : slug || undefined,
      theme         : resolvedTheme,
      plan          : plan || 'free',
      maxStudents   : maxStudents || 500,
      maxTeachers   : maxTeachers || 50,
      logoUrl       : logoUrl || '',
    });

    await school.save();

    /* Fire-and-forget welcome email to the new school admin.
       `adminPassword` here is still the plain text from the
       request body; school.adminPassword was hashed by the
       pre-save hook so we must use the original value. */
    sendSchoolWelcomeEmail(school, adminPassword, req.get('host')).catch(e =>
      console.error('[school register welcome email]', e.message)
    );

    res.status(201).json({
      message: 'School registered successfully',
      school: {
        id           : school._id,
        name         : school.name,
        slug         : school.slug,
        email        : school.email,
        adminUsername: school.adminUsername,
        theme        : school.theme,
        plan         : school.plan,
        loginUrl     : `/login/${school.slug}`,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ error: `Duplicate value for "${field}"` });
    }
    console.error('[DEV /school/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/developer/themes/presets
   ══════════════════════════════════════════════════════════ */
router.get('/themes/presets', verifyDevKey, (req, res) => {
  res.json({ presets: Object.keys(PRESET_THEMES), themes: PRESET_THEMES });
});

/* ══════════════════════════════════════════════════════════
   GET /api/developer/schools
   ══════════════════════════════════════════════════════════ */
router.get('/schools', verifyDevKey, async (req, res) => {
  try {
    const { plan, isActive, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (plan) filter.plan = plan;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [schools, total] = await Promise.all([
      School.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      School.countDocuments(filter),
    ]);

    const enriched = await Promise.all(schools.map(async (s) => {
      const [students, teachers, exams, fees] = await Promise.all([
        User.countDocuments({ schoolId: s._id, role: 'student' }),
        User.countDocuments({ schoolId: s._id, role: 'teacher' }),
        Exam.countDocuments({ schoolId: s._id }),
        Fee.countDocuments({ schoolId: s._id }),
      ]);
      const { adminPassword: _, ...safe } = s;
      return { ...safe, stats: { students, teachers, exams, fees } };
    }));

    res.json({ total, page: Number(page), schools: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/developer/school/:schoolId
   ══════════════════════════════════════════════════════════ */
router.get('/school/:schoolId', verifyDevKey, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).lean();
    if (!school) return res.status(404).json({ error: 'School not found' });
    delete school.adminPassword;

    const [students, teachers, exams, fees] = await Promise.all([
      User.countDocuments({ schoolId: school._id, role: 'student' }),
      User.countDocuments({ schoolId: school._id, role: 'teacher' }),
      Exam.countDocuments({ schoolId: school._id }),
      Fee.countDocuments({ schoolId: school._id }),
    ]);

    res.json({ school, stats: { students, teachers, exams, fees } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   PUT /api/developer/school/:schoolId/theme
   Body: { preset: 'ocean' }  OR  { theme: { primaryColor, ... } }
   ══════════════════════════════════════════════════════════ */
router.put('/school/:schoolId/theme', verifyDevKey, async (req, res) => {
  try {
    const { preset, theme } = req.body;
    let newTheme;

    if (preset && PRESET_THEMES[preset]) {
      newTheme = PRESET_THEMES[preset];
    } else if (theme && typeof theme === 'object') {
      newTheme = theme;
    } else {
      return res.status(400).json({
        error: `Provide { preset } (${Object.keys(PRESET_THEMES).join(', ')}) or a { theme } object`,
      });
    }

    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { theme: newTheme },
      { new: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: 'Theme updated', theme: school.theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   PUT /api/developer/school/:schoolId
   Update school info. Cannot change password or slug here.
   ══════════════════════════════════════════════════════════ */
router.put('/school/:schoolId', verifyDevKey, async (req, res) => {
  try {
    delete req.body.adminPassword;
    delete req.body.slug;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId, req.body, { new: true, runValidators: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: 'School updated', school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/developer/school/:schoolId/reset-password
   Body: { newPassword }
   ══════════════════════════════════════════════════════════ */
router.post('/school/:schoolId/reset-password', verifyDevKey, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
    }
    const salt   = await bcryptjs.genSalt(10);
    const hashed = await bcryptjs.hash(newPassword, salt);
    const school = await School.findByIdAndUpdate(
      req.params.schoolId, { adminPassword: hashed }, { new: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `Admin password for "${school.name}" reset successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/developer/school/:schoolId/suspend
   ══════════════════════════════════════════════════════════ */
router.post('/school/:schoolId/suspend', verifyDevKey, async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { isActive: false, suspendedAt: new Date(), suspendedBy: 'developer' },
      { new: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `School "${school.name}" suspended` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   POST /api/developer/school/:schoolId/reactivate
   ══════════════════════════════════════════════════════════ */
router.post('/school/:schoolId/reactivate', verifyDevKey, async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { isActive: true, suspendedAt: null, suspendedBy: null },
      { new: true }
    );
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `School "${school.name}" reactivated` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   DELETE /api/developer/school/:schoolId
   Hard delete — removes the school AND every document that
   belongs to it across all collections.
   ══════════════════════════════════════════════════════════ */
router.delete('/school/:schoolId', verifyDevKey, async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ error: 'Invalid schoolId format' });
    }

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const sid = school._id;

    /* Cascade delete all school-scoped data in parallel */
    const [users, exams, fees, results, notifications, testScores, subjectResults] =
      await Promise.all([
        User.deleteMany({ schoolId: sid }),
        Exam.deleteMany({ schoolId: sid }),
        Fee.deleteMany({ schoolId: sid }),
        Result.deleteMany({ schoolId: sid }),
        Notification.deleteMany({ schoolId: sid }),
        TestScore.deleteMany({ schoolId: sid }),
        SubjectResult.deleteMany({ schoolId: sid }),
      ]);

    await school.deleteOne();

    res.json({
      message: `School "${school.name}" and all its data permanently deleted`,
      deleted: {
        school        : 1,
        users         : users.deletedCount,
        exams         : exams.deletedCount,
        fees          : fees.deletedCount,
        results       : results.deletedCount,
        notifications : notifications.deletedCount,
        testScores    : testScores.deletedCount,
        subjectResults: subjectResults.deletedCount,
      },
    });
  } catch (err) {
    console.error('[DEV DELETE /school]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/developer/stats/overview
   ══════════════════════════════════════════════════════════ */
router.get('/stats/overview', verifyDevKey, async (req, res) => {
  try {
    const [
      totalSchools, activeSchools,
      totalStudents, totalTeachers,
      totalExams, planBreakdown,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Exam.countDocuments(),
      School.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    ]);

    res.json({
      totalSchools,
      activeSchools,
      suspendedSchools: totalSchools - activeSchools,
      totalStudents,
      totalTeachers,
      totalExams,
      planBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   GET /api/developer/test
   ══════════════════════════════════════════════════════════ */
router.get('/test', verifyDevKey, (req, res) => {
  res.json({ message: 'Developer API is working', timestamp: new Date() });
});

module.exports = router;
// /* ═══════════════════════════════════════════════════════════
//    middleware/schoolTenant.js

//    Multi-tenancy guard — must run AFTER auth middleware.

//    What it does:
//    1. Reads req.user.schoolId (set by auth.js after JWT verify)
//    2. Confirms the school is active in the DB (cached 60 s)
//    3. Attaches req.schoolId (ObjectId) and req.school (doc)
//       so every route handler can simply do:
//           Model.find({ schoolId: req.schoolId, ... })
//       without manually pulling it from the token each time.
//    4. Rejects requests whose token schoolId does not match
//       the schoolId in a request body / param (cross-school
//       tampering prevention).

//    Usage:
//      router.get('/students', auth, schoolTenant, handler)

//    Developer routes use a separate dev-key check and are
//    NOT subject to schoolTenant (they operate across schools).
//    ═══════════════════════════════════════════════════════════ */

// const mongoose = require('mongoose');
// const School   = require('../models/School');

// /* ── Simple in-memory cache (avoids a DB hit on every request) ── */
// const schoolCache = new Map();   // schoolId string → { school, expiresAt }
// const CACHE_TTL_MS = 60_000;    // 60 seconds

// async function getSchool(schoolId) {
//   const key = schoolId.toString();
//   const cached = schoolCache.get(key);

//   if (cached && cached.expiresAt > Date.now()) {
//     return cached.school;
//   }

//   const school = await School.findById(schoolId).lean();
//   if (school) {
//     schoolCache.set(key, { school, expiresAt: Date.now() + CACHE_TTL_MS });
//   }
//   return school;
// }

// /* ── Main middleware ─────────────────────────────────────────── */
// const schoolTenant = async (req, res, next) => {
//   try {
//     /* 1. Auth middleware must run first */
//     if (!req.user) {
//       return res.status(401).json({ message: 'Not authenticated.' });
//     }

//     /* 2. Developer tokens have no schoolId — skip tenant check */
//     if (req.user.role === 'developer') {
//       return next();
//     }

//     const rawId = req.user.schoolId;
//     if (!rawId) {
//       return res.status(403).json({
//         message: 'No school associated with this account.',
//       });
//     }

//     /* 3. Validate ObjectId format */
//     if (!mongoose.Types.ObjectId.isValid(rawId)) {
//       return res.status(400).json({ message: 'Invalid schoolId in token.' });
//     }

//     const schoolId = new mongoose.Types.ObjectId(rawId);

//     /* 4. Confirm school exists and is active */
//     const school = await getSchool(schoolId);
//     if (!school) {
//       return res.status(404).json({ message: 'School not found.' });
//     }
//     if (!school.isActive) {
//       return res.status(403).json({
//         message: 'This school account has been suspended. Contact the developer.',
//       });
//     }

//     /* 5. Attach to request for use in route handlers */
//     req.schoolId = schoolId;
//     req.school   = school;

//     /* 6. Cross-school tamper check
//          If the request body or params carry a schoolId that differs
//          from the authenticated school, reject immediately.          */
//     const bodySchoolId  = req.body?.schoolId;
//     const paramSchoolId = req.params?.schoolId;

//     for (const candidate of [bodySchoolId, paramSchoolId]) {
//       if (candidate && candidate.toString() !== schoolId.toString()) {
//         return res.status(403).json({
//           message: 'Cross-school access denied.',
//         });
//       }
//     }

//     next();
//   } catch (err) {
//     console.error('[schoolTenant]', err.message);
//     res.status(500).json({ message: 'Tenant verification error.' });
//   }
// };

// /* ── Helper: inject schoolId into query filters automatically ─── *
//    Route handlers can call this instead of writing
//    { ...filter, schoolId: req.schoolId } every time.              */
// schoolTenant.scopedFilter = (req, extra = {}) => ({
//   schoolId: req.schoolId,
//   ...extra,
// });

// /* ── Invalidate cache entry when a school is updated/suspended ── */
// schoolTenant.invalidateCache = (schoolId) => {
//   schoolCache.delete(schoolId.toString());
// };

// module.exports = schoolTenant;

/* ═══════════════════════════════════════════════════════════
   middleware/schoolTenant.js

   Must run AFTER auth middleware.
   Reads req.user.schoolId from the JWT, verifies the school
   is active, then attaches req.schoolId and req.school so
   every route handler can scope queries to that school only.

   Usage (Express 5 — separate router.use calls):
     router.use(auth);
     router.use(schoolTenant);
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');
const School   = require('../models/School');

/* 60-second in-memory cache — avoids a DB hit per request */
const schoolCache  = new Map();
const CACHE_TTL_MS = 60_000;

async function getSchool(schoolId) {
  const key    = schoolId.toString();
  const cached = schoolCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.school;

  const school = await School.findById(schoolId).lean();
  if (school) {
    schoolCache.set(key, { school, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return school;
}

const schoolTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    /* Developer tokens bypass school isolation */
    if (req.user.role === 'developer') return next();

    const rawId = req.user.schoolId;
    if (!rawId) {
      return res.status(403).json({ message: 'No school associated with this account' });
    }

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: 'Invalid schoolId in token' });
    }

    const schoolId = new mongoose.Types.ObjectId(rawId);
    const school   = await getSchool(schoolId);

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    if (!school.isActive) {
      return res.status(403).json({
        message: 'This school account has been suspended. Contact the developer.',
      });
    }

    req.schoolId = schoolId;
    req.school   = school;

    /* Cross-school tamper guard */
    const bodySchoolId  = req.body?.schoolId;
    const paramSchoolId = req.params?.schoolId;
    for (const candidate of [bodySchoolId, paramSchoolId]) {
      if (candidate && candidate.toString() !== schoolId.toString()) {
        return res.status(403).json({ message: 'Cross-school access denied' });
      }
    }

    next();
  } catch (err) {
    console.error('[schoolTenant]', err.message);
    res.status(500).json({ message: 'Tenant verification error' });
  }
};

module.exports = schoolTenant;
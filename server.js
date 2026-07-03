// /* ═══════════════════════════════════════════════════════════
//    EduPortal — server.js

//    IMPORTANT: All mongoose models are required EXPLICITLY
//    at the top before any routes load. This guarantees every
//    model is registered with mongoose before any route handler
//    or static method tries to call mongoose.model('ModelName').
//    This eliminates ALL "Schema hasn't been registered" errors.
//    ═══════════════════════════════════════════════════════════ */
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// /* ── ENVIRONMENT VALIDATION ─────────────────────────────────
//    Validate all required secrets before proceeding            */
// const { validateSecrets } = require('./config/secrets');
// validateSecrets();

// /* ── PRE-REGISTER ALL MODELS ────────────────────────────────
//    Must happen before any route file is required.            */
// require('./models/User');
// require('./models/OTP');
// require('./models/School');
// require('./models/Exam');
// require('./models/Result');
// require('./models/TestScore');
// require('./models/SubjectResult');
// require('./models/Fee');
// require('./models/Notification');
// require('./models/TeacherPayment');

// /* ── EXPRESS SETUP ──────────────────────────────────────── */
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// /* ── API ROUTES ─────────────────────────────────────────── */
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/developer', require('./routes/developer')); // Developer control panel
// app.use('/api/students', require('./routes/students'));
// app.use('/api/teachers', require('./routes/teachers'));
// app.use('/api/exams', require('./routes/exams'));
// app.use('/api/results', require('./routes/results'));
// app.use('/api/fees', require('./routes/fees'));
// app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/test-scores', require('./routes/testScores'));
// app.use('/api/subject-results', require('./routes/subjectResults'));
// app.use('/api/subjects', require('./routes/subjects'));
// app.use('/api/debug', require('./routes/debug')); // Debug endpoint

// /* ── SPA FALLBACK for HTML pages only ─────────────────────────── */
// app.get(/^\/(?!api\/)/, (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });
// /* ── GLOBAL ERROR HANDLER ──────────────────────────── */
// app.use((err, req, res, next) => {
//   console.error('[GLOBAL ERROR HANDLER] Error:', err.message);
//   console.error('[GLOBAL ERROR HANDLER] Stack:', err.stack);
//   res.status(err.status || 500).json({
//     error: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   });
// });
// /* ── CONNECT TO MONGODB THEN START ─────────────────────── */
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB Connected Successfully');
//     app.listen(process.env.PORT || 5000, () => {
//       console.log(`🚀 Server running at http://localhost:${process.env.PORT || 5000}`);
//     });
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err.message);
//     console.error('\n🚨 FATAL: Cannot start server without database connection.');
//     process.exit(1);
//   });

/* ═══════════════════════════════════════════════════════════
   EduPortal — server.js

   Multi-tenant school management system.
   Each school is identified by a unique schoolId (MongoDB
   ObjectId) and a human-friendly slug (e.g. "sunrise-academy").

   Isolation guarantee:
     Every protected route runs auth → schoolTenant middleware.
     schoolTenant reads req.user.schoolId from the JWT and
     scopes ALL database queries to that school only.
   ═══════════════════════════════════════════════════════════ */

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// /* ── ENVIRONMENT VALIDATION ─────────────────────────────────── */
// const { validateSecrets } = require('./config/secrets');
// validateSecrets();

// /* ── PRE-REGISTER ALL MODELS ────────────────────────────────── *
//    Must happen before any route file is required so that
//    mongoose.model('ModelName') never throws "not registered".  */
// require('./models/User');
// require('./models/OTP');
// require('./models/School');
// require('./models/Exam');
// require('./models/Result');
// require('./models/TestScore');
// require('./models/SubjectResult');
// require('./models/Fee');
// require('./models/Notification');
// require('./models/TeacherPayment');

// /* ── EXPRESS SETUP ──────────────────────────────────────────── */
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// /* ── PUBLIC ROUTES (no auth required) ──────────────────────── */

// /*
//   GET /api/school-theme/:slug
//   Frontend calls this BEFORE login to get the school's
//   theme + branding so the login page can style itself.
//   No auth needed — just slug → public theme data.
// */
// app.get('/api/school-theme/:slug', async (req, res) => {
//   try {
//     const School = mongoose.model('School');
//     const school = await School.findOne(
//       { slug: req.params.slug, isActive: true },
//       'name slug city principalName theme logoUrl'
//     ).lean();
//     if (!school) return res.status(404).json({ error: 'School not found.' });
//     res.json({ school });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /*
//   GET /api/schools/list
//   Returns a lightweight list of active schools for a
//   "Select your school" dropdown on the login page.
// */
// app.get('/api/schools/list', async (req, res) => {
//   try {
//     const School = mongoose.model('School');
//     const schools = await School.find(
//       { isActive: true },
//       'name slug city theme.primaryColor logoUrl'
//     ).sort({ name: 1 }).lean();
//     res.json({ schools });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// /* ── PROTECTED API ROUTES ────────────────────────────────────── *
//    auth middleware verifies the JWT and sets req.user.
//    schoolTenant middleware (inside each router) then reads
//    req.user.schoolId and scopes every query to that school.    */
// app.use('/api/auth',            require('./routes/auth'));
// app.use('/api/developer',       require('./routes/developer'));
// app.use('/api/students',        require('./routes/students'));
// app.use('/api/teachers',        require('./routes/teachers'));
// app.use('/api/exams',           require('./routes/exams'));
// app.use('/api/results',         require('./routes/results'));
// app.use('/api/fees',            require('./routes/fees'));
// app.use('/api/notifications',   require('./routes/notifications'));
// app.use('/api/test-scores',     require('./routes/testScores'));
// app.use('/api/subject-results', require('./routes/subjectResults'));
// app.use('/api/subjects',        require('./routes/subjects'));
// app.use('/api/debug',           require('./routes/debug'));

// /* ── SPA FALLBACK ────────────────────────────────────────────── */
// app.get(/^\/(?!api\/)/, (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// /* ── GLOBAL ERROR HANDLER ────────────────────────────────────── */
// app.use((err, req, res, next) => {
//   console.error('[ERROR]', err.message);
//   res.status(err.status || 500).json({
//     error: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
//   });
// });

// /* ── START ───────────────────────────────────────────────────── */
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB Connected');
//     app.listen(process.env.PORT || 5000, () => {
//       console.log(`🚀 Server → http://localhost:${process.env.PORT || 5000}`);
//     });
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err.message);
//     process.exit(1);
//   });

/* ═══════════════════════════════════════════════════════════
   EduPortal — server.js

   Multi-tenant school management system.
   Each school is identified by a unique schoolId (MongoDB
   ObjectId) and a human-friendly slug (e.g. "sunrise-academy").

   Isolation guarantee:
     Every protected route runs auth → schoolTenant middleware.
     schoolTenant reads req.user.schoolId from the JWT and
     scopes ALL database queries to that school only.
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

/* ── ENVIRONMENT VALIDATION ─────────────────────────────────── */
const { validateSecrets } = require('./config/secrets');
validateSecrets();

/* ── PRE-REGISTER ALL MODELS ────────────────────────────────── *
   Must happen before any route file is required so that
   mongoose.model('ModelName') never throws "not registered".  */
require('./models/User');
require('./models/OTP');
require('./models/School');
require('./models/Exam');
require('./models/Result');
require('./models/TestScore');
require('./models/SubjectResult');
require('./models/Fee');
require('./models/Notification');
require('./models/TeacherPayment');

/* ── EXPRESS SETUP ──────────────────────────────────────────── */
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── PUBLIC ROUTES (no auth required) ──────────────────────── */

/*
  GET /api/school-theme/:slug
  Frontend calls this BEFORE login to get the school's
  theme + branding so the login page can style itself.
  No auth needed — just slug → public theme data.
*/
app.get('/api/school-theme/:slug', async (req, res) => {
  try {
    const School = mongoose.model('School');
    const school = await School.findOne(
      { slug: req.params.slug, isActive: true },
      'name slug city principalName theme logoUrl'
    ).lean();
    if (!school) return res.status(404).json({ error: 'School not found.' });
    res.json({ school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
  GET /api/schools/list
  Returns a lightweight list of active schools for a
  "Select your school" dropdown on the login page.
*/
app.get('/api/schools/list', async (req, res) => {
  try {
    const School = mongoose.model('School');
    const schools = await School.find(
      { isActive: true },
      'name slug city theme.primaryColor logoUrl'
    ).sort({ name: 1 }).lean();
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PROTECTED API ROUTES ────────────────────────────────────── *
   auth middleware verifies the JWT and sets req.user.
   schoolTenant middleware (inside each router) then reads
   req.user.schoolId and scopes every query to that school.    */
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/developer',       require('./routes/developer'));
app.use('/api/students',        require('./routes/students'));
app.use('/api/teachers',        require('./routes/teachers'));
app.use('/api/exams',           require('./routes/exams'));
app.use('/api/results',         require('./routes/results'));
app.use('/api/fees',            require('./routes/fees'));
app.use('/api/notifications',   require('./routes/notifications'));
app.use('/api/test-scores',     require('./routes/testScores'));
app.use('/api/subject-results', require('./routes/subjectResults'));
// app.use('/api/subjects',        require('./routes/subjects'));
// app.use('/api/debug',           require('./routes/debug'));
app.use('/api/subjects',        require('./routes/subjects'));
app.use('/api/debug',           require('./routes/debug'));
// app.use('/api/ai',              require('./routes/aiExam'));
app.use('/api/ai',              require('./routes/aiExam'));
app.use('/api/report-cards',    require('./routes/reportCards'));

/* ── SPA FALLBACK ────────────────────────────────────────────── */
app.get(/^\/(?!api\/)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── GLOBAL ERROR HANDLER ────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/* ── ONE-TIME INDEX MIGRATION ──────────────────────────────────
   Older versions of the schema had a GLOBAL unique index on
   email (`email_1`). The current schema uses a compound index
   `{ email, schoolId }` so the same email can exist across
   different schools. If the legacy index is still present in
   Mongo, it will block multi-school registrations. Drop it on
   startup so existing databases heal themselves.                */
async function migrateUserIndexes() {
  try {
    const coll = mongoose.connection.collection('users');
    const indexes = await coll.indexes();
    const legacy = indexes.find(i => i.name === 'email_1');
    if (legacy) {
      await coll.dropIndex('email_1');
      console.log('🛠  Dropped legacy users.email_1 index (replaced by compound email+schoolId).');
    }
  } catch (err) {
    // Non-fatal: log and keep booting.
    console.warn('[migrateUserIndexes] Skipped:', err.message);
  }
}

/* ── START ───────────────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await migrateUserIndexes();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server → http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

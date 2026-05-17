
/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/developer.js
   Developer / Super-Admin routes. Protected by x-developer-key.
   ═══════════════════════════════════════════════════════════ */
const express  = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
/* ── Brevo HTTP API sender (avoids SMTP port blocks on Render) ── */
async function sendBrevoEmail({ to, toName, subject, html }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key'     : process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender    : { name: 'iMadious', email: process.env.EMAIL_FROM || process.env.EMAIL_USER },
      to        : [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error('Brevo API error: ' + err);
  }
  return response.json();
}
const router   = express.Router();

const School        = require('../models/School');
const User          = require('../models/User');
const Exam          = require('../models/Exam');
const Fee           = require('../models/Fee');
const Result        = require('../models/Result');
const Notification  = require('../models/Notification');
const TestScore     = require('../models/TestScore');
const SubjectResult = require('../models/SubjectResult');

/* ── Email via Brevo HTTP API — no SMTP ports needed ── */

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
    await sendBrevoEmail({ to: school.email, toName: school.name, subject: mailOptions.subject, html: mailOptions.html });
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

// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/auth.js
//    Handles login, OTP-based email verification for
//    student & teacher registration.

//    Flow:
//      1. POST /auth/send-otp   → generate 6-digit OTP, email it
//      2. POST /auth/verify-otp → check OTP, create account
//      3. POST /auth/login      → JWT login for all roles
//    ═══════════════════════════════════════════════════════════ */
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// /* ── Brevo HTTP API sender (avoids SMTP port blocks on Render) ── */
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

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/auth.js
   Handles login, OTP-based email verification for
   student & teacher registration.

   Flow:
     1. POST /auth/send-otp   → generate 6-digit OTP, email it
     2. POST /auth/verify-otp → check OTP, create account
     3. POST /auth/login      → JWT login for all roles
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
const User = require('../models/User');
const School = require('../models/School');
const OTP = require('../models/OTP');
const Fee = require('../models/Fee');
const { validateSubjects, getSubjectsByDepartment, requiresDepartment } = require('../config/subjectCombinations');
const { validators, handleValidationErrors } = require('../middleware/validators');
const { loginLimiter, otpInitiateLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
require('dotenv').config();

/* ── EMAIL via Brevo HTTP API ──────────────────────────────
   Set BREVO_API_KEY and EMAIL_FROM in Render environment vars.
   No SMTP ports needed — works on Render free plan.
   ─────────────────────────────────────────────────────────── */

/* ── GENERATE 6-DIGIT OTP ─────────────────────────────────── */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ── SEND OTP EMAIL ──────────────────────────────────────── */
async function sendOTPEmail(email, otp, name, role) {
  const roleLabel = role === 'teacher' ? 'Teacher' : 'Student';
  const mailOptions = {
    from: `"iMadious EduPortal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Email Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f4f6fb;padding:32px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#3b5bdb,#2f4ac2);padding:24px;border-radius:10px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:1.6rem">🎓 iMadious</h1>
          <p style="color:rgba(255,255,255,.8);margin:6px 0 0">School Management System</p>
        </div>
        <h2 style="color:#1a2236;margin-bottom:8px">Hello, ${name}!</h2>
        <p style="color:#5a6a84;margin-bottom:20px">
          You are registering as a <strong>${roleLabel}</strong> on iMadious School Portal.
          Use the verification code below to complete your registration.
        </p>
        <div style="background:white;border:2px dashed #3b5bdb;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <p style="color:#5a6a84;margin:0 0 8px;font-size:.85rem">Your OTP Code</p>
          <div style="font-size:2.5rem;font-weight:900;letter-spacing:8px;color:#3b5bdb">${otp}</div>
          <p style="color:#9aaabb;margin:10px 0 0;font-size:.8rem">This code expires in <strong>10 minutes</strong></p>
        </div>
        <p style="color:#9aaabb;font-size:.8rem;text-align:center">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `
  };
  await sendBrevoEmail({ to: email, toName: name, subject: mailOptions.subject, html: mailOptions.html });
}

/* ── NOTIFY SCHOOL ADMIN OF A NEW PENDING REGISTRATION ────── *
   Sent when a student or teacher completes OTP verification.
   The admin must log in and approve/reject the account.        */
async function sendAdminPendingApprovalEmail(school, newUser) {
  if (!school || !school.email) return; /* nothing to do */
  const roleLabel = newUser.role === 'teacher' ? 'Teacher' : 'Student';
  const fullName  = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.username;

  const mailOptions = {
    from    : `"iMadious EduPortal" <${process.env.EMAIL_USER}>`,
    to      : school.email,
    subject : `New ${roleLabel} Registration Pending Approval`,
    html    : `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f6fb;padding:32px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#3b5bdb,#2f4ac2);padding:24px;border-radius:10px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:1.6rem">🎓 iMadious</h1>
          <p style="color:rgba(255,255,255,.8);margin:6px 0 0">${school.name}</p>
        </div>
        <h2 style="color:#1a2236;margin-bottom:8px">New ${roleLabel} Registration</h2>
        <p style="color:#5a6a84;margin-bottom:20px">
          A new ${roleLabel.toLowerCase()} has just completed email verification for
          <strong>${school.name}</strong> and is awaiting your approval.
        </p>
        <table style="width:100%;background:white;border-radius:10px;border-collapse:separate;border-spacing:0 2px;padding:8px 16px;color:#1a2236">
          <tr><td style="padding:8px 4px;color:#5a6a84">Name</td><td style="padding:8px 4px"><strong>${fullName}</strong></td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Username</td><td style="padding:8px 4px">${newUser.username || '—'}</td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Email</td><td style="padding:8px 4px">${newUser.email || '—'}</td></tr>
          <tr><td style="padding:8px 4px;color:#5a6a84">Role</td><td style="padding:8px 4px">${roleLabel}</td></tr>
          ${newUser.class    ? `<tr><td style="padding:8px 4px;color:#5a6a84">Class</td><td style="padding:8px 4px">${newUser.class}</td></tr>`       : ''}
          ${newUser.department ? `<tr><td style="padding:8px 4px;color:#5a6a84">Department</td><td style="padding:8px 4px">${newUser.department}</td></tr>` : ''}
          ${newUser.subject  ? `<tr><td style="padding:8px 4px;color:#5a6a84">Subject</td><td style="padding:8px 4px">${newUser.subject}</td></tr>`   : ''}
        </table>
        <p style="color:#5a6a84;margin:24px 0 8px">
          Please log into your admin panel to review and approve or reject this registration.
        </p>
        <p style="color:#9aaabb;font-size:.8rem;text-align:center;margin-top:24px">
          This is an automated notification from iMadious. No action is required on this email itself.
        </p>
      </div>
    `,
  };

  try {
    await sendBrevoEmail({ to: school.email, toName: school.name, subject: mailOptions.subject, html: mailOptions.html });
  } catch (err) {
    /* Never crash the registration flow if email fails */
    console.error('[sendAdminPendingApprovalEmail] Failed:', err.message);
  }
}

/* ═══════════════════════════════════════════════════════════
   STEP 1 — SEND OTP
   POST /api/auth/send-otp
   Body: { firstName, lastName, username, email, password, schoolId, class?, department?, parentPhoneNumber?, role }
   ═══════════════════════════════════════════════════════════ */
router.post('/send-otp',
  otpInitiateLimiter,
  validators.registerInitiate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { firstName, lastName, username, email, password, role, schoolId } = req.body;

      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'School ID is required. Please select your school.' });
      }

      // Verify school exists and is active
      const School = require('mongoose').model('School');
      const school = await School.findById(schoolId);
      if (!school || !school.isActive) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive school.' });
      }

      /* Check username not taken within this school */
      const existing = await User.findOne({ username, schoolId });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken in this school.' });

      /* Check email not already registered */
      const emailTaken = await User.findOne({ email, schoolId });
      if (emailTaken) return res.status(400).json({ success: false, message: 'Email already registered in this school.' });

      /* Delete any previous OTP for this email */
      await OTP.deleteMany({ email });

      /* Generate OTP */
      const otp = generateOTP();

      /* Hash password before storing in temp OTP doc */
      const hashedPassword = await bcrypt.hash(password, 10);

      /* Save OTP + user data temporarily */
      await OTP.create({
        email,
        otp,
        role,
        userData: { ...req.body, password: hashedPassword, schoolId }
      });

      /* Send email */
      const name = `${firstName || ''} ${lastName || ''}`.trim() || username;
      await sendOTPEmail(email, otp, name, role);

      res.json({ success: true, message: `OTP sent to ${email}. Check your inbox.` });

    } catch (err) {
      console.error('Send OTP error:', err);
      /* If email sending fails, still inform the user clearly */
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        return res.status(500).json({ success: false, message: 'Email sending failed. Check EMAIL_USER and EMAIL_PASS in .env.' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });

/* ═══════════════════════════════════════════════════════════
   STEP 2 — VERIFY OTP & CREATE ACCOUNT
   POST /api/auth/verify-otp
   Body: { email, otp, class, department?, subjects? }
   
   For JSS: include class (JSS1-JSS3) and array of selected subjects
   For SSS: include class (SSS1-SSS3) and department (SCIENCE, ART, COMMERCIAL)
   parentPhoneNumber is optional, can be included in first request
   ═══════════════════════════════════════════════════════════ */
router.post('/verify-otp',
  otpVerifyLimiter,
  validators.registerVerifyOTP,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, otp, class: requestClass, department: requestDept, subjects: selectedSubjects } = req.body;

      const record = await OTP.findOne({ email });
      if (!record) {
        return res.status(400).json({ success: false, message: 'OTP expired or not found. Please register again.' });
      }
      if (record.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
      }

      /* OTP correct — prepare user account */
      const { userData } = record;

      // Use class from request body first, fall back to userData.class
      const classLevel = requestClass || userData.class || '';
      // Use department from request body first, fall back to userData.department
      const department = requestDept || userData.department || '';
      let finalSubjects = [];

      /* Handle subject assignment for students */
      if (userData.role === 'student') {
        // Ensure a class level was supplied for students only
        if (!classLevel) {
          return res.status(400).json({
            success: false,
            message: 'Class level is required (e.g., JSS1, SSS1, etc.)'
          });
        }
        /* Check if this is an SSS class */
        if (requiresDepartment(classLevel)) {
          // SSS Student - requires department
          if (!department) {
            return res.status(400).json({
              success: false,
              message: 'Department is required for SSS students. Please select SCIENCE, ART, or COMMERCIAL.'
            });
          }
          /* For SSS: auto-assign department subjects */
          finalSubjects = getSubjectsByDepartment(department);
          if (finalSubjects.length === 0) {
            return res.status(400).json({
              success: false,
              message: `Invalid department: ${department}. Must be SCIENCE, ART, or COMMERCIAL`
            });
          }
        } else {
          // JSS Student - requires subjects
          if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Please select at least one subject from the list.'
            });
          }


          const validation = validateSubjects(classLevel, department, selectedSubjects);
          if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
          }
          finalSubjects = selectedSubjects;
        }

      }

      /* Create the user account — set as PENDING for admin approval */
      const user = new User({
        schoolId: userData.schoolId,
        schoolName: userData.schoolName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
        password: userData.password,        // already hashed
        role: userData.role,
        gender: userData.gender || undefined,
        class: classLevel,
        department: department || undefined,
        phone: userData.phone || undefined,
        subjects: finalSubjects,
        parentPhoneNumber: userData.parentPhoneNumber || undefined,
        subject: userData.subject || '',   // for teachers
        isActive: true,
        approvalStatus: 'pending'  // New registrations require admin approval
      });
      await user.save();

      /* Create fee record for students */
      if (userData.role === 'student') {
        await Fee.create({
          schoolId: userData.schoolId,
          student: user._id,
          total: 85000,
          paid: 0,
          status: 'unpaid'
        });
      }

      /* Delete OTP record */
      await OTP.deleteMany({ email });

      /* Notify the school admin that a new registration is pending.
         Fire-and-forget — any email failure is logged but does not
         block the signup flow. */
      try {
        const school = await School.findById(userData.schoolId);
        if (school) {
          sendAdminPendingApprovalEmail(school, user).catch(e =>
            console.error('[verify-otp admin notify]', e.message)
          );
        }
      } catch (notifyErr) {
        console.error('[verify-otp admin notify lookup]', notifyErr.message);
      }

      res.json({
        success: true,
        message: 'Email verified! Account created successfully. Your account is pending admin approval. You will receive an email once approved.'
      });

    } catch (err) {
      console.error('Verify OTP error:', err);
      /* Friendly handling for duplicate-key errors from Mongo */
      if (err && err.code === 11000) {
        const key = Object.keys(err.keyPattern || err.keyValue || {}).join(', ') || 'field';
        return res.status(400).json({
          success: false,
          message: `An account with that ${key} already exists for this school. Please use a different ${key} or sign in instead.`
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  });

/* ═══════════════════════════════════════════════════════════
   RESEND OTP
   POST /api/auth/resend-otp
   Body: { email }
   ═══════════════════════════════════════════════════════════ */
router.post('/resend-otp', otpInitiateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ success: false, message: 'No pending registration found. Please register again.' });

    const otp = generateOTP();
    record.otp = otp;
    record.createdAt = new Date();
    await record.save();

    const name = `${record.userData?.firstName || ''} ${record.userData?.lastName || ''}`.trim() || email;
    await sendOTPEmail(email, otp, name, record.role);

    res.json({ success: true, message: `New OTP sent to ${email}.` });
  } catch (err) {
    res.status(500).json({ success: false, success: false, message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   LOGIN — all roles
   POST /api/auth/login
   Body: { username, password, role }
   ═══════════════════════════════════════════════════════════ */
router.post('/login',
  loginLimiter,
  validators.login,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password, role } = req.body;

      /* Admin login: first check hardcoded super-admin, then school admins in DB */
      if (role === 'admin') {
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPassHash = process.env.ADMIN_PASS_HASH;

        // Check if this is the hardcoded super-admin
        if (username === adminUser && adminPassHash) {
          const isValidPassword = await bcrypt.compare(password, adminPassHash);
          if (isValidPassword) {
            const token = jwt.sign(
              { id: 'admin', username: adminUser, role: 'admin', name: 'Administrator' },
              process.env.JWT_SECRET,
              { expiresIn: '8h' }
            );
            return res.json({
              success: true,
              token,
              user: { id: 'admin', username: adminUser, role: 'admin', name: 'Administrator' }
            });
          }
        }

        // Fall back: check school admins registered by developer
        const school = await School.findOne({ adminUsername: username, isActive: true });
        if (!school) {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }
        const isSchoolAdminValid = await school.compareAdminPassword(password);
        if (!isSchoolAdminValid) {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }
        const token = jwt.sign(
          {
            id: school._id,
            schoolId: school._id,
            username: school.adminUsername,
            role: 'admin',
            name: school.name,
            schoolName: school.name
          },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.json({
          success: true,
          token,
          user: {
            id: school._id,
            schoolId: school._id,
            username: school.adminUsername,
            role: 'admin',
            name: school.name,
            schoolName: school.name
          }
        });
      }

      /* Teachers and Students — check DB.
         password has `select: false` on the schema, so we must
         explicitly include it here for bcrypt.compare. */
      const user = await User.findOne({ username, role }).select('+password');
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

      if (!user.password) {
        return res.status(500).json({ success: false, message: 'Account is missing a password. Please contact your school admin to reset it.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

      /* Resolve school name — prefer the denormalized copy on the user,
         fall back to a School lookup for older accounts that were created
         before we stored schoolName on the user doc. */
      let resolvedSchoolName = user.schoolName || '';
      if (!resolvedSchoolName && user.schoolId) {
        try {
          const school = await School.findById(user.schoolId).select('name');
          if (school) resolvedSchoolName = school.name;
        } catch (_) { /* non-fatal */ }
      }

      /* Check if user is approved (not for admin) */
      if (role !== 'admin' && user.approvalStatus !== 'approved') {
        if (user.approvalStatus === 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Your account is pending admin approval. Please wait for confirmation.'
          });
        } else if (user.approvalStatus === 'rejected') {
          return res.status(403).json({
            success: false,
            message: `Your registration was rejected. Reason: ${user.rejectionReason || 'Not specified'}`
          });
        }
      }

      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          role: user.role,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          class: user.class || '',
          schoolId: user.schoolId,
          schoolName: resolvedSchoolName
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          class: user.class || '',
          email: user.email || '',
          schoolId: user.schoolId || '',
          schoolName: resolvedSchoolName
        }
      });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

/* ═══════════════════════════════════════════════════════════
   GET AVAILABLE SUBJECTS FOR A CLASS LEVEL
   GET /api/auth/subjects/:classLevel
   Returns subjects available for registration based on class level
   ═══════════════════════════════════════════════════════════ */
router.get('/subjects/:classLevel', (req, res) => {
  try {
    const { classLevel } = req.params;
    const { getSubjectsByClass, requiresDepartment, DEPARTMENT_SUBJECTS } = require('../config/subjectCombinations');

    const needsDept = requiresDepartment(classLevel);
    const subjects = getSubjectsByClass(classLevel);

    if (subjects === null) {
      /* SSS student — need department selection */
      return res.json({
        success: true,
        classLevel,
        requiresDepartment: true,
        departments: Object.keys(DEPARTMENT_SUBJECTS),
        departmentSubjects: DEPARTMENT_SUBJECTS,
        message: 'Select department first to see available subjects'
      });
    }

    /* JSS student — can select from full list */
    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ success: false, message: `Invalid class level: ${classLevel}` });
    }

    res.json({
      success: true,
      classLevel,
      requiresDepartment: false,
      subjects,
      message: `${subjects.length} subjects available for ${classLevel}`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET DEPARTMENT SUBJECTS
   GET /api/auth/department-subjects/:department
   Returns subjects for a specific department (SSS students)
   ═══════════════════════════════════════════════════════════ */
router.get('/department-subjects/:department', (req, res) => {
  try {
    const { department } = req.params;
    const { getSubjectsByDepartment } = require('../config/subjectCombinations');

    const subjects = getSubjectsByDepartment(department);

    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid department: ${department}. Must be SCIENCE, ART, or COMMERCIAL`
      });
    }

    res.json({
      success: true,
      department,
      subjects,
      count: subjects.length
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GENERATE TEMPORARY PASSWORD (8 chars) ──────────────────
   Used for admin-triggered password resets                  */
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let tempPass = '';
  for (let i = 0; i < 8; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPass;
}

/* ── SEND PASSWORD RESET EMAIL ──────────────────────────────*/
async function sendPasswordResetEmail(email, temporaryPassword, name, role) {
  const roleLabel = role === 'teacher' ? 'Teacher' : 'Student';
  const mailOptions = {
    from: `"EduPortal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'EduPortal — Your Password Has Been Reset',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f4f6fb;padding:32px;border-radius:12px">
        <div style="background:linear-gradient(135deg,#3b5bdb,#2f4ac2);padding:24px;border-radius:10px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:1.6rem">🎓 iMadious</h1>
          <p style="color:rgba(255,255,255,.8);margin:6px 0 0">School Management System</p>
        </div>
        <h2 style="color:#1a2236;margin-bottom:8px">Hello, ${name}!</h2>
        <p style="color:#5a6a84;margin-bottom:20px">
          Your password has been reset by the school administrator.
          Use the temporary password below to log in, then change it to something you'll remember.
        </p>
        <div style="background:white;border:2px dashed #3b5bdb;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <p style="color:#5a6a84;margin:0 0 8px;font-size:.85rem">Your Temporary Password</p>
          <div style="font-size:1.8rem;font-family:monospace;font-weight:bold;letter-spacing:2px;color:#3b5bdb;background:#f8f9fa;padding:16px;border-radius:6px;word-break:break-all">${temporaryPassword}</div>
          <p style="color:#9aaabb;margin:10px 0 0;font-size:.8rem">⚠️ This is a temporary password. Please change it after logging in.</p>
        </div>
        <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:16px;margin-bottom:20px;border-radius:4px">
          <p style="color:#856404;margin:0;font-size:.9rem"><strong>📝 Next Steps:</strong></p>
          <ol style="color:#856404;margin:8px 0 0;padding-left:20px;font-size:.9rem">
            <li>Log in with the temporary password above</li>
            <li>Go to your profile or settings</li>
            <li>Change your password to something secure</li>
          </ol>
        </div>
        <p style="color:#9aaabb;font-size:.8rem;text-align:center">
          If you did not request this reset, please contact the school administrator immediately.
        </p>
      </div>
    `
  };
  await sendBrevoEmail({ to: mailOptions.to, subject: mailOptions.subject, html: mailOptions.html });
}

/* ═══════════════════════════════════════════════════════════
   ADMIN — RESET USER PASSWORD
   POST /api/auth/admin/reset-password
   Body: { userId }
   
   Admin can reset a student or teacher's password.
   A temporary password is generated and emailed to them.
   Requires admin authentication token.
   ═══════════════════════════════════════════════════════════ */
router.post('/admin/reset-password',
  auth,
  requireRole('admin'),
  validators.adminResetPassword,
  handleValidationErrors,
  async (req, res) => {
    try {
      // const { userId } = req.body;

      // const user = await User.findById(userId);
      // if (!user) {
      //   return res.status(404).json({ success: false, message: 'User not found.' });
      // }

      // // Prevent resetting admin password this way
      // if (user.role === 'admin') {
      //   return res.status(403).json({ success: false, message: 'Cannot reset admin password via this endpoint.' });
      // }

      // /* Generate temporary password */
      // const tempPassword = generateTemporaryPassword();
      // const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

      const { userId, newPassword } = req.body;

          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
          }
          
          // Prevent resetting admin password this way
          if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot reset admin password via this endpoint.' });
          }
          
          /* Use custom password if provided, otherwise auto-generate */
          const tempPassword = (newPassword && newPassword.trim().length >= 6)
            ? newPassword.trim()
            : generateTemporaryPassword();
          const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

      /* Update user password */
      user.password = hashedTempPassword;
      await user.save();

      /* Send email with temporary password */
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
      await sendPasswordResetEmail(user.email, tempPassword, name, user.role);

      res.json({
        success: true,
        message: `Password reset for ${user.username}. Temporary password sent to ${user.email}.`,
        userDetails: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('Admin reset password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

/* ═══════════════════════════════════════════════════════════
   CHANGE PASSWORD (USER SELF-SERVICE)
   POST /api/auth/change-password
   Body: { oldPassword, newPassword, confirmPassword }
   
   Allows students and teachers to change their own password.
   Requires authentication token.
   ═══════════════════════════════════════════════════════════ */
router.post('/change-password',
  auth,
  validators.changePassword,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      /* Verify old password */
      const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }

      /* Hash new password */
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      /* Update password */
      user.password = hashedNewPassword;
      await user.save();

      res.json({
        success: true,
        message: '✅ Password changed successfully! You will need to log in with your new password.'
      });

    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

/* ═══════════════════════════════════════════════════════════
   SCHOOL ADMIN LOGIN
   POST /api/auth/admin-login
   
   Authenticate a school admin using school admin credentials.
   Returns JWT token with schoolId for data filtering.
   
   Body: { schoolName, adminUsername, adminPassword }
   ═══════════════════════════════════════════════════════════ */
router.post('/admin-login',
  loginLimiter,
  async (req, res) => {
    try {
      const { schoolName, adminUsername, adminPassword } = req.body;

      if (!schoolName || !adminUsername || !adminPassword) {
        return res.status(400).json({
          success: false,
          message: 'School name, admin username, and password are required.'
        });
      }

      // Find school by name or admin username
      const School = require('mongoose').model('School');
      const school = await School.findOne({
        $or: [
          { name: schoolName },
          { adminUsername }
        ],
        isActive: true
      });

      if (!school) {
        return res.status(401).json({
          success: false,
          message: 'Invalid school or admin credentials.'
        });
      }

      // Verify admin password
      const isPasswordValid = await school.compareAdminPassword(adminPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid school or admin credentials.'
        });
      }

      // Create JWT token with schoolId
      const token = jwt.sign(
        {
          id: school._id,
          schoolId: school._id,
          username: school.adminUsername,
          role: 'admin',
          name: school.name,
          schoolName: school.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: school._id,
          schoolId: school._id,
          username: school.adminUsername,
          role: 'admin',
          schoolName: school.name
        }
      });
    } catch (err) {
      console.error('School admin login error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;

// const mongoose = require('mongoose');
// const bcryptjs = require('bcryptjs');

// const SchoolSchema = new mongoose.Schema({
//     // School information
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, trim: true },
//     phone: { type: String },
//     address: { type: String },
//     city: { type: String },
//     principalName: { type: String },

//     // School admin credentials (for this school's admin login)
//     adminUsername: { type: String, required: true, unique: true, trim: true },
//     adminPassword: { type: String, required: true }, // Hashed with bcrypt

//     // Admin can access via JWT using this schoolId
//     // All students, teachers, exams, fees, etc. will reference this schoolId

//     // Tracking
//     isActive: { type: Boolean, default: true },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// }, { timestamps: true });

// // Hash admin password before saving
// // Note: Password should be pre-hashed before saving. This hook is a fallback only.
// SchoolSchema.pre('save', async function () {
//     // Skip if password not modified or already bcrypt hashed
//     if (!this.isModified('adminPassword')) {
//         return;
//     }

//     // Check if already bcrypt hashed (starts with $2a$, $2b$, or $2y$)
//     if (this.adminPassword.startsWith('$2a$') || this.adminPassword.startsWith('$2b$') || this.adminPassword.startsWith('$2y$')) {
//         return;
//     }

//     try {
//         const salt = await bcryptjs.genSalt(10);
//         this.adminPassword = await bcryptjs.hash(this.adminPassword, salt);
//     } catch (err) {
//         throw err;
//     }
// });

// // Method to verify admin password
// SchoolSchema.methods.compareAdminPassword = async function (plainPassword) {
//     return await bcryptjs.compare(plainPassword, this.adminPassword);
// };

// module.exports = mongoose.model('School', SchoolSchema);

/* ═══════════════════════════════════════════════════════════
   models/School.js
   Each school is a fully isolated tenant.
   schoolId (._id) is the partition key used on EVERY
   other collection (User, Exam, Result, Fee, etc.).
   ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');
// const bcryptjs  = require('bcryptjs');

// const SchoolSchema = new mongoose.Schema(
//   {
//     /* ── Identity ─────────────────────────────────────────── */
//     name          : { type: String, required: true, trim: true },
//     email         : { type: String, required: true, trim: true, lowercase: true },
//     phone         : { type: String, trim: true },
//     address       : { type: String },
//     city          : { type: String },
//     principalName : { type: String },
//     logoUrl       : { type: String, default: '' },   // optional school logo URL

//     /* ── Unique short code for the school (used in login URL) ─
//        e.g.  /login/sunrise-academy
//        Generated automatically from name if not provided.      */
//     slug: {
//       type     : String,
//       unique   : true,
//       trim     : true,
//       lowercase: true,
//     },

//     /* ── Admin credentials ────────────────────────────────── */
//     adminUsername : { type: String, required: true, unique: true, trim: true },
//     adminPassword : { type: String, required: true },   // bcrypt hashed

//     /* ── Per-school UI theme ──────────────────────────────── *
//        Allows every school to have its own colour palette,
//        font and branding without touching a single line of
//        frontend code — the frontend reads these values and
//        applies them via CSS variables.                         */
//     theme: {
//       primaryColor   : { type: String, default: '#1a73e8' },   // main brand colour
//       secondaryColor : { type: String, default: '#f0f4ff' },   // background / accents
//       accentColor    : { type: String, default: '#fbbc04' },   // buttons, highlights
//       textColor      : { type: String, default: '#202124' },   // body text
//       fontFamily     : { type: String, default: 'Inter, sans-serif' },
//       borderRadius   : { type: String, default: '8px' },       // card / button radius
//       darkMode       : { type: Boolean, default: false },
//     },

//     /* ── Subscription / plan ─────────────────────────────── */
//     plan: {
//       type    : String,
//       enum    : ['free', 'basic', 'premium', 'enterprise'],
//       default : 'free',
//     },
//     maxStudents : { type: Number, default: 500 },
//     maxTeachers : { type: Number, default: 50 },

//     /* ── Status ───────────────────────────────────────────── */
//     isActive    : { type: Boolean, default: true },
//     suspendedAt : { type: Date, default: null },
//     suspendedBy : { type: String, default: null },  // developer username
//   },
//   { timestamps: true }
// );

// /* ── Auto-generate slug from name before first save ─────────── */
// SchoolSchema.pre('validate', function (next) {
//   if (!this.slug && this.name) {
//     this.slug = this.name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9\s-]/g, '')
//       .replace(/\s+/g, '-')
//       .replace(/-+/g, '-');
//   }
//   next();
// });

// /* ── Hash admin password before save ─────────────────────────── */
// SchoolSchema.pre('save', async function (next) {
//   if (!this.isModified('adminPassword')) return next();
//   // Skip if already bcrypt-hashed
//   if (/^\$2[aby]\$/.test(this.adminPassword)) return next();
//   const salt = await bcryptjs.genSalt(10);
//   this.adminPassword = await bcryptjs.hash(this.adminPassword, salt);
//   next();
// });

// /* ── Compare plain text against stored hash ──────────────────── */
// SchoolSchema.methods.compareAdminPassword = function (plain) {
//   return bcryptjs.compare(plain, this.adminPassword);
// };

// /* ── Never leak the hashed password ─────────────────────────── */
// SchoolSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.adminPassword;
//   return obj;
// };

// module.exports = mongoose.model('School', SchoolSchema);

/* ═══════════════════════════════════════════════════════════
   models/School.js
   Each school is a fully isolated tenant.
   schoolId (._id) is the partition key used on EVERY
   other collection (User, Exam, Result, Fee, etc.).
   ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');
// const bcryptjs  = require('bcryptjs');

// const SchoolSchema = new mongoose.Schema(
//   {
//     /* ── Identity ─────────────────────────────────────────── */
//     name          : { type: String, required: true, trim: true },
//     email         : { type: String, required: true, trim: true, lowercase: true },
//     phone         : { type: String, trim: true },
//     address       : { type: String },
//     city          : { type: String },
//     principalName : { type: String },
//     logoUrl       : { type: String, default: '' },   // optional school logo URL

//     /* ── Unique short code for the school (used in login URL) ─
//        e.g.  /login/sunrise-academy
//        Generated automatically from name if not provided.      */
//     slug: {
//       type     : String,
//       unique   : true,
//       trim     : true,
//       lowercase: true,
//     },

//     /* ── Admin credentials ────────────────────────────────── */
//     adminUsername : { type: String, required: true, unique: true, trim: true },
//     adminPassword : { type: String, required: true },   // bcrypt hashed

//     /* ── Per-school UI theme ──────────────────────────────── *
//        Allows every school to have its own colour palette,
//        font and branding without touching a single line of
//        frontend code — the frontend reads these values and
//        applies them via CSS variables.                         */
//     theme: {
//       primaryColor   : { type: String, default: '#1a73e8' },   // main brand colour
//       secondaryColor : { type: String, default: '#f0f4ff' },   // background / accents
//       accentColor    : { type: String, default: '#fbbc04' },   // buttons, highlights
//       textColor      : { type: String, default: '#202124' },   // body text
//       fontFamily     : { type: String, default: 'Inter, sans-serif' },
//       borderRadius   : { type: String, default: '8px' },       // card / button radius
//       darkMode       : { type: Boolean, default: false },
//     },

//     /* ── Subscription / plan ─────────────────────────────── */
//     plan: {
//       type    : String,
//       enum    : ['free', 'basic', 'premium', 'enterprise'],
//       default : 'free',
//     },
//     maxStudents : { type: Number, default: 500 },
//     maxTeachers : { type: Number, default: 50 },

//     /* ── Status ───────────────────────────────────────────── */
//     isActive    : { type: Boolean, default: true },
//     suspendedAt : { type: Date, default: null },
//     suspendedBy : { type: String, default: null },  // developer username
//   },
//   { timestamps: true }
// );

// /* ── Auto-generate slug from name before first save ─────────── */
// SchoolSchema.pre('validate', function (next) {
//   if (!this.slug && this.name) {
//     this.slug = this.name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9\s-]/g, '')
//       .replace(/\s+/g, '-')
//       .replace(/-+/g, '-');
//   }
//   next();
// });

// /* ── Hash admin password before save ─────────────────────────── */
// SchoolSchema.pre('save', async function (next) {
//   if (!this.isModified('adminPassword')) return next();
//   // Skip if already bcrypt-hashed
//   if (/^\$2[aby]\$/.test(this.adminPassword)) return next();
//   const salt = await bcryptjs.genSalt(10);
//   this.adminPassword = await bcryptjs.hash(this.adminPassword, salt);
//   next();
// });

// /* ── Compare plain text against stored hash ──────────────────── */
// SchoolSchema.methods.compareAdminPassword = function (plain) {
//   return bcryptjs.compare(plain, this.adminPassword);
// };

// /* ── Never leak the hashed password ─────────────────────────── */
// SchoolSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.adminPassword;
//   return obj;
// };

// module.exports = mongoose.models.School || mongoose.model('School', SchoolSchema);

/* ═══════════════════════════════════════════════════════════
   models/School.js
   Each school is a fully isolated tenant.
   schoolId (._id) is the partition key used on EVERY
   other collection (User, Exam, Result, Fee, etc.).
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');
const bcryptjs  = require('bcryptjs');

const SchoolSchema = new mongoose.Schema(
  {
    /* ── Identity ─────────────────────────────────────────── */
    name          : { type: String, required: true, trim: true },
    email         : { type: String, required: true, trim: true, lowercase: true },
    phone         : { type: String, trim: true },
    address       : { type: String },
    city          : { type: String },
    principalName : { type: String },
    logoUrl       : { type: String, default: '' },

    /* ── Slug (used in login URL e.g. /login/sunrise-academy) ─ */
    slug: {
      type     : String,
      unique   : true,
      trim     : true,
      lowercase: true,
    },

    /* ── Admin credentials ────────────────────────────────── */
    adminUsername : { type: String, required: true, unique: true, trim: true },
    adminPassword : { type: String, required: true },

    /* ── Per-school UI theme ──────────────────────────────── */
    theme: {
      primaryColor  : { type: String, default: '#1a73e8' },
      secondaryColor: { type: String, default: '#f0f4ff' },
      accentColor   : { type: String, default: '#fbbc04' },
      textColor     : { type: String, default: '#202124' },
      fontFamily    : { type: String, default: 'Inter, sans-serif' },
      borderRadius  : { type: String, default: '8px' },
      darkMode      : { type: Boolean, default: false },
    },

    /* ── Subscription / limits ────────────────────────────── */
    plan       : { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    maxStudents: { type: Number, default: 500 },
    maxTeachers: { type: Number, default: 50 },

    /* ── Status ───────────────────────────────────────────── */
    isActive   : { type: Boolean, default: true },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: String, default: null },
  },
  { timestamps: true }
);

/* ── Auto-generate slug from name ────────────────────────────── *
   Synchronous hook — no next(), no async. Just return.           */
SchoolSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
});

/* ── Hash admin password before save ─────────────────────────── *
   Mongoose 9 async pre-hooks: do NOT accept or call next().
   Just return — Mongoose awaits the promise automatically.        */
SchoolSchema.pre('save', async function () {
  if (!this.isModified('adminPassword')) return;
  if (/^\$2[aby]\$/.test(this.adminPassword)) return;
  const salt = await bcryptjs.genSalt(10);
  this.adminPassword = await bcryptjs.hash(this.adminPassword, salt);
});

/* ── Compare plain text against stored hash ──────────────────── */
SchoolSchema.methods.compareAdminPassword = function (plain) {
  return bcryptjs.compare(plain, this.adminPassword);
};

/* ── Never leak the hashed password ─────────────────────────── */
SchoolSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.adminPassword;
  return obj;
};

/* ── Overwrite guard: safe to require from multiple files ──────── */
module.exports = mongoose.models.School || mongoose.model('School', SchoolSchema);
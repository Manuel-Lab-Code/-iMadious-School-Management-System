// // const mongoose = require('mongoose');

// // const UserSchema = new mongoose.Schema({
// //   // Multi-tenancy: Every user belongs to a school
// //   schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
// //   schoolName: { type: String }, // Denormalized for quick access

// //   firstName: { type: String },
// //   lastName: { type: String },
// //   username: { type: String, required: true, trim: true }, // Now unique per school, not global
// //   password: { type: String, required: true },
// //   email: { type: String },
// //   role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
// //   gender: { type: String, enum: ['male', 'female'] },

// //   // For students
// //   class: { type: String },       // JSS1-JSS3, SSS1-SSS3, etc.
// //   department: { type: String },       // for SSS students: SCIENCE, ART, COMMERCIAL
// //   subjects: { type: [String], default: [] },  // Selected/assigned subjects
// //   parentPhoneNumber: { type: String },  // Parent/guardian contact

// //   // For teachers: the subject they teach
// //   subject: { type: String },
// //   phone: { type: String },
// //   employmentDate: { type: Date },  // Date teacher was employed
// //   salary: { type: Number },    // Monthly salary

// //   // Approval workflow
// //   approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
// //   approvedBy: { type: String },  // Admin username who approved (can be 'admin' or other)
// //   approvalDate: { type: Date },
// //   rejectionReason: { type: String },

// //   isActive: { type: Boolean, default: true },
// // }, { timestamps: true });

// // // Create a compound unique index for username per school (same username can exist in different schools)
// // UserSchema.index({ schoolId: 1, username: 1 }, { unique: true });

// // module.exports = mongoose.model('User', UserSchema);

// /* ═══════════════════════════════════════════════════════════════
//    models/User.js
//    Admins and teachers.  schoolId ties every user to their tenant.
//    ═══════════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');
// const bcrypt   = require('bcryptjs');

// const ROLES = ['admin', 'teacher'];

// const UserSchema = new mongoose.Schema(
//   {
//     /* ── Identity ─────────────────────────────────────────────── */
//     name: {
//       type     : String,
//       required : [true, 'Name is required'],
//       trim     : true,
//     },
//     email: {
//       type      : String,
//       required  : [true, 'Email is required'],
//       lowercase : true,
//       trim      : true,
//     },
//     password: {
//       type     : String,
//       required : [true, 'Password is required'],
//       minlength: [6, 'Password must be at least 6 characters'],
//       select   : false,   // never returned in queries by default
//     },

//     /* ── Authorization ────────────────────────────────────────── */
//     role: {
//       type    : String,
//       enum    : { values: ROLES, message: 'Role must be admin or teacher' },
//       default : 'teacher',
//     },

//     /* ── Multi-Tenancy ────────────────────────────────────────── */
//     schoolId: {
//       type     : mongoose.Schema.Types.ObjectId,
//       ref      : 'School',
//       required : [true, 'schoolId is required'],
//       index    : true,
//     },
//   },
//   { timestamps: true }
// );

// /* ── Compound unique index: same email can exist in different schools ── */
// UserSchema.index({ email: 1, schoolId: 1 }, { unique: true });

// /* ── Hash password before save ─────────────────────────────────── */
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const rounds  = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
//   this.password = await bcrypt.hash(this.password, rounds);
//   next();
// });

// /* ── Instance method: compare plain password with hash ─────────── */
// UserSchema.methods.comparePassword = async function (plain) {
//   return bcrypt.compare(plain, this.password);
// };

// /* ── Never leak the password hash in JSON responses ────────────── */
// UserSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.password;
//   return obj;
// };

// module.exports = mongoose.model('User', UserSchema);


/* ═══════════════════════════════════════════════════════════════
   models/User.js
   Covers admin, teacher, and student accounts.
   schoolId ties every user to their tenant school.
   ═══════════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ROLES = ['admin', 'teacher', 'student'];

const UserSchema = new mongoose.Schema(
  {
    /* ── Identity ─────────────────────────────────────────────── */
    firstName: { type: String, trim: true },
    lastName : { type: String, trim: true },
    name     : { type: String, trim: true },   // teachers/admins use this
    username : { type: String, trim: true },

    email: {
      type      : String,
      required  : [true, 'Email is required'],
      lowercase : true,
      trim      : true,
    },
    password: {
      type     : String,
      required : [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select   : false,   // never returned in queries by default
    },

    /* ── Authorization ────────────────────────────────────────── */
    role: {
      type   : String,
      enum   : { values: ROLES, message: 'Invalid role' },
      default: 'student',
    },

    /* ── Multi-Tenancy ────────────────────────────────────────── */
    schoolId: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'School',
      required: [true, 'schoolId is required'],
      index   : true,
    },
    schoolName: { type: String },   // denormalised for quick display

    /* ── Student-specific fields ──────────────────────────────── */
    class              : { type: String },
    department         : { type: String },
    subjects           : { type: [String], default: [] },
    parentPhoneNumber  : { type: String },

    /* ── Teacher-specific fields ──────────────────────────────── */
    subject        : { type: String },
    phone          : { type: String },
    employmentDate : { type: Date },
    salary         : { type: Number },

    /* ── Approval workflow ────────────────────────────────────── */
    approvalStatus : {
      type   : String,
      enum   : ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy     : { type: String },
    approvalDate   : { type: Date },
    rejectionReason: { type: String },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ── Compound unique index: same email can exist in different schools ── */
UserSchema.index({ email: 1, schoolId: 1 }, { unique: true });

/* ── Hash password before save ─────────────────────────────────── *
   NOTE: Mongoose 9 + async pre-hooks must NOT accept or call next().
   Simply return — Mongoose awaits the async function automatically.  */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // Skip if already bcrypt-hashed (prevents double-hashing)
  if (/^\$2[aby]\$/.test(this.password)) return;
  const rounds  = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
});

/* ── Instance method: compare plain password with hash ─────────── */
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* ── Never leak the password hash in JSON responses ────────────── */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/* ── Overwrite guard: safe to require from multiple files ───────── */
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
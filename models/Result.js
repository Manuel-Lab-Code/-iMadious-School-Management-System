// // /* ═══════════════════════════════════════════════════════════
// //    EduPortal — models/Result.js
// //    Stores exam submission and scoring data for each student.
// //    ═══════════════════════════════════════════════════════════ */
// // const mongoose = require('mongoose');

// // const ObjBreakdownSchema = new mongoose.Schema({
// //   text: String,
// //   correct: Boolean,
// //   studentAns: String,
// //   correctAns: String,
// //   marks: Number,
// //   maxMarks: Number
// // }, { _id: false });

// // const TheoryAnswerSchema = new mongoose.Schema({
// //   questionId: String,
// //   questionText: String,
// //   answer: String,
// //   guide: String,
// //   maxMarks: Number,
// //   marksAwarded: { type: Number, default: null }
// // }, { _id: false });

// // const ResultSchema = new mongoose.Schema({
// //   schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
// //   student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// //   studentName: { type: String, default: '' },
// //   exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
// //   examTitle: { type: String, default: '' },
// //   subject: { type: String, default: '' },

// //   /* Objective section scores */
// //   objScore: { type: Number, default: 0 },
// //   objTotal: { type: Number, default: 0 },
// //   objBreakdown: [ObjBreakdownSchema],

// //   /* Theory section scores and answers */
// //   theoryScore: { type: Number, default: null },  // null = not yet marked by teacher
// //   theoryTotal: { type: Number, default: 0 },
// //   theoryAnswers: [TheoryAnswerSchema],

// //   /* Overall scores */
// //   totalScore: { type: Number, default: 0 },
// //   grandTotal: { type: Number, default: 0 },
// //   percent: { type: Number, default: 0 },
// //   grade: { type: String, default: 'F' },

// //   /* Status and visibility */
// //   status: {
// //     type: String,
// //     enum: ['submitted', 'marked', 'released'],
// //     default: 'submitted'
// //   },
// //   released: { type: Boolean, default: false },
// // }, { timestamps: true });

// // /* Compound index — one result per student per exam */
// // ResultSchema.index({ student: 1, exam: 1 }, { unique: true });

// // module.exports = mongoose.model('Result', ResultSchema);

// /* ═══════════════════════════════════════════════════════════════
//    models/Result.js
//    ═══════════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');

// const ResultSchema = new mongoose.Schema(
//   {
//     studentId: {
//       type     : mongoose.Schema.Types.ObjectId,
//       ref      : 'Student',
//       required : [true, 'studentId is required'],
//     },
//     subject: {
//       type     : String,
//       required : [true, 'Subject is required'],
//       trim     : true,
//     },
//     score: {
//       type     : Number,
//       required : [true, 'Score is required'],
//       min      : [0,   'Score cannot be negative'],
//       max      : [100, 'Score cannot exceed 100'],
//     },
//     term: {
//       type : String,
//       enum : ['first', 'second', 'third', ''],
//       default: '',
//     },
//     session: {
//       type    : String,
//       trim    : true,
//       default : '',
//     },
//     grade: {
//       type: String,  // computed on save (see pre-save hook)
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

// /* ── Compound indexes for common query patterns ─────────────────── */
// ResultSchema.index({ schoolId: 1, studentId: 1 });
// ResultSchema.index({ schoolId: 1, subject: 1 });

// /* ── Auto-compute grade from score ──────────────────────────────── */
// ResultSchema.pre('save', function (next) {
//   if (this.isModified('score')) {
//     const s = this.score;
//     if      (s >= 70) this.grade = 'A';
//     else if (s >= 60) this.grade = 'B';
//     else if (s >= 50) this.grade = 'C';
//     else if (s >= 45) this.grade = 'D';
//     else if (s >= 40) this.grade = 'E';
//     else              this.grade = 'F';
//   }
//   next();
// });

// module.exports = mongoose.model('Result', ResultSchema);

/* ═══════════════════════════════════════════════════════════
   EduPortal — models/Result.js
   Stores exam submission and scoring data for each student.

   FIXED: Restored the full schema that routes/results.js,
   SubjectResult.recalc, and the frontend JS actually use.
   The previous "minimal" schema ({ studentId, subject, score })
   was incompatible with the rest of the codebase and would
   silently drop submissions.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const ObjBreakdownSchema = new mongoose.Schema({
  text       : String,
  correct    : Boolean,
  studentAns : String,
  correctAns : String,
  marks      : Number,
  maxMarks   : Number,
}, { _id: false });

const TheoryAnswerSchema = new mongoose.Schema({
  questionId   : String,
  questionText : String,
  answer       : String,
  guide        : String,
  maxMarks     : Number,
  marksAwarded : { type: Number, default: null },
}, { _id: false });

const ResultSchema = new mongoose.Schema({
  /* ── Multi-tenancy key ─────────────────────────────────── */
  schoolId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'School',
    required: true,
    index   : true,
  },

  /* ── Ownership ─────────────────────────────────────────── */
  student     : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName : { type: String, default: '' },
  exam        : { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  examTitle   : { type: String, default: '' },
  subject     : { type: String, default: '' },

  /* ── Objective section scores ──────────────────────────── */
  objScore     : { type: Number, default: 0 },
  objTotal     : { type: Number, default: 0 },
  objBreakdown : [ObjBreakdownSchema],

  /* ── Theory section scores (null = not yet marked) ─────── */
  theoryScore   : { type: Number, default: null },
  theoryTotal   : { type: Number, default: 0 },
  theoryAnswers : [TheoryAnswerSchema],

  /* ── Overall ───────────────────────────────────────────── */
  totalScore : { type: Number, default: 0 },
  grandTotal : { type: Number, default: 0 },
  percent    : { type: Number, default: 0 },
  grade      : { type: String, default: 'F' },

  /* ── Status & visibility ───────────────────────────────── */
  status: {
    type   : String,
    enum   : ['submitted', 'marked', 'released'],
    default: 'submitted',
  },
  released : { type: Boolean, default: false },
}, { timestamps: true });

/* One result per student per exam */
ResultSchema.index({ student: 1, exam: 1 }, { unique: true });

/* Common query patterns */
ResultSchema.index({ schoolId: 1, student: 1 });
ResultSchema.index({ schoolId: 1, exam: 1 });
ResultSchema.index({ schoolId: 1, released: 1 });

/* Overwrite guard: safe to require from multiple files */
module.exports = mongoose.models.Result || mongoose.model('Result', ResultSchema);

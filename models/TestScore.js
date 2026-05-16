// /* ═══════════════════════════════════════════════════════════
//    EduPortal — models/TestScore.js
//    Stores manually-entered test scores per student per
//    subject per term. Entered by the teacher, released by admin.

//    Score breakdown per subject per term:
//      Objective (exam)  = max 20 marks
//      Theory (exam)     = max 40 marks
//      Test score        = max 40 marks
//      ─────────────────────────────────
//      TOTAL             = 100 marks
//    ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');

// const TestScoreSchema = new mongoose.Schema({
//   schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
//   student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   studentName: { type: String },
//   subject: { type: String, required: true },
//   class: { type: String },
//   session: { type: String, required: true },   // e.g. "2024/2025"
//   term: { type: String, required: true },   // "First Term" etc.
//   score: { type: Number, required: true, min: 0, max: 40 }, // out of 40
//   maxScore: { type: Number, default: 40 },
//   remarks: { type: String, default: '' },      // teacher notes
//   enteredBy: { type: String },                   // teacher username
//   enteredByName: { type: String },
//   status: {
//     type: String,
//     enum: ['submitted', 'released'],             // submitted=sent to admin, released=visible to student
//     default: 'submitted'
//   },
//   released: { type: Boolean, default: false },
// }, { timestamps: true });

// /* Compound index — one test score per student per subject per term per session */
// TestScoreSchema.index({ student: 1, subject: 1, session: 1, term: 1 }, { unique: true });

// module.exports = mongoose.model('TestScore', TestScoreSchema);


/* ═══════════════════════════════════════════════════════════
   EduPortal — models/TestScore.js
   Stores manually-entered test scores per student per
   subject per term. Entered by the teacher, released by admin.

   Score breakdown per subject per term:
     Objective (exam)  = max 20 marks
     Theory (exam)     = max 40 marks
     Test score        = max 40 marks
     ─────────────────────────────────
     TOTAL             = 100 marks

   FIXED: Compound unique index now includes schoolId so the
   same student/subject/session/term tuple is scoped per school.
   (Student IDs are globally unique so this is mostly defensive,
   but it makes the contract explicit.)
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const TestScoreSchema = new mongoose.Schema({
  schoolId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'School',
    required: true,
    index   : true,
  },
  student       : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName   : { type: String },
  subject       : { type: String, required: true },
  class         : { type: String },
  session       : { type: String, required: true },   // e.g. "2024/2025"
  term          : { type: String, required: true },   // "First Term" etc.
  score         : { type: Number, required: true, min: 0, max: 40 },
  maxScore      : { type: Number, default: 40 },
  remarks       : { type: String, default: '' },
  enteredBy     : { type: String },
  enteredByName : { type: String },
  status        : {
    type   : String,
    enum   : ['submitted', 'released'],
    default: 'submitted',
  },
  released      : { type: Boolean, default: false },
}, { timestamps: true });

/* Compound unique index — one test score per student per subject per term per session per school */
TestScoreSchema.index(
  { schoolId: 1, student: 1, subject: 1, session: 1, term: 1 },
  { unique: true }
);

module.exports = mongoose.models.TestScore || mongoose.model('TestScore', TestScoreSchema);

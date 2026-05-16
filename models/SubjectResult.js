// /* ═══════════════════════════════════════════════════════════
//    EduPortal — models/SubjectResult.js
//    Accumulated result per student per subject per term.
//    Formula: Objective(20) + Theory(40) + Test(40) = 100

//    FIX: All sibling models required at TOP LEVEL — no lazy
//    loading needed because none of them form a circular chain:
//      SubjectResult → Result     (Result does NOT → SubjectResult)
//      SubjectResult → TestScore  (TestScore does NOT → SubjectResult)
//      SubjectResult → User       (User does NOT → SubjectResult)
//    ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');

// /* ── Schema ───────────────────────────────────────────────── */
// const SubjectResultSchema = new mongoose.Schema({
//   schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
//   student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   studentName: { type: String, default: '' },
//   class: { type: String, default: '' },
//   subject: { type: String, required: true },
//   session: { type: String, default: '' },
//   term: { type: String, default: '' },

//   objScore: { type: Number, default: 0 },   // max 20
//   theoryScore: { type: Number, default: 0 },   // max 40
//   testScore: { type: Number, default: 0 },   // max 40

//   examResultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', default: null },
//   testScoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestScore', default: null },

//   totalScore: { type: Number, default: 0 },
//   grade: { type: String, default: 'F' },
//   remark: { type: String, default: 'Fail' },
//   released: { type: Boolean, default: false },
// }, { timestamps: true });

// SubjectResultSchema.index(
//   { student: 1, subject: 1, session: 1, term: 1 },
//   { unique: true }
// );

// /* ── Grade helpers ────────────────────────────────────────── */
// function _grade(t) {
//   if (t >= 75) return 'A';
//   if (t >= 65) return 'B';
//   if (t >= 55) return 'C';
//   if (t >= 45) return 'D';
//   return 'F';
// }
// function _remark(t) {
//   if (t >= 75) return 'Excellent';
//   if (t >= 65) return 'Very Good';
//   if (t >= 55) return 'Good';
//   if (t >= 45) return 'Fair';
//   return 'Fail';
// }

// /* ── Static recalc method ─────────────────────────────────── */
// SubjectResultSchema.statics.recalc = async function (studentId, subject, session, term) {
//   try {
//     if (!studentId || !subject) return;

//     /* Require sibling models here — safe because no circular chain exists */
//     const Result = require('./Result');
//     const TestScore = require('./TestScore');
//     const Exam = require('./Exam');
//     const User = require('./User');

//     /* Find all exams matching this subject + session + term */
//     const matchingExams = await Exam.find({
//       subject,
//       session: session || '',
//       term: term || ''
//     }).lean();

//     const examIds = matchingExams.map(e => String(e._id));

//     /* Find exam results for this student with matching exams */
//     let examResult = null;
//     if (examIds.length > 0) {
//       examResult = await Result.findOne({
//         student: studentId,
//         exam: { $in: examIds }
//       }).sort({ createdAt: -1 }).lean();
//     }

//     /* Test score for this session + term */
//     const ts = await TestScore.findOne({
//       student: studentId,
//       subject,
//       session: session || '',
//       term: term || ''
//     }).lean();

//     const user = await User.findById(studentId).lean();

//     const obj = examResult ? Math.min(Number(examResult.objScore) || 0, 20) : 0;
//     const theory = examResult ? Math.min(Number(examResult.theoryScore) || 0, 40) : 0;
//     const test = ts ? Math.min(Number(ts.score) || 0, 40) : 0;
//     const total = obj + theory + test;

//     /* Only released when BOTH exam result AND test score are released */
//     const released = !!(examResult && examResult.released && ts && ts.released);

//     await this.findOneAndUpdate(
//       { student: studentId, subject, session: session || '', term: term || '' },
//       {
//         student: studentId,
//         studentName: user ? `${user.firstName} ${user.lastName}` : '',
//         class: user ? (user.class || '') : '',
//         subject,
//         session: session || '',
//         term: term || '',
//         objScore: obj,
//         theoryScore: theory,
//         testScore: test,
//         examResultId: examResult ? examResult._id : null,
//         testScoreId: ts ? ts._id : null,
//         totalScore: total,
//         grade: _grade(total),
//         remark: _remark(total),
//         released
//       },
//       { returnDocument: 'after', upsert: true }
//     );
//   } catch (err) {
//     console.error('[SubjectResult.recalc] Error:', err.message);
//   }
// };

// module.exports = mongoose.model('SubjectResult', SubjectResultSchema);



/* ═══════════════════════════════════════════════════════════
   EduPortal — models/SubjectResult.js
   Accumulated result per student per subject per term.
   Formula: Objective(20) + Theory(40) + Test(40) = 100

   FIXED: recalc() now requires schoolId and filters every
   internal query by it. Previously, Exam.find({ subject, ... })
   could pull exams from other schools into a student's tally.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const SubjectResultSchema = new mongoose.Schema({
  schoolId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'School',
    required: true,
    index   : true,
  },
  student     : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName : { type: String, default: '' },
  class       : { type: String, default: '' },
  subject     : { type: String, required: true },
  session     : { type: String, default: '' },
  term        : { type: String, default: '' },

  objScore    : { type: Number, default: 0 },   // max 20
  theoryScore : { type: Number, default: 0 },   // max 40
  testScore   : { type: Number, default: 0 },   // max 40

  examResultId : { type: mongoose.Schema.Types.ObjectId, ref: 'Result', default: null },
  testScoreId  : { type: mongoose.Schema.Types.ObjectId, ref: 'TestScore', default: null },

  totalScore : { type: Number, default: 0 },
  grade      : { type: String, default: 'F' },
  remark     : { type: String, default: 'Fail' },
  released   : { type: Boolean, default: false },
}, { timestamps: true });

/* One subject result per student per subject per term per school */
SubjectResultSchema.index(
  { schoolId: 1, student: 1, subject: 1, session: 1, term: 1 },
  { unique: true }
);

/* ── Grade helpers ────────────────────────────────────────── */
function _grade(t) {
  if (t >= 75) return 'A';
  if (t >= 65) return 'B';
  if (t >= 55) return 'C';
  if (t >= 45) return 'D';
  return 'F';
}
function _remark(t) {
  if (t >= 75) return 'Excellent';
  if (t >= 65) return 'Very Good';
  if (t >= 55) return 'Good';
  if (t >= 45) return 'Fair';
  return 'Fail';
}

/* ═══════════════════════════════════════════════════════════
   recalc(schoolId, studentId, subject, session, term)
   MUST be called with schoolId — pulling the subject/session/
   term combo across schools is a data-leak bug.

   Backward-compat: if the FIRST argument is not a valid
   ObjectId we treat it as legacy (studentId first) and derive
   schoolId from the student's User record. This keeps existing
   call sites working until they are upgraded, but logs a warn.
   ═══════════════════════════════════════════════════════════ */
SubjectResultSchema.statics.recalc = async function (a, b, c, d, e) {
  try {
    const Result    = require('./Result');
    const TestScore = require('./TestScore');
    const Exam      = require('./Exam');
    const User      = require('./User');

    let schoolId, studentId, subject, session, term;

    /* New signature: recalc(schoolId, studentId, subject, session, term) */
    if (mongoose.Types.ObjectId.isValid(a) && mongoose.Types.ObjectId.isValid(b)) {
      schoolId  = a;
      studentId = b;
      subject   = c;
      session   = d;
      term      = e;
    } else {
      /* Legacy signature: recalc(studentId, subject, session, term) */
      studentId = a;
      subject   = b;
      session   = c;
      term      = d;
      const u = await User.findById(studentId).select('schoolId').lean();
      if (!u || !u.schoolId) {
        console.warn('[SubjectResult.recalc] student has no schoolId; aborting');
        return;
      }
      schoolId = u.schoolId;
      console.warn(
        '[SubjectResult.recalc] legacy call — please update caller to pass schoolId first'
      );
    }

    if (!studentId || !subject) return;

    /* Only consider exams, results, and test scores from THIS school */
    const matchingExams = await Exam.find({
      schoolId,
      subject,
      session: session || '',
      term   : term    || '',
    }).select('_id').lean();

    const examIds = matchingExams.map(e => e._id);

    let examResult = null;
    if (examIds.length > 0) {
      examResult = await Result.findOne({
        schoolId,
        student : studentId,
        exam    : { $in: examIds },
      }).sort({ createdAt: -1 }).lean();
    }

    const ts = await TestScore.findOne({
      schoolId,
      student: studentId,
      subject,
      session: session || '',
      term   : term    || '',
    }).lean();

    const user = await User.findOne({ _id: studentId, schoolId }).lean();

    const obj     = examResult ? Math.min(Number(examResult.objScore)    || 0, 20) : 0;
    const theory  = examResult ? Math.min(Number(examResult.theoryScore) || 0, 40) : 0;
    const test    = ts         ? Math.min(Number(ts.score)               || 0, 40) : 0;
    const total   = obj + theory + test;
    const released = !!(examResult && examResult.released && ts && ts.released);

    await this.findOneAndUpdate(
      {
        schoolId,
        student: studentId,
        subject,
        session: session || '',
        term   : term    || '',
      },
      {
        schoolId,
        student     : studentId,
        studentName : user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        class       : user ? (user.class || '') : '',
        subject,
        session     : session || '',
        term        : term    || '',
        objScore    : obj,
        theoryScore : theory,
        testScore   : test,
        examResultId: examResult ? examResult._id : null,
        testScoreId : ts         ? ts._id         : null,
        totalScore  : total,
        grade       : _grade(total),
        remark      : _remark(total),
        released,
      },
      { returnDocument: 'after', upsert: true, new: true }
    );
  } catch (err) {
    console.error('[SubjectResult.recalc] Error:', err.message);
  }
};

module.exports = mongoose.models.SubjectResult || mongoose.model('SubjectResult', SubjectResultSchema);

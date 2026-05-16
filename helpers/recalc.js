/* ═══════════════════════════════════════════════════════════
   EduPortal — helpers/recalc.js
   Standalone helper that recalculates SubjectResult totals.
   Kept separate to avoid circular dependency between
   routes/results.js and routes/testScores.js.
   ═══════════════════════════════════════════════════════════ */

const Result        = require('../models/Result');
const TestScore     = require('../models/TestScore');
const SubjectResult = require('../models/SubjectResult');
const User          = require('../models/User');

/* ── Grade + Remark helpers ───────────────────────────────── */
function calcGrade(total) {
  if (total >= 75) return 'A';
  if (total >= 65) return 'B';
  if (total >= 55) return 'C';
  if (total >= 45) return 'D';
  return 'F';
}
function calcRemark(total) {
  if (total >= 75) return 'Excellent';
  if (total >= 65) return 'Very Good';
  if (total >= 55) return 'Good';
  if (total >= 45) return 'Fair';
  return 'Fail';
}

/* ═══════════════════════════════════════════════════════════
   recalcSubjectResult
   Call this whenever:
     • A student submits an exam  (after grading)
     • A teacher marks theory     (after saving marks)
     • Admin releases exam result
     • A teacher saves a test score
     • Admin releases a test score

   It reads the latest exam result + test score for that
   student/subject/session/term and writes one merged
   SubjectResult document.
   ═══════════════════════════════════════════════════════════ */
async function recalcSubjectResult(studentId, subject, session, term) {
  try {
    if (!studentId || !subject) return;

    /* Latest exam result for this student + subject (any term) */
    const examResult = await Result.findOne({
      student : studentId,
      subject : subject
    }).sort({ createdAt: -1 });

    /* Test score for this specific session + term */
    const testScore = await TestScore.findOne({
      student : studentId,
      subject : subject,
      session : session || '',
      term    : term    || ''
    });

    /* Student info for display */
    const student = await User.findById(studentId).lean();

    /* Cap each component to its maximum */
    const objScore    = examResult ? Math.min(Number(examResult.objScore)    || 0, 20) : 0;
    const theoryScore = examResult ? Math.min(Number(examResult.theoryScore) || 0, 40) : 0;
    const tScore      = testScore  ? Math.min(Number(testScore.score)        || 0, 40) : 0;
    const total       = objScore + theoryScore + tScore;
    const grade       = calcGrade(total);
    const remark      = calcRemark(total);

    /* Both must be released for the SubjectResult to be released */
    const released = !!(
      examResult && examResult.released &&
      testScore  && testScore.released
    );

    const doc = {
      student       : studentId,
      studentName   : student ? `${student.firstName} ${student.lastName}` : '',
      class         : student ? (student.class || '') : '',
      subject,
      session       : session || '',
      term          : term    || '',
      objScore,
      theoryScore,
      testScore     : tScore,
      examResultId  : examResult ? examResult._id : null,
      testScoreId   : testScore  ? testScore._id  : null,
      totalScore    : total,
      grade,
      remark,
      released
    };

    await SubjectResult.findOneAndUpdate(
      { student: studentId, subject, session: session || '', term: term || '' },
      doc,
      { upsert: true, new: true }
    );

  } catch (err) {
    /* Log but never crash the calling request */
    console.error('[recalcSubjectResult] Error:', err.message);
  }
}

module.exports = { recalcSubjectResult };
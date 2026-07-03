/* ═══════════════════════════════════════════════════════════
   EduPortal — models/ReportCardComment.js
   Stores the admin's "performance comment" for a student's
   report card for a given session + term. Kept as its own
   small collection (rather than a field on SubjectResult)
   because a report card is ONE comment covering ALL subjects,
   not per-subject.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const ReportCardCommentSchema = new mongoose.Schema({
  schoolId: {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'School',
    required: true,
    index   : true,
  },
  student : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session : { type: String, required: true },
  term    : { type: String, required: true },
  comment : { type: String, default: '' },
  updatedBy: { type: String, default: '' },   // admin username who last edited
}, { timestamps: true });

/* One comment per student per session per term per school */
ReportCardCommentSchema.index(
  { schoolId: 1, student: 1, session: 1, term: 1 },
  { unique: true }
);

module.exports = mongoose.models.ReportCardComment || mongoose.model('ReportCardComment', ReportCardCommentSchema);

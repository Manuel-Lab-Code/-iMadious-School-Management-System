/* ═══════════════════════════════════════════════════════════
   EduPortal — models/Exam.js
   Supports both Objective (MCQ) and Theory questions,
   each with individual mark allocations.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

/* Objective question schema */
const ObjQuestionSchema = new mongoose.Schema({
  type: { type: String, default: 'objective' },
  text: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: Number, required: true },  // index of correct option
  marks: { type: Number, default: 1 }
});

/* Theory question schema */
const TheoryQuestionSchema = new mongoose.Schema({
  type: { type: String, default: 'theory' },
  text: { type: String, required: true },
  guide: { type: String, default: '' },       // marking guide (teacher only)
  marks: { type: Number, default: 5 }
});

const ExamSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  targetClass: { type: String, required: true },
  duration: { type: Number, required: true },  // minutes
  session: { type: String, default: '' },
  term: { type: String, default: '' },
  totalMarks: { type: Number, default: 0 },
  objMarks: { type: Number, default: 0 },
  theoryMarks: { type: Number, default: 0 },
  questions: [ObjQuestionSchema],         // Section A — Objective
  theoryQuestions: [TheoryQuestionSchema],       // Section B — Theory
  createdBy: { type: String },            // teacher username
  createdByName: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  expiresAt: { type: Date, default: null }, // optional deadline; null = no deadline
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);
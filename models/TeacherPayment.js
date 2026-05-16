const mongoose = require('mongoose');

const TeacherPaymentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  month: {
    type: String,  // Format: "YYYY-MM" (e.g., "2024-01")
    required: true
  },

  salary: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'delayed'],
    default: 'pending'
  },

  paidOn: {
    type: Date
  },

  notes: {
    type: String
  },

  paidBy: {
    type: String  // Admin username who processed payment
  },

}, { timestamps: true });

module.exports = mongoose.model('TeacherPayment', TeacherPaymentSchema);

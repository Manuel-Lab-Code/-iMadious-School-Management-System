const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total: { type: Number, default: 85000 },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  session: { type: String, default: '2025/2026' },
}, { timestamps: true });

module.exports = mongoose.model('Fee', FeeSchema);
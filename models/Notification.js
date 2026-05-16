/* ═══════════════════════════════════════════════════════════
   EduPortal — models/Notification.js
   Stores notifications per user in MongoDB
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  userId: { type: String, required: true },  // username or mongo _id string
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
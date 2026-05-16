// /* ═══════════════════════════════════════════════════════════
//    EduPortal — models/OTP.js
//    Stores one-time passwords for email verification.
//    Auto-expires after 10 minutes via MongoDB TTL index.
//    ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');

// const OTPSchema = new mongoose.Schema({
//   email     : { type: String, required: true },
//   otp       : { type: String, required: true },
//   role      : { type: String, enum: ['student','teacher'], required: true },
//   userData  : { type: Object },          // temp store of registration data
//   verified  : { type: Boolean, default: false },
//   createdAt : { type: Date, default: Date.now, expires: 600 } // 10-min TTL
// });

// module.exports = mongoose.model('OTP', OTPSchema);

/* ═══════════════════════════════════════════════════════════
   EduPortal — models/OTP.js
   Stores one-time passwords for email verification.
   Auto-expires after 10 minutes via MongoDB TTL index.

   The  mongoose.models.OTP || mongoose.model(...)  guard
   prevents the "Cannot overwrite model once compiled" error
   that occurs when multiple files require this module and
   server.js has already pre-registered it.
   ═══════════════════════════════════════════════════════════ */
// const mongoose = require('mongoose');

// const OTPSchema = new mongoose.Schema({
//   email    : { type: String, required: true },
//   otp      : { type: String, required: true },
//   role     : { type: String, enum: ['student', 'teacher'], required: true },
//   userData : { type: Object },           // temp store of registration data
//   verified : { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now, expires: 600 },  // 10-min TTL
// });

// module.exports = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);

/* ═══════════════════════════════════════════════════════════
   EduPortal — models/OTP.js
   Stores one-time passwords for email verification.
   Auto-expires after 10 minutes via MongoDB TTL index.

   The  mongoose.models.OTP || mongoose.model(...)  guard
   prevents the "Cannot overwrite model once compiled" error
   that occurs when multiple files require this module and
   server.js has already pre-registered it.
   ═══════════════════════════════════════════════════════════ */
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email    : { type: String, required: true },
  otp      : { type: String, required: true },
  role     : { type: String, enum: ['student', 'teacher'], required: true },
  userData : { type: Object },           // temp store of registration data
  verified : { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 600 },  // 10-min TTL
});

module.exports = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
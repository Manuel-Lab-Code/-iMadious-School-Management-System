// /* ═══════════════════════════════════════════════════════════
//    EduPortal — routes/notifications.js
//    ═══════════════════════════════════════════════════════════ */
// const express      = require('express');
// const router       = express.Router();
// const Notification = require('../models/Notification');
// const auth         = require('../middleware/auth');

// /* GET — fetch notifications for a user */
// router.get('/:userId', auth, async (req, res) => {
//   try {
//     const notifs = await Notification.find({ userId: req.params.userId })
//       .sort({ createdAt: -1 })
//       .limit(50);
//     res.json(notifs);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* POST — create a notification */
// router.post('/', auth, async (req, res) => {
//   try {
//     const notif = new Notification(req.body);
//     await notif.save();
//     res.json(notif);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* PUT — mark all as read for a user */
// router.put('/:userId/read-all', auth, async (req, res) => {
//   try {
//     await Notification.updateMany({ userId: req.params.userId }, { read: true });
//     res.json({ message: 'All marked as read.' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// /* DELETE — clear all notifications for a user */
// router.delete('/:userId', auth, async (req, res) => {
//   try {
//     await Notification.deleteMany({ userId: req.params.userId });
//     res.json({ message: 'Cleared.' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;

/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/notifications.js

   FIXED:
   1. Every query scoped to req.schoolId.
   2. Users can only access their own notifications (admins
      can access any within their school).
   3. schoolId always injected server-side on create.
   ═══════════════════════════════════════════════════════════ */
const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');
const auth         = require('../middleware/auth');
const schoolTenant = require('../middleware/schoolTenant');

router.use(auth);
router.use(schoolTenant);

/* Helper: allow admin access, or user accessing own notifications */
function canAccessUser(req, userId) {
  if (req.user.role === 'admin') return true;
  /* userId can be a username OR a mongo _id string */
  return String(req.user.id) === String(userId) || req.user.username === userId;
}

/* ── GET notifications for a user ─────────────────────────── */
router.get('/:userId', async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.userId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const notifs = await Notification.find({
      userId   : req.params.userId,
      schoolId : req.schoolId,
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) {
    console.error('[GET /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── POST create notification (admin or system) ───────────── */
router.post('/', async (req, res) => {
  try {
    /* Strip any client-supplied schoolId — inject server-side */
    delete req.body.schoolId;

    /* Only admin can create for arbitrary userIds; others may
       only create notifications for themselves.               */
    if (req.user.role !== 'admin' && !canAccessUser(req, req.body.userId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const notif = new Notification({ ...req.body, schoolId: req.schoolId });
    await notif.save();
    res.status(201).json(notif);
  } catch (err) {
    console.error('[POST /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT mark all read for a user ─────────────────────────── */
router.put('/:userId/read-all', async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.userId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    await Notification.updateMany(
      { userId: req.params.userId, schoolId: req.schoolId },
      { read: true }
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    console.error('[PUT /notifications/read-all]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE clear all notifications for a user ────────────── */
router.delete('/:userId', async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.userId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    await Notification.deleteMany({
      userId   : req.params.userId,
      schoolId : req.schoolId,
    });
    res.json({ message: 'Cleared.' });
  } catch (err) {
    console.error('[DELETE /notifications]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

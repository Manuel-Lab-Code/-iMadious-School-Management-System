/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/developer.js
   
   Developer/Super-Admin routes for managing multiple schools.
   These endpoints allow registering new schools, viewing school
   statistics, and managing school admins.
   
   ALL endpoints require DEVELOPER_KEY authentication.
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Import models
const School = mongoose.model('School');
const User = mongoose.model('User');
const Exam = mongoose.model('Exam');
const Fee = mongoose.model('Fee');

/* ── Middleware to verify developer key ──────────────────── */
const verifyDeveloperKey = (req, res, next) => {
    console.log('[MIDDLEWARE] Developer key verification started');
    const key = (req.headers['x-developer-key'] || req.body.developerKey || '').trim();
    const expectedKey = (process.env.DEVELOPER_KEY || '').trim();

    if (!expectedKey) {
        console.error('⚠️ DEVELOPER_KEY not configured in .env');
        return res.status(500).json({ error: 'Developer key not configured' });
    }

    if (!key) {
        console.warn('⚠️ No developer key provided in request');
        return res.status(403).json({ error: 'Developer key required' });
    }

    if (key !== expectedKey) {
        console.warn('⚠️ Invalid developer key provided');
        return res.status(403).json({ error: 'Invalid developer key' });
    }

    console.log('[MIDDLEWARE] ✅ Developer key authenticated, calling next()');
    next();
};

/* ════════════════════════════════════════════════════════════
   POST /api/developer/school/register
   
   Register a new school with admin credentials.
   Body: {
     name, email, phone, address, city, principalName,
     adminUsername, adminPassword
   }
   ════════════════════════════════════════════════════════════ */
router.post('/school/register', verifyDeveloperKey, async (req, res) => {
    try {
        console.log('[DEBUG] School register endpoint called');
        // Validation
        const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

        if (!name || !email || !phone || !address || !city || !principalName || !adminUsername || !adminPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Valid email required' });
        }

        if (adminPassword.length < 6) {
            return res.status(400).json({ error: 'Admin password must be at least 6 characters' });
        }

        console.log('[DEBUG] Validation passed, checking existing schools');
        // Check if school or admin username already exists
        const existingSchool = await School.findOne({ name });
        const existingAdmin = await School.findOne({ adminUsername });

        if (existingSchool) {
            return res.status(400).json({ error: 'School name already exists' });
        }

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin username already exists in system' });
        }

        console.log('[DEBUG] Creating new school');
        // Create new school (password hashed via pre-save hook)
        const school = new School({
            name,
            email,
            phone,
            address,
            city,
            principalName,
            adminUsername,
            adminPassword
        });

        console.log('[DEBUG] Saving school...');
        await school.save();

        res.status(201).json({
            message: 'School registered successfully',
            school: {
                id: school._id,
                name: school.name,
                email: school.email,
                adminUsername: school.adminUsername,
                createdAt: school.createdAt
            }
        });
    } catch (err) {
        console.error('Error registering school:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   GET /api/developer/schools
   
   List all registered schools with stats.
   ════════════════════════════════════════════════════════════ */
router.get('/schools', verifyDeveloperKey, async (req, res) => {
    try {
        const schools = await School.find({ isActive: true })
            .select('-adminPassword')
            .sort({ createdAt: -1 });

        // Get counts for each school
        const schoolsWithStats = await Promise.all(
            schools.map(async (school) => {
                const studentCount = await User.countDocuments({
                    schoolId: school._id,
                    role: 'student',
                    isActive: true
                });
                const teacherCount = await User.countDocuments({
                    schoolId: school._id,
                    role: 'teacher',
                    isActive: true
                });
                const examCount = await Exam.countDocuments({
                    schoolId: school._id
                });
                const feeCount = await Fee.countDocuments({
                    schoolId: school._id
                });

                return {
                    _id: school._id,
                    name: school.name,
                    email: school.email,
                    city: school.city,
                    adminUsername: school.adminUsername,
                    students: studentCount,
                    teachers: teacherCount,
                    exams: examCount,
                    fees: feeCount,
                    createdAt: school.createdAt
                };
            })
        );

        res.json({
            total: schoolsWithStats.length,
            schools: schoolsWithStats
        });
    } catch (err) {
        console.error('Error fetching schools:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   GET /api/developer/school/:schoolId
   
   Get details of a specific school.
   ════════════════════════════════════════════════════════════ */
router.get('/school/:schoolId', verifyDeveloperKey, async (req, res) => {
    try {
        const school = await School.findById(req.params.schoolId)
            .select('-adminPassword');

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const studentCount = await User.countDocuments({
            schoolId: school._id,
            role: 'student'
        });
        const teacherCount = await User.countDocuments({
            schoolId: school._id,
            role: 'teacher'
        });

        res.json({
            school,
            studentCount,
            teacherCount
        });
    } catch (err) {
        console.error('Error fetching school:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   PUT /api/developer/school/:schoolId
   
   Update school information.
   ════════════════════════════════════════════════════════════ */
router.put('/school/:schoolId', verifyDeveloperKey, async (req, res) => {
    try {
        const { name, email, phone, address, city, principalName, isActive } = req.body;

        const school = await School.findByIdAndUpdate(
            req.params.schoolId,
            {
                $set: {
                    name,
                    email,
                    phone,
                    address,
                    city,
                    principalName,
                    isActive,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-adminPassword');

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        res.json({
            message: 'School updated successfully',
            school
        });
    } catch (err) {
        console.error('Error updating school:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   DELETE /api/developer/school/:schoolId
   
   Deactivate a school (soft delete - keeps data but marks inactive).
   ════════════════════════════════════════════════════════════ */
router.delete('/school/:schoolId', verifyDeveloperKey, async (req, res) => {
    try {
        const school = await School.findByIdAndUpdate(
            req.params.schoolId,
            { $set: { isActive: false } },
            { new: true }
        ).select('-adminPassword');

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        res.json({
            message: 'School deactivated successfully',
            school
        });
    } catch (err) {
        console.error('Error deleting school:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   GET /api/developer/stats/overview
   
   Get system-wide statistics across all schools.
   ════════════════════════════════════════════════════════════ */
router.get('/stats/overview', verifyDeveloperKey, async (req, res) => {
    try {
        const totalSchools = await School.countDocuments({ isActive: true });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalExams = await Exam.countDocuments();
        const totalFees = await Fee.countDocuments();

        res.json({
            totalSchools,
            totalStudents,
            totalTeachers,
            totalExams,
            totalFees,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/* ════════════════════════════════════════════════════════════
   GET /api/developer/stats/overview
   
   Get system-wide statistics across all schools.
   ════════════════════════════════════════════════════════════ */
router.get('/stats/overview', verifyDeveloperKey, async (req, res) => {
    try {
        const totalSchools = await School.countDocuments({ isActive: true });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalExams = await Exam.countDocuments();
        const totalFees = await Fee.countDocuments();

        res.json({
            totalSchools,
            totalStudents,
            totalTeachers,
            totalExams,
            totalFees,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

module.exports = router;

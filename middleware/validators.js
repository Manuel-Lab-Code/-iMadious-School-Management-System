/* ═══════════════════════════════════════════════════════════
   middleware/validators.js
   
   Input validation rules using express-validator
   Re-usable validators for common fields and endpoints
   ═══════════════════════════════════════════════════════════ */

const { body, query, param, validationResult } = require('express-validator');

/* ── COMMON FIELD VALIDATORS ────────────────────────────────
   Reusable building blocks for complex validations          */

const fieldValidators = {
    // Authentication
    username: body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscore, and hyphen'),

    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),

    email: body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),

    // User fields
    firstName: body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be 2-50 characters'),

    lastName: body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be 2-50 characters'),

    phone: body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[0-9\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),

    gender: body('gender')
        .isIn(['male', 'female'])
        .withMessage('Gender must be either "male" or "female"'),

    // Exam fields
    examTitle: body('title')
        .trim()
        .notEmpty()
        .withMessage('Exam title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be 3-100 characters'),

    examDuration: body('duration')
        .isInt({ min: 1, max: 300 })
        .withMessage('Duration must be between 1 and 300 minutes'),

    examSubject: body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required'),

    // Score fields
    objScore: body('objScore')
        .optional({ checkFalsy: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('Objective score must be 0-100'),

    theoryScore: body('theoryScore')
        .optional({ checkFalsy: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('Theory score must be 0-100'),

    testScore: body('score')
        .optional({ checkFalsy: true })
        .isInt({ min: 0, max: 100 })
        .withMessage('Test score must be 0-100'),

    // Teacher fields
    schoolClass: body('class')
        .optional({ checkFalsy: true })
        .isIn(['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'])
        .withMessage('Invalid class level'),

    salary: body('salary')
        .optional({ checkFalsy: true })
        .isInt({ min: 0, max: 10000000 })
        .withMessage('Invalid salary amount'),

    // ID validation
    mongoId: (fieldName = 'id') => param(fieldName)
        .isMongoId()
        .withMessage(`Invalid ${fieldName} format`),

    // Query parameters
    pageQuery: query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be greater than 0')
        .toInt(),

    limitQuery: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be 1-100')
        .toInt(),
};

/* ── ENDPOINT-SPECIFIC VALIDATORS ───────────────────────────
   Complete middleware chains for specific endpoints         */

const validators = {
    // ── AUTHENTICATION ──────────────────────────────────────
    registerInitiate: [
        fieldValidators.email,
        fieldValidators.firstName,
        fieldValidators.lastName,
        body('role')
            .isIn(['student', 'teacher'])
            .withMessage('Role must be "student" or "teacher"'),
    ],

    registerVerifyOTP: [
        body('email')
            .isEmail()
            .withMessage('Invalid email'),
        body('otp')
            .trim()
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP must be 6 digits')
            .isNumeric()
            .withMessage('OTP must be numeric'),
        body('class')
            .optional({ checkFalsy: true })
            .isIn(['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'])
            .withMessage('Invalid class level'),
        body('department')
            .optional({ checkFalsy: true })
            .isIn(['SCIENCE', 'ART', 'COMMERCIAL'])
            .withMessage('Invalid department'),
        body('subjects')
            .optional({ checkFalsy: true })
            .isArray()
            .withMessage('Subjects must be an array'),
    ],

    login: [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        body('role')
            .isIn(['admin', 'student', 'teacher'])
            .withMessage('Invalid role'),
    ],

    changePassword: [
        body('oldPassword')
            .notEmpty()
            .withMessage('Old password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters'),
        body('confirmPassword')
            .custom((value, { req }) => value === req.body.newPassword)
            .withMessage('Passwords do not match'),
    ],

    adminResetPassword: [
        body('userId')
            .isMongoId()
            .withMessage('Invalid user ID format'),
    ],

    // ── EXAMS ──────────────────────────────────────────────
    createExam: [
        fieldValidators.examTitle,
        fieldValidators.examSubject,
        fieldValidators.examDuration,
        body('description')
            .optional({ checkFalsy: true })
            .isLength({ max: 500 })
            .withMessage('Description must be 500 characters or less'),
        body('totalScore')
            .optional({ checkFalsy: true })
            .isInt({ min: 1, max: 1000 })
            .withMessage('Total score must be 1-1000'),
    ],

    updateExamStatus: [
        fieldValidators.mongoId('examId'),
        body('status')
            .isIn(['pending', 'approved', 'rejected'])
            .withMessage('Invalid status'),
    ],

    // ── RESULTS ────────────────────────────────────────────
    createResult: [
        fieldValidators.mongoId('studentId'),
        fieldValidators.mongoId('examId'),
        fieldValidators.objScore,
        fieldValidators.theoryScore,
    ],

    updateResult: [
        fieldValidators.mongoId('id'),
        fieldValidators.objScore,
        fieldValidators.theoryScore,
        body('status')
            .optional({ checkFalsy: true })
            .isIn(['pending', 'released', 'withheld'])
            .withMessage('Invalid status'),
    ],

    // ── FEES ────────────────────────────────────────────────
    updateStudentFee: [
        fieldValidators.mongoId('studentId'),
        body('amount')
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('status')
            .optional({ checkFalsy: true })
            .isIn(['pending', 'partial', 'paid'])
            .withMessage('Invalid fee status'),
    ],

    // ── TEACHERS ────────────────────────────────────────────
    createTeacher: [
        fieldValidators.firstName,
        fieldValidators.lastName,
        fieldValidators.username,
        fieldValidators.email,
        body('subject')
            .trim()
            .notEmpty()
            .withMessage('Subject is required'),
        fieldValidators.gender,
        body('phone')
            .optional({ checkFalsy: true })
            .matches(/^[0-9\s\-\+\(\)]+$/)
            .withMessage('Invalid phone number'),
        fieldValidators.salary,
    ],

    updateTeacher: [
        fieldValidators.mongoId('id'),
        fieldValidators.firstName,
        fieldValidators.lastName,
        body('subject')
            .optional({ checkFalsy: true })
            .trim(),
        fieldValidators.salary,
        body('employmentDate')
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage('Invalid employment date format'),
    ],

    // ── STUDENTS ────────────────────────────────────────────
    createStudent: [
        fieldValidators.firstName,
        fieldValidators.lastName,
        fieldValidators.username,
        fieldValidators.email,
        fieldValidators.schoolClass,
        fieldValidators.gender,
        body('parentPhoneNumber')
            .optional({ checkFalsy: true })
            .matches(/^[0-9\s\-\+\(\)]+$/)
            .withMessage('Invalid parent phone number'),
    ],

    // ── QUERY VALIDATION ────────────────────────────────────
    listWithPagination: [
        fieldValidators.pageQuery,
        fieldValidators.limitQuery,
    ],

    subjectFilter: [
        query('subject')
            .optional({ checkFalsy: true })
            .trim(),
        query('session')
            .optional({ checkFalsy: true })
            .trim(),
        query('term')
            .optional({ checkFalsy: true })
            .isIn(['First Term', 'Second Term', 'Third Term'])
            .withMessage('Invalid term'),
        query('class')
            .optional({ checkFalsy: true })
            .isIn(['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'])
            .withMessage('Invalid class'),
    ],
};

/* ── VALIDATION ERROR HANDLER ───────────────────────────────
   Middleware to check for validation errors and format them */

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }

    next();
};

module.exports = {
    fieldValidators,
    validators,
    handleValidationErrors,
    validationResult
};

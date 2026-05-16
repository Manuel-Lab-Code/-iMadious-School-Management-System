/* ═══════════════════════════════════════════════════════════
   middleware/rateLimiter.js
   
   Rate limiting to prevent brute force attacks
   Apply to authentication and sensitive endpoints
   ═══════════════════════════════════════════════════════════ */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Login attempt limiter
 * Max 50 attempts per 15 minutes per IP (raised for testing)
 * In production, set max: 5
 */
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 attempts (for testing/development)
    message: 'Too many login attempts. Please try again after 5 minutes.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for localhost (development only)
        return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost';
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again after 5 minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * OTP initiation limiter
 * Max 3 attempts per hour per IP
 */
const otpInitiateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 attempts
    message: 'Too many OTP requests. Please try again after 10 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Please try again after 10 minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * OTP verification limiter
 * Max 20 attempts per 15 minutes (generous for testing/development)
 * Tracks by email address instead of IP for fairness
 */
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts (very generous for dev/testing)
    message: 'Too many OTP verification attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Track by email instead of IP for more accurate rate limiting
        return req.body?.email || ipKeyGenerator(req);
    },
    skip: (req) => {
        // Skip rate limiting for localhost (development only)
        return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost';
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many OTP verification attempts. Please try again after 15 minutes.',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

/**
 * General API limiter (stricter for all endpoints)
 * Max 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // 100 requests
    message: 'Too many requests. Please try again after 5 minutes.',
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Create a custom rate limiter with specific settings
 * 
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMinutes - Time window in minutes
 * @param {string} message - Custom error message
 * @returns {Function} Express middleware
 * 
 * @example
 * const customLimiter = createRateLimiter(10, 5, 'Max 10 requests per 5 minutes');
 * router.post('/custom', customLimiter, handler);
 */
function createRateLimiter(maxRequests, windowMinutes, message) {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message,
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
}

module.exports = {
    loginLimiter,
    otpInitiateLimiter,
    otpVerifyLimiter,
    generalLimiter,
    createRateLimiter
};

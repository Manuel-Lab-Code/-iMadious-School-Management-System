/* ═══════════════════════════════════════════════════════════
   middleware/requireRole.js
   
   Role-based authorization middleware
   Ensure only appropriate roles can access endpoints
   ═══════════════════════════════════════════════════════════ */

/**
 * Require specific role(s) to access endpoint
 * Should be used AFTER auth middleware
 * 
 * @param {string|string[]} roles - Allowed role(s) (admin, teacher, student)
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/:id', auth, requireRole('admin'), handler)
 * router.get('/dashboard', auth, requireRole(['student', 'teacher']), handler)
 */
function requireRole(roles) {
    // Normalize to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        // User should be attached by auth middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
}

/**
 * Require specific user ID to match authenticated user
 * Prevents users from accessing other users' data
 * 
 * @param {string} paramName - URL parameter name containing the ID (default: 'id')
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/:studentId/dashboard', auth, requireUserMatch('studentId'), handler)
 */
function requireUserMatch(paramName = 'id') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const requestedUserId = req.params[paramName];
        const authenticatedUserId = req.user.id;

        // Allow admins to access any user's data
        if (req.user.role === 'admin') {
            return next();
        }

        // For other roles, require exact match
        if (requestedUserId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
}

module.exports = {
    requireRole,
    requireUserMatch
};

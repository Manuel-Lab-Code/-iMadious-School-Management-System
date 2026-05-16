/* ═══════════════════════════════════════════════════════════
   EduPortal — public/role-guard.js
   
   Enforces role-based access control across pages.
   Each role can only access their own page.
   ═══════════════════════════════════════════════════════════ */

/**
 * Get the required role for current page
 */
function getRequiredRole() {
    const path = window.location.pathname;
    if (path.includes('admin.html') || path.includes('admin-')) return 'admin';
    if (path.includes('teacher.html')) return 'teacher';
    if (path.includes('student.html')) return 'student';
    if (path.includes('developer.html')) return 'developer';
    return null;
}

/**
 * Get JWT token from localStorage
 */
function getToken() {
    return localStorage.getItem('edu_token') || localStorage.getItem('token');
 */
    function parseToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (err) {
            console.error('Error parsing token:', err);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    function isTokenExpired(token) {
        const data = parseToken(token);
        if (!data || !data.exp) return true;

        const expirationTime = data.exp * 1000; // Convert to milliseconds
        return Date.now() >= expirationTime;
    }

    /**
     * Verify user has access to current page
     */
    function verifyPageAccess() {
        const requiredRole = getRequiredRole();

        // No role required for public pages (login, register, developer)
        if (!requiredRole || requiredRole === 'developer') {
            return true;
        }

        const token = getToken();

        // No token - redirect to login
        if (!token) {
            console.warn('No authentication token. Redirecting to login...');
            window.location.href = '/index.html';
            return false;
        }

        // Token expired - redirect to login
        if (isTokenExpired(token)) {
            console.warn('Token expired. Redirecting to login...');
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return false;
        }

        const userData = parseToken(token);

        if (!userData) {
            console.warn('Invalid token. Redirecting to login...');
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return false;
        }

        // Check if user has correct role for this page
        if (userData.role !== requiredRole) {
            console.warn(`Access denied. You are a ${userData.role}, but this page requires ${requiredRole}.`);
            redirectToDashboard(userData.role);
            return false;
        }

        return true;
    }

    /**
     * Redirect user to their appropriate dashboard
     */
    function redirectToDashboard(role) {
        const dashboards = {
            'admin': '/admin/',
            'teacher': '/teacher/',
            'student': '/student/'
            window.location.href = dashboard;
        } else {
            console.log('Redirecting to login...');
        window.location.href = '/index.html';
    }
}

/**
 * Perform role-based redirect after successful login
 */
function redirectAfterLogin(role) {
    redirectToDashboard(role);
}

/**
 * Logout and clear token
 */
function logout() {
    localStorage.removeItem('edu_token');

    /**
     * Get current user from token
     */
    function getCurrentUser() {
        const token = getToken();
        if (!token || isTokenExpired(token)) {
            return null;
        }
        return parseToken(token);
    }

    // Run access verification when page loads (for protected pages)
    document.addEventListener('DOMContentLoaded', function () {
        const requiredRole = getRequiredRole();

        // Only verify for protected pages (not login, register, developer, or index)
        if (requiredRole && requiredRole !== 'developer') {
            verifyPageAccess();
        }
    });

    // Also verify on page focus (if user clears token in another tab)
    window.addEventListener('focus', function () {
        const requiredRole = getRequiredRole();
        if (requiredRole && requiredRole !== 'developer') {
            const token = getToken();
            if (!token || isTokenExpired(token)) {
                verifyPageAccess();
            }
        }
    });

# EduPortal Role-Based Page Separation

## Overview
Your system now has **completely separated pages** for Admin, Teachers, and Students with automatic role-based access control.

---

## How It Works

### 🔐 Role-Guard System
Each protected page includes `role-guard.js` which:

1. **Checks Authentication** - Verifies user has valid JWT token
2. **Checks Token Expiry** - Redirects to login if token expired
3. **Validates Role** - Ensures user has correct role for page
4. **Prevents Cross-Access** - Admin can't access teacher/student pages, etc.

---

## User Journeys

### Student Workflow
```
1. Student visits http://localhost:5000/index.html (Login)
2. Fills in credentials (role: "student")
3. Submits login → API validates credentials
4. Token received → Stored as 'edu_token'
5. Redirected to http://localhost:5000/student/
6. role-guard.js verifies: token ✓, role = student ✓
7. Student dashboard loads
8. If student tries to access /admin/
   → role-guard catches it
   → Redirects back to /student/
```

### Teacher Workflow
```
1. Teacher visits http://localhost:5000/index.html (Login)
2. Fills in credentials (role: "teacher")
3. Submits login → API validates credentials
4. Token received → Stored as 'edu_token'
5. Redirected to http://localhost:5000/teacher/
6. role-guard.js verifies: token ✓, role = teacher ✓
7. Teacher dashboard loads
8. If teacher tries to access /student/
   → role-guard catches it
   → Redirects back to /teacher/
```

### Admin Workflow
```
1. Admin visits http://localhost:5000/index.html (Login)
2. Fills in credentials (role: "admin")
3. Submits login → API validates credentials
4. Token received → Stored as 'edu_token'
5. Redirected to http://localhost:5000/admin/
6. role-guard.js verifies: token ✓, role = admin ✓
7. Admin dashboard loads
8. If admin tries to access /teacher/
   → role-guard catches it
   → Redirects back to /admin/
```

---

## Page Structure

### Public Pages (No Role Check)
- ✅ `/index.html` - Login page
- ✅ `/register.html` - Registration page
- ✅ `/developer.html` - Developer panel (requires developer key, not role)

### Protected Pages (Role-Based Access)
- 🛡️ `/admin/` - **Admin only** - Admin Portal
- 👩‍🏫 `/teacher/` - **Teacher only** - Teacher Portal
- 🎒 `/student/` - **Student only** - Student Portal

### Admin Sub-Pages (Admin only)
- 🛡️ `/admin-approvals.html` - Approve/Reject registrations
- 🛡️ `/admin-students.html` - Manage students
- 🛡️ `/admin-teachers.html` - Manage teachers

---

## Security Features

### 1. Token Validation
```javascript
// Before showing any protected content:
- Get token from localStorage
- Check if token is valid JWT
- Check if token is not expired
- Check if user role matches page role
```

### 2. Automatic Logout on Expiry
```javascript
// If token expires:
- Existing page becomes unusable
- Redirect to login on focus
- User must log in again
```

### 3. Role Validation
```javascript
// If wrong role tries to access page:
- User immediately redirected to their dashboard
- No content from other role exposed
- Logged in console for security auditing
```

### 4. Token Storage
```javascript
// Safe token handling:
- Stored in localStorage as 'edu_token'
- Cleared on logout
- Cleared on token expiry
- Validated on every page load
```

---

## How to Test Role-Based Separation

### Test 1: Try to Access Wrong Page
1. Login as **Student**
2. Go directly to: `http://localhost:5000/admin/`
3. **Expected:** Auto-redirects to `/student/`

### Test 2: Try to Access Without Login
1. Go directly to: `http://localhost:5000/student/` (without logging in)
2. **Expected:** Auto-redirects to `/index.html` (login)

### Test 3: Check After Token Expiry
1. Login as **Teacher**
2. Wait for token to expire (8 hours default)
3. Try to perform action on `/teacher/`
4. **Expected:** Auto-redirects to login

### Test 4: Access from Multiple Tabs
1. Open `/admin/` in **Tab 1** as Admin
2. Clear tokens from localStorage in **Tab 2**
3. Go back to **Tab 1**, click something
4. **Expected:** Detects missing token, redirects to login

---

## File Changes Made

### New Files
- ✅ `public/role-guard.js` - Role-based access control system

### Modified Files
- ✅ `public/admin/` - Admin portal with `role-guard.js` script
- ✅ `public/student/` - Student portal with `role-guard.js` script
- ✅ `public/teacher/` - Teacher portal with `role-guard.js` script
- ✅ `public/script.js` - Updated logout to clear tokens

---

## Access Control Flow

```
User Visits Page
    ↓
role-guard.js Loads
    ↓
Check: Is page protected?
    ├─ NO (public page) → Allow access
    └─ YES → Continue verification
         ↓
    Check: Does token exist?
        ├─ NO → Redirect to /index.html
        └─ YES → Continue
             ↓
    Check: Is token expired?
        ├─ YES → Logout, redirect to /index.html
        └─ NO → Continue
             ↓
    Check: Does role match page?
        ├─ NO → Redirect to user's dashboard
        └─ YES → Allow access ✓
```

---

## What Users See

### Admin Sees:
- ✅ Admin Portal (`/admin/`)
- ✅ Admin Sub-Pages (approvals, students, teachers)
- ❌ Cannot see Student Portal
- ❌ Cannot see Teacher Portal
- ✅ Can access Developer Panel (if developer key provided)

### Teacher Sees:
- ✅ Teacher Portal (`/teacher/`)
- ❌ Cannot see Admin Portal
- ❌ Cannot see Student Portal
- ✅ Can access their own profile and results

### Student Sees:
- ✅ Student Portal (`/student/`)
- ❌ Cannot see Admin Portal
- ❌ Cannot see Teacher Portal
- ✅ Can access their dashboard and results

---

## Logout Behavior

When user clicks **Logout**:
1. Confirmation dialog appears
2. After confirmation:
   - Session cleared
   - `edu_token` removed from localStorage
   - `token` removed from localStorage
   - Redirected to `/index.html` (login)
3. Must log in again to access any protected page

---

## Troubleshooting

### "Redirected immediately after login"
**Cause:** Role mismatch or invalid token
**Solution:** Check browser console for warnings, verify JWT token is valid

### "Can access other roles' pages"
**Cause:** role-guard.js not loaded or token validation issue
**Solution:** Check that role-guard.js is included before script.js, verify localStorage has 'edu_token'

### "Logout doesn't work"
**Cause:** logout() function not clearing all tokens
**Solution:** Ensure both `edu_token` and `token` are removed in logout

### "Token validation errors in console"
**Cause:** Malformed JWT or wrong localStorage key
**Solution:** Verify token is valid JWT, check token key is 'edu_token'

---

## Advanced Configuration

### Customize Logout Messages
Edit `role-guard.js` lines 42-44:
```javascript
console.warn('No authentication token. Redirecting to login...');
console.warn('Token expired. Redirecting to login...');
console.warn('Access denied. You are a ' + role + '...');
```

### Change Token Name
If you want different token name, update:
1. `role-guard.js` line 36-37
2. `script.js` line 288

### Extend Role System
Add new role:
1. Create new page: `newrole.html`
2. Add in `role-guard.js` line 11-13
3. Add in `script.js` line 290
4. Script will automatically protect it

---

## Summary

Your system now has:
- ✅ **Complete page separation** - Each role has own pages
- ✅ **Automatic redirects** - Wrong role? Redirected instantly
- ✅ **Token validation** - Expired tokens auto-logout
- ✅ **Cross-tab security** - Detects logout in other tabs
- ✅ **Console logging** - Tracks all access attempts

Users see **only** their appropriate pages and dashboards! 🎓

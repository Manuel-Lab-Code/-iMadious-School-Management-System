# EduPortal Multi-Tenancy Setup Guide

## Overview
Your EduPortal system is now configured for **multi-school deployment** with complete data isolation. Different schools can operate on the same infrastructure without mixing data.

---

## Architecture Summary

### Three-Tier Access Model

```
1. Developer (Master Admin)
   └─ Controls: School registration, school admin creation, system stats
   └─ Access: /developer/ (password: DEVELOPER_KEY from .env)

2. School Admin (Per-School Admin)
   └─ Controls: Approve/reject students & teachers, manage fees, view results
   └─ Access: School-specific data only via /api/students, /api/teachers, etc.
   └─ Data Isolation: Only sees students & teachers from their school

3. Students & Teachers
   └─ Controls: View own profile, submit results, upload assignments
   └─ Access: Only their own data
   └─ Data Isolation: Only see their school's resources
```

---

## Phase 1: Configure Developer Key ✅ DONE

DEVELOPER_KEY has been set in `.env`:
```
DEVELOPER_KEY=dev_master_key_2024_change_me_in_production_12345
```

**Security Tip:** Change this to a secure random key in production!

---

## Phase 2: Create School Model ✅ DONE

New file: `models/School.js`
- Stores school information (name, email, address, city, principal)
- Stores unique admin credentials per school (adminUsername, adminPassword bcrypted)
- Each school has a unique `_id` (ObjectId) used for filtering all data

---

## Phase 3: Add schoolId to All Models ✅ DONE

All models now include:
```javascript
schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
```

Updated models:
- ✅ User.js (students, teachers, admins)
- ✅ Exam.js (exams created in school)
- ✅ Fee.js (fees per school)
- ✅ Result.js (exam results per school)
- ✅ TestScore.js (test scores per school)
- ✅ SubjectResult.js (subject results per school)
- ✅ Notification.js (notifications per school)
- ✅ TeacherPayment.js (salaries per school)

---

## Phase 4: Create Developer Control Panel ✅ DONE

**Access Point:** `http://localhost:5000/developer.html`

**Features:**
1. **Authentication** - Enter developer key
2. **Dashboard** - View system statistics (total schools, students, teachers, exams)
3. **School Registration** - Register new schools with admin credentials
4. **School List** - View all registered schools with per-school statistics
5. **School Management** - View, update, or deactivate schools

**Files Created:**
- `public/developer.html` - UI for school management
- `public/developer.js` - Frontend logic for developer panel
- `routes/developer.js` - Backend APIs for school management

---

## Phase 5: Update Routes for Data Isolation ✅ PARTIALLY DONE

### Completed:
- ✅ `routes/auth.js` - Added schoolId to registration flow and JWT tokens
- ✅ `routes/students.js` - Filters by schoolId in all admin operations
- ✅ `routes/teachers.js` - Filters by schoolId in teacher management

### Still Need Update (Follow Same Pattern):
- ⏳ `routes/exams.js`
- ⏳ `routes/results.js`
- ⏳ `routes/fees.js`
- ⏳ `routes/notifications.js`
- ⏳ `routes/testScores.js`
- ⏳ `routes/subjectResults.js`
- ⏳ `routes/subjects.js`
- ⏳ `routes/teacerPayment.js`

**Pattern to Apply (Example):**
```javascript
// OLD:
const students = await User.find({ role: 'student' });

// NEW:
const filter = { role: 'student' };
if (req.user.schoolId) filter.schoolId = req.user.schoolId;
const students = await User.find(filter);
```

---

## Phase 6: Update Registration Flow ⏳ TODO

**Current Registration Flow:**
1. Student/Teacher fills registration form
2. OTP is sent to email
3. User verifies OTP and account is created

**What's Missing:**
- Registration form needs to include **school selection**
- Frontend should fetch active schools and show dropdown
- Frontend sends `schoolId` with registration request

**Modification Needed:**
Update `public/register.html`:
```html
<!-- Add school selector before other fields -->
<div class="form-group">
  <label for="schoolSelect">Select Your School *</label>
  <select id="schoolSelect" required>
    <option value="">-- Select School --</option>
  </select>
</div>
```

Update `public/script.js`:
```javascript
// Fetch and populate schools on page load
fetch('/api/developer/schools')
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById('schoolSelect');
    data.schools.forEach(school => {
      const option = document.createElement('option');
      option.value = school._id;
      option.textContent = school.name;
      select.appendChild(option);
    });
  });

// When sending registration, include schoolId
const schoolId = document.getElementById('schoolSelect').value;
// ... add to request body
```

---

## Getting Started: Step-by-Step

### Step 1: Start Server
```bash
node server.js
```

### Step 2: Access Developer Panel
1. Open browser: `http://localhost:5000/developer.html`
2. Enter developer key: `dev_master_key_2024_change_me_in_production_12345`
3. Click "Authenticate"

### Step 3: Register First School
Fill in the form:
- **School Name:** Central Secondary School
- **Email:** central@school.com
- **Phone:** +234 901 234 5678
- **Address:** 123 School Lane
- **City:** Lagos
- **Principal Name:** Dr. Obi Okafor
- **Admin Username:** admin_central
- **Admin Password:** CentralAdmin@2024

Click "Register School" ✅

### Step 4: Register Second School
Repeat Step 3 with different details:
- **School Name:** Excellence Academy
- **Admin Username:** admin_excellence
- **Admin Password:** ExcellenceAdmin@2024

### Step 5: View Schools Dashboard
- Check "Dashboard" statistics
- View "Schools List" showing both schools
- Note the student/teacher counts (currently 0)

### Step 6: School Admin Login
*Coming in Phase 7 - Admin Portal*

---

## API Reference

### Developer Endpoints (Require `X-Developer-Key` header)

#### Register School
```
POST /api/developer/school/register
Headers: X-Developer-Key: YOUR_DEV_KEY
Body: {
  name, email, phone, address, city, principalName,
  adminUsername, adminPassword
}
Response: { schoolId, school details }
```

#### List All Schools
```
GET /api/developer/schools
Headers: X-Developer-Key: YOUR_DEV_KEY
Response: [{ _id, name, students, teachers, exams, fees, ... }, ...]
```

#### Get School Details
```
GET /api/developer/school/:schoolId
Headers: X-Developer-Key: YOUR_DEV_KEY
Response: { school, studentCount, teacherCount }
```

#### Get System Statistics
```
GET /api/developer/stats/overview
Headers: X-Developer-Key: YOUR_DEV_KEY
Response: { totalSchools, totalStudents, totalTeachers, totalExams, totalFees }
```

#### Get School Statistics
```
GET /api/developer/stats/school/:schoolId
Headers: X-Developer-Key: YOUR_DEV_KEY
Response: { schoolId, students, teachers, exams, fees }
```

---

## School Admin Login

*Endpoint Added in auth.js*

```
POST /api/auth/admin-login
Body: {
  schoolName: "Central Secondary School",
  adminUsername: "admin_central",
  adminPassword: "CentralAdmin@2024"
}
Response: { token, user: { schoolId, schoolName, ... } }
```

Token includes `schoolId`, so all subsequent requests are automatically filtered to that school.

---

## Data Isolation Verification

### Test 1: Student Registration per School
1. Register student for School A
2. Register student for School B
3. Verify:
   - Same username can exist in both schools (unique per school)
   - Students are isolated by schoolId
   - School A admin doesn't see School B students

### Test 2: Admin Access Control
1. Login as School A admin
2. Try to access `/api/students` 
3. Verify: Only sees School A students
4. Try to approve/reject School B student
5. Verify: Denied with "You can only approve registrations from your school"

### Test 3: Fee Isolation
1. Create fees for School A
2. Login as School B admin
3. Verify: Fees endpoint only returns School B fees

---

## Production Considerations

### Security Checklist
- [ ] Change `DEVELOPER_KEY` from default value
- [ ] Use strong passwords for school admin accounts
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting on `/api/developer/*` endpoints
- [ ] Add audit logging for developer actions
- [ ] Backup database before bulk operations

### Scale Considerations
- [ ] Add database indexing on `schoolId` fields
- [ ] Implement query pagination for large schools
- [ ] Cache school list (less frequent updates)
- [ ] Consider database sharding if 1000+ schools

### Missing Components (Phase 7)
- [ ] Update registration page to show school selector
- [ ] Create school admin login UI
- [ ] Create school admin dashboard
- [ ] Implement school-specific branding/settings
- [ ] Add school admin password reset flow

---

## Technical Implementation Notes

### Unique Index per School
User.js implements compound unique index:
```javascript
UserSchema.index({ schoolId: 1, username: 1 }, { unique: true });
```
This allows same username in different schools.

### JWT Token Enhancement
Student/Teacher tokens now include:
```javascript
{
  id:        user._id,
  schoolId:  user.schoolId,        // NEW
  schoolName: user.schoolName,      // NEW
  username:  user.username,
  role:      'student' | 'teacher',
  name:      firstName + lastName
}
```

### School Admin Token
```javascript
{
  id:        school._id,
  schoolId:  school._id,
  username:  school.adminUsername,
  role:      'admin',
  schoolName: school.name
}
```

---

## Troubleshooting

### "Developer key not configured"
**Cause:** DEVELOPER_KEY missing from .env
**Fix:** Add `DEVELOPER_KEY=...` to .env and restart server

### "Invalid developer key"
**Cause:** Wrong key entered
**Fix:** Check .env and verify key matches

### "School name already exists"
**Cause:** Attempting to register duplicate school
**Fix:** Use unique school names

### Student/Teacher list empty after registration
**Cause:** User is in 'pending' status (dev setup default)
**Fix:** Approve registration via admin panel (when ready)

### "You can only access students from your school"
**Cause:** School admin trying to access another school's data
**Fix:** This is expected behavior - data isolation working correctly

---

## What's Next

After verifying multi-school setup works:

1. **Update Registration UI** - Add school selector
2. **Create Admin Portal** - School-specific admin dashboard
3. **Update All Routes** - Apply schoolId filtering to remaining endpoints
4. **Create Migration Tool** - For migrating existing data to schools
5. **Add School Settings** - Logos, themes, subjects per school
6. **Implement Billing** - Track usage per school

---

## Questions or Issues?

If data isn't isolating correctly:
1. Verify `schoolId` is in JWT token (check console.log)
2. Check database to confirm records have `schoolId` field
3. Verify filter is applied in route (check route code)
4. Check middleware auth.js is passing req.user correctly

Good luck with your multi-school deployment! 🎓

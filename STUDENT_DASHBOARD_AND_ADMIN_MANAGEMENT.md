# Student Dashboard & Admin Profile Management

## Overview

This document covers:
1. **Student Dashboard** - Students can view their own profile and assigned subjects
2. **Admin Student Management** - Admins can view, edit, and manage all student profiles

---

## Student Dashboard

### Endpoint: Get Student Dashboard
**Method:** `GET /api/students/dashboard`  
**Authorization:** Required (Student token)  
**Access:** Only logged-in students can access their own dashboard

### Response Example (JSS Student)

```json
{
  "profile": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@student.school",
    "class": "JSS1",
    "department": null,
    "parentPhoneNumber": "+234 803 123 4567",
    "role": "student",
    "isActive": true,
    "createdAt": "2026-04-06T10:30:00Z"
  },
  "subjects": {
    "list": [
      "English Studies",
      "Mathematics",
      "Basic Science",
      "Basic Technology",
      "Social Studies"
    ],
    "count": 5,
    "isDepartmentBased": false,
    "classLevel": "JSS1"
  },
  "fees": {
    "total": 85000,
    "paid": 0,
    "pending": 85000,
    "status": "unpaid"
  }
}
```

### Response Example (SSS Student)

```json
{
  "profile": {
    "id": "507f1f77bcf86cd799439012",
    "firstName": "Jane",
    "lastName": "Smith",
    "username": "janesmith",
    "email": "jane@student.school",
    "class": "SSS1",
    "department": "SCIENCE",
    "parentPhoneNumber": "+234 803 987 6543",
    "role": "student",
    "isActive": true,
    "createdAt": "2026-04-06T10:30:00Z"
  },
  "subjects": {
    "list": [
      "English Language",
      "Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Further Math",
      "Agric",
      "ICT",
      "Civic Education"
    ],
    "count": 9,
    "isDepartmentBased": true,
    "classLevel": "SSS1"
  },
  "fees": {
    "total": 85000,
    "paid": 0,
    "pending": 85000,
    "status": "unpaid"
  }
}
```

### Key Information Displayed

- **Profile**: Basic student information including parent phone number
- **Subjects**: Complete list of subjects with count and department info
- **Fees**: Fee details including total, paid amount, pending, and status

---

## Admin Student Management

### 1. Get All Students (Admin Only)
**Method:** `GET /api/students`  
**Authorization:** Required (Admin token)  
**Response:** Array of all student profiles (password excluded)

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@student.school",
    "role": "student",
    "class": "JSS1",
    "department": null,
    "subjects": [
      "English Studies",
      "Mathematics",
      "Basic Science"
    ],
    "parentPhoneNumber": "+234 803 123 4567",
    "isActive": true,
    "createdAt": "2026-04-06T10:30:00Z",
    "updatedAt": "2026-04-06T10:30:00Z"
  },
  ...
]
```

### 2. Get Specific Student Profile (Admin Only)
**Method:** `GET /api/students/:id`  
**Authorization:** Required (Admin token)  
**Parameters:**
- `id` (path): MongoDB ID of the student

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@student.school",
  "role": "student",
  "class": "JSS1",
  "department": null,
  "subjects": ["English Studies", "Mathematics", "Basic Science"],
  "parentPhoneNumber": "+234 803 123 4567",
  "isActive": true,
  "fee": {
    "_id": "607f1f77bcf86cd799439020",
    "student": "507f1f77bcf86cd799439011",
    "total": 85000,
    "paid": 0,
    "status": "unpaid",
    "createdAt": "2026-04-06T10:30:00Z"
  }
}
```

### 3. Edit Student Profile (Admin Only)
**Method:** `PUT /api/students/:id/admin-edit`  
**Authorization:** Required (Admin token)  
**Parameters:**
- `id` (path): MongoDB ID of the student

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe_updated",
  "email": "john.updated@student.school",
  "password": "NewPassword123!",
  "class": "JSS2",
  "department": null,
  "parentPhoneNumber": "+234 803 999 8888",
  "paymentStatus": "partial"
}
```

#### Editable Fields:
1. **firstName** - Student's first name
2. **lastName** - Student's last name
3. **username** - Unique username (checked for duplicates)
4. **email** - Email address (checked for duplicates)
5. **password** - Password (will be hashed automatically)
6. **class** - Class level (JSS1-JSS3 or SSS1-SSS3)
7. **department** - Department for SSS students (SCIENCE, ART, COMMERCIAL)
8. **parentPhoneNumber** - Parent/Guardian phone number
9. **paymentStatus** - Fee payment status (unpaid, partial, paid)

#### Rules:

- **Username & Email**: Must be unique. System checks for duplicates.
- **Class Change - JSS to JSS**: Subjects remain manageable
- **Class Change - JSS to SSS**: Department becomes required, subjects auto-assign
- **Class Change - SSS to JSS**: Department is cleared, subjects can be manually set
- **Department Change**: Only for SSS students. Subjects auto-populate from new department
- **Payment Status**: Must be one of: `unpaid`, `partial`, or `paid`
- **Password**: Automatically hashed before storage

#### Success Response:
```json
{
  "message": "Student profile updated successfully.",
  "student": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe_updated",
    "email": "john.updated@student.school",
    "role": "student",
    "class": "JSS2",
    "department": null,
    "subjects": [],
    "parentPhoneNumber": "+234 803 999 8888",
    "isActive": true
  }
}
```

#### Error Responses:

**Non-Admin User:**
```json
{
  "message": "Admin access only."
}
```

**Duplicate Username:**
```json
{
  "message": "Username already taken."
}
```

**Duplicate Email:**
```json
{
  "message": "Email already in use by another student."
}
```

**Missing Department for SSS:**
```json
{
  "message": "SSS1 requires a department (SCIENCE, ART, or COMMERCIAL)."
}
```

**Department for JSS Student:**
```json
{
  "message": "JSS1 students cannot have a department."
}
```

**Invalid Payment Status:**
```json
{
  "message": "Invalid payment status. Use: unpaid, partial, or paid"
}
```

---

## Complete Admin Edit Scenarios

### Scenario 1: Update Basic Information Only
Admin wants to update student's contact info

```javascript
// Request
PUT /api/students/607f1f77bcf86cd799439011/admin-edit
{
  "email": "newemail@school.com",
  "parentPhoneNumber": "+234 805 123 4567"
}

// Response
{
  "message": "Student profile updated successfully.",
  "student": {
    "email": "newemail@school.com",
    "parentPhoneNumber": "+234 805 123 4567",
    // ...other fields unchanged
  }
}
```

### Scenario 2: Promote JSS Student to SSS
Admin promotes a JSS1 student to SSS1 with Science department

```javascript
// Request
PUT /api/students/607f1f77bcf86cd799439011/admin-edit
{
  "class": "SSS1",
  "department": "SCIENCE"
}

// Response
{
  "message": "Student profile updated successfully.",
  "student": {
    "class": "SSS1",
    "department": "SCIENCE",
    "subjects": [
      "English Language",
      "Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Further Math",
      "Agric",
      "ICT",
      "Civic Education"
    ]
    // ...subjects auto-populated
  }
}
```

### Scenario 3: Change Department for SSS Student
Admin changes a Science student to Commercial department

```javascript
// Request
PUT /api/students/607f1f77bcf86cd799439012/admin-edit
{
  "department": "COMMERCIAL"
}

// Response
{
  "message": "Student profile updated successfully.",
  "student": {
    "department": "COMMERCIAL",
    "subjects": [
      "English Language",
      "Mathematics",
      "Accounting",
      "Commerce",
      "Economics",
      "ICT",
      "CRS or IRS",
      "Civic Education",
      "Marketing"
    ]
    // ...subjects updated to Commercial department
  }
}
```

### Scenario 4: Update Fee Status
Admin marks student fee as partially paid

```javascript
// Request
PUT /api/students/607f1f77bcf86cd799439011/admin-edit
{
  "paymentStatus": "partial"
}

// Response (includes updated fee info)
{
  "message": "Student profile updated successfully.",
  "student": {
    // ...student data
  }
  // Fee record updated separately in database
}
```

### Scenario 5: Complete Profile Update
Admin updates all editable fields at once

```javascript
// Request
PUT /api/students/607f1f77bcf86cd799439011/admin-edit
{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "username": "jonathan_smith",
  "email": "jonathan.smith@school.com",
  "password": "SecureNewPassword123!",
  "class": "SSS2",
  "department": "ART",
  "parentPhoneNumber": "+234 809 999 8888",
  "paymentStatus": "paid"
}

// Response
{
  "message": "Student profile updated successfully.",
  "student": {
    "firstName": "Jonathan",
    "lastName": "Smith",
    "username": "jonathan_smith",
    "email": "jonathan.smith@school.com",
    "class": "SSS2",
    "department": "ART",
    "subjects": [...ART subjects],
    "parentPhoneNumber": "+234 809 999 8888",
    "password": "[hashed]"
  }
}
```

---

## Database Schema

### User Model Updates
```javascript
{
  firstName: String,
  lastName: String,
  username: String (unique),
  password: String,
  email: String,
  role: String (enum: ['student','teacher','admin']),
  
  // For students
  class: String,
  department: String,           // SCIENCE, ART, COMMERCIAL (SSS only)
  subjects: [String],
  parentPhoneNumber: String,    // NEW FIELD
  
  // For teachers
  subject: String,
  
  isActive: Boolean,
  timestamps: true
}
```

### Fee Model (Related)
```javascript
{
  student: ObjectId (ref: User),
  total: Number,        // Default: 85000
  paid: Number,         // Default: 0
  status: String,       // unpaid, partial, paid
  timestamps: true
}
```

---

## Frontend Implementation

### 1. Student Dashboard Widget
```javascript
async function loadStudentDashboard(token) {
  const response = await fetch('/api/students/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Display profile
  document.getElementById('studentName').textContent = 
    `${data.profile.firstName} ${data.profile.lastName}`;
  
  // Display subjects
  const subjectList = data.subjects.list.join(', ');
  document.getElementById('subjects').textContent = subjectList;
  document.getElementById('subjectCount').textContent = data.subjects.count;
  
  // Display department (if SSS)
  if (data.subjects.isDepartmentBased) {
    document.getElementById('department').textContent = data.profile.department;
  }
  
  // Display fee status
  document.getElementById('feeStatus').textContent = data.fees.status;
  document.getElementById('feePending').textContent = data.fees.pending;
}
```

### 2. Admin Edit Student Form
```javascript
async function editStudentProfile(token, studentId, updates) {
  const response = await fetch(`/api/students/${studentId}/admin-edit`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    alert(`Error: ${error.message}`);
    return false;
  }
  
  const result = await response.json();
  alert(result.message);
  return true;
}

// Usage
const updates = {
  class: document.getElementById('classSelect').value,
  department: document.getElementById('deptSelect').value,
  parentPhoneNumber: document.getElementById('phoneInput').value,
  paymentStatus: document.getElementById('statusSelect').value
};

editStudentProfile(token, studentId, updates);
```

---

## API Testing with cURL

### Get Student Dashboard
```bash
curl -X GET http://localhost:5000/api/students/dashboard \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get All Students (Admin)
```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Specific Student (Admin)
```bash
curl -X GET http://localhost:5000/api/students/607f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Edit Student Profile (Admin)
```bash
curl -X PUT http://localhost:5000/api/students/607f1f77bcf86cd799439011/admin-edit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class": "SSS1",
    "department": "SCIENCE",
    "parentPhoneNumber": "+234 803 123 4567",
    "paymentStatus": "partial"
  }'
```

---

## Security Considerations

1. **Authorization Checks**: Every endpoint verifies admin/student role
2. **Password Hashing**: Passwords are hashed with bcrypt before storage
3. **Unique Constraints**: Username and email uniqueness enforced
4. **Token Validation**: All endpoints require valid JWT token
5. **Data Exclusion**: Passwords never returned in responses

---

## Summary of Editable Admin Fields

| Field | Type | Rules |
|-------|------|-------|
| firstName | String | No restrictions |
| lastName | String | No restrictions |
| username | String | Must be unique |
| email | String | Must be unique, valid email |
| password | String | Auto-hashed with bcrypt |
| class | String | Must be valid level (JSS1-JSS3, SSS1-SSS3) |
| department | String | Required for SSS, must be SCIENCE/ART/COMMERCIAL |
| parentPhoneNumber | String | Any format |
| paymentStatus | String | Must be unpaid/partial/paid |

---

## Files Modified

1. **models/User.js**: Added `parentPhoneNumber` field
2. **routes/auth.js**: Updated registration to capture parent phone number
3. **routes/students.js**: 
   - Added `/dashboard` endpoint for student self-view
   - Added `/admin-edit` endpoint for admin editing
   - Added authorization checks to all endpoints
   - Added fee management integration


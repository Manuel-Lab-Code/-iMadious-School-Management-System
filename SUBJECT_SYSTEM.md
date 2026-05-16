# EduPortal Subject Management System

## Overview

The system now supports two distinct subject selection flows:
- **JSS1-JSS3 Students**: Manual subject selection from a full list of 20 subjects
- **SSS1-SSS3 Students**: Department-based subject assignment (Science, Art, Commercial)

---

## Available Subjects

### JSS1-JSS3 Full Subject List (20 subjects)
Students in grades 7-9 can manually select their preferred subjects:

1. English Studies
2. Mathematics
3. Basic Science
4. Basic Technology
5. Social Studies
6. Civic Education
7. Security Education
8. Physical & Health Education (PHE)
9. Computer Studies / ICT
10. Business Studies
11. Home Economics
12. Agricultural Science
13. Cultural and Creative Arts (CCA)
14. French Language
15. Arabic Language
16. Nigerian Language (Yoruba / Igbo / Hausa)
17. Christian Religious Studies (CRS)
18. Islamic Religious Studies (IRS)
19. History
20. Digital Literacy / Coding

### Science Department (SSS) - 9 Subjects
1. English Language
2. Mathematics
3. Biology
4. Chemistry
5. Physics
6. Further Math
7. Agric
8. ICT
9. Civic Education

### Art Department (SSS) - 9 Subjects
1. English Language
2. Mathematics
3. Literature in English
4. Government
5. Economics
6. CRS or IRS
7. History
8. ICT
9. Civic Education

### Commercial Department (SSS) - 10 Subjects
1. English Language
2. Mathematics
3. Accounting
4. Commerce
5. Economics
6. ICT
7. CRS or IRS
8. Civic Education
9. Marketing
10. (Reserved for 10th subject if added)

---

## API Endpoints

### 1. Get Registration Data (Recommended for UI Setup)
**Endpoint:** `GET /api/subjects/registration-data`

**Response:**
```json
{
  "jssSubjects": [...20 JSS subjects...],
  "departments": ["SCIENCE", "ART", "COMMERCIAL"],
  "departmentSubjects": {
    "SCIENCE": [...],
    "ART": [...],
    "COMMERCIAL": [...]
  },
  "sssLevels": ["SSS1", "SSS2", "SSS3"],
  "jssLevels": ["JSS1", "JSS2", "JSS3"]
}
```

---

### 2. Get Subjects for a Specific Class Level
**Endpoint:** `GET /api/subjects/class/:classLevel`

**Examples:**
- `GET /api/subjects/class/JSS1` → Returns 20 subjects for manual selection
- `GET /api/subjects/class/SSS1` → Indicates department selection is required

**Response (JSS):**
```json
{
  "classLevel": "JSS1",
  "isDepartmentBased": false,
  "subjects": [...],
  "subjectCount": 20
}
```

**Response (SSS):**
```json
{
  "classLevel": "SSS1",
  "isDepartmentBased": true,
  "departments": ["SCIENCE", "ART", "COMMERCIAL"],
  "message": "This class level requires department selection"
}
```

---

### 3. Get Subjects for a Department
**Endpoint:** `GET /api/subjects/department/:department`

**Examples:**
- `GET /api/subjects/department/SCIENCE`
- `GET /api/subjects/department/ART`
- `GET /api/subjects/department/COMMERCIAL`

**Response:**
```json
{
  "department": "SCIENCE",
  "subjects": [
    "English Language",
    "Mathematics",
    "Biology",
    ...
  ],
  "subjectCount": 9
}
```

---

## Registration Flow

### Step 1: Send OTP
**Endpoint:** `POST /api/auth/send-otp`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "student",
  "class": "JSS1",
  "parentPhoneNumber": "+234 803 123 4567"
}
```

**Note:** The `class` field is optional here. You can send class and department in Step 1 OR in Step 2.

---

### Step 2: Verify OTP & Create Account
**Endpoint:** `POST /api/auth/verify-otp`

#### For JSS Students (Class JSS1-JSS3):
**IMPORTANT:** Must include `class` and `subjects` array

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "class": "JSS1",
  "subjects": [
    "English Studies",
    "Mathematics",
    "Basic Science",
    "Basic Technology"
  ]
}
```

#### For SSS Students (Class SSS1-SSS3):
**IMPORTANT:** Must include `class` and `department`

```json
{
  "email": "jane@example.com",
  "otp": "654321",
  "class": "SSS1",
  "department": "SCIENCE"
}
```

**Note:** For SSS students, subjects are automatically assigned based on the department. Do NOT send a `subjects` field—it will be ignored.

**Response:**
```json
{
  "message": "Email verified! Account created successfully. You can now log in."
}
```

---

### Complete Registration Examples

#### JSS1 Student Registration Example
```javascript
// Step 1: Send OTP
POST /api/auth/send-otp
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "student"
  // Note: NOT including class here
}

// User receives OTP email

// Step 2: Verify OTP with class and subjects
POST /api/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456",
  "class": "JSS1",
  "subjects": ["English Studies", "Mathematics", "Basic Science"]
}
```

#### SSS1 Science Student Registration Example
```javascript
// Step 1: Send OTP
POST /api/auth/send-otp
{
  "firstName": "Jane",
  "lastName": "Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "SecurePass456",
  "role": "student"
  // Note: NOT including class or department here
}

// User receives OTP email

// Step 2: Verify OTP with class and department
POST /api/auth/verify-otp
{
  "email": "jane@example.com",
  "otp": "654321",
  "class": "SSS1",
  "department": "SCIENCE"
  // Subjects auto-populate: English Language, Mathematics, Biology, etc.
}
```

---

## Database Schema Changes

### User Model Updates
The `User` model now includes:

```javascript
{
  firstName: String,
  lastName: String,
  username: String (unique),
  password: String,
  email: String,
  role: String (enum: ['student','teacher','admin']),
  
  // For students
  class: String,              // e.g., "JSS1", "SSS2"
  department: String,         // e.g., "SCIENCE" (SSS only)
  subjects: [String],         // Array of subject names
  
  // For teachers
  subject: String,            // Single subject they teach
  
  isActive: Boolean,
  timestamps: true
}
```

---

## Frontend Implementation Guide

### 1. Load Initial Registration Data
```javascript
// On form load
fetch('/api/subjects/registration-data')
  .then(res => res.json())
  .then(data => {
    // data.jssLevels, data.sssLevels
    // data.departments, data.departmentSubjects
  });
```

### 2. Handle Class Level Selection
```javascript
function onClassLevelChange(classLevel) {
  fetch(`/api/subjects/class/${classLevel}`)
    .then(res => res.json())
    .then(data => {
      if (data.isDepartmentBased) {
        // Show department selector
        showDepartmentDropdown(data.departments);
      } else {
        // Show subject multi-select
        showSubjectSelector(data.subjects);
      }
    });
}
```

### 3. Handle Department Selection (SSS only)
```javascript
function onDepartmentChange(department) {
  fetch(`/api/subjects/department/${department}`)
    .then(res => res.json())
    .then(data => {
      console.log(`Selected: ${data.subjectCount} subjects`);
      // Display the subjects (read-only, for reference)
    });
}
```

### 4. Submit Registration
```javascript
async function submitRegistration(formData) {
  // Verify OTP endpoint
  const verifyPayload = {
    email: formData.email,
    otp: formData.otp,
    class: formData.class  // IMPORTANT: Always include class!
  };
  
  // CRITICAL: Include subjects for JSS OR department for SSS
  if (isJSSStudent(formData.class)) {
    verifyPayload.subjects = formData.selectedSubjects;
  } else if (isSSSStudent(formData.class)) {
    verifyPayload.department = formData.selectedDepartment;
  }
  
  const verifyResponse = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload)
  });
  
  const result = await verifyResponse.json();
  if (!verifyResponse.ok) {
    alert(`Registration Error: ${result.message}`);
    return false;
  }
  
  alert('Registration successful! You can now log in.');
  return true;
}
```

---

## Summary Table

| Class Level | Requires Department? | Subject Selection | Count |
|-------------|---------------------|------------------|-------|
| JSS1        | No                  | Manual (List)    | 20    |
| JSS2        | No                  | Manual (List)    | 20    |
| JSS3        | No                  | Manual (List)    | 20    |
| SSS1        | **Yes**             | Auto (Dept)      | 9-10  |
| SSS2        | **Yes**             | Auto (Dept)      | 9-10  |
| SSS3        | **Yes**             | Auto (Dept)      | 9-10  |

---

## Error Handling & Troubleshooting

### ❌ Error: "JSS students must select at least one subject" (Even for SSS)
**Cause:** You didn't send the `class` field in the verify-otp request body.

**Solution:** Make sure your verify-otp request includes the `class` parameter:
```json
{
  "email": "student@school.com",
  "otp": "123456",
  "class": "SSS1",
  "department": "SCIENCE"
}
```

---

### ❌ Error: "Class level is required (e.g., JSS1, SSS1, etc.)"
**Cause:** You didn't send any `class` in either send-otp OR verify-otp.

**Solution:** Include class in verify-otp:
```json
{
  "email": "student@school.com",
  "otp": "123456",
  "class": "JSS1",
  "subjects": ["English Studies", "Mathematics"]
}
```

---

### ❌ Error: "Department is required for SSS students. Please select SCIENCE, ART, or COMMERCIAL."
**Cause:** You sent an SSS class but forgot to include the department.

**Solution:** Add department to verify-otp:
```json
{
  "email": "student@school.com",
  "otp": "123456",
  "class": "SSS1",
  "department": "SCIENCE"
}
```

---

### ❌ Error: "Please select at least one subject from the list."
**Cause:** You sent a JSS class but didn't include the subjects array.

**Solution:** Add subjects array to verify-otp:
```json
{
  "email": "student@school.com",
  "otp": "123456",
  "class": "JSS1",
  "subjects": ["English Studies", "Mathematics"]
}
```

---

### ❌ Error: "Invalid subjects for JSS1: InvalidSubject, AnotherBad"
**Cause:** You sent subject names that don't exist in the JSS subject list.

**Solution:** Use valid JSS subjects from the list above. Get the list via:
```
GET /api/subjects/class/JSS1
```

---

### ❌ Error: "Invalid department: Biology. Must be SCIENCE, ART, or COMMERCIAL"
**Cause:** Invalid department name (note: it's case-sensitive uppercase).

**Solution:** Use only: SCIENCE, ART, or COMMERCIAL

---

## Testing

### Test JSS Registration
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jss@test.com",
    "otp": "123456",
    "class": "JSS1",
    "subjects": ["English Studies", "Mathematics"]
  }'
```

### Test SSS Registration
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sss@test.com",
    "otp": "654321",
    "class": "SSS1",
    "department": "SCIENCE"
  }'
```

### Get Available Data
```bash
curl http://localhost:5000/api/subjects/registration-data
curl http://localhost:5000/api/subjects/class/JSS1
curl http://localhost:5000/api/subjects/department/SCIENCE
```

---

## Files Modified/Created

1. **Created:** `config/subjectCombinations.js` - Central configuration for all subjects
2. **Created:** `routes/subjects.js` - Helper endpoints for subject data
3. **Modified:** `models/User.js` - Added `subjects` array and updated `department`
4. **Modified:** `routes/auth.js` - Updated registration flow with subject validation
5. **Modified:** `server.js` - Added subjects route

---

## Next Steps (Optional Enhancements)

1. **Subject Change Request:** Allow SSS students to request department/subject changes with admin approval
2. **Subject Swap:** Enable students to swap subjects within their selection (if applicable)
3. **Subject Statistics:** Track enrollment by subject and department
4. **Early Subject Selection:** Allow JSS students to pre-select optional subjects for SSS

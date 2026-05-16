# Code Citations

## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


## License: Apache-2.0
https://github.com/nashville-software-school/client-side-mastery/blob/b1689e2b67b32f907c02050be9d0a1967c848a20/projects/tier-2/dothard-simbleton/chapters/DS_INTRO.md

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPort
```


## License: unknown
https://github.com/ifm/developerportal/blob/e695dc689655412553eaeb3acd9f55ec934bfe9f/windows.html

```
I understand you want to implement multi-tenancy! However, I'm currently in **Ask Mode** (read-only), so I cannot directly modify files. But I'll provide you with **complete, ready-to-use code** for all 5 phases that you can implement.

Let me give you the full implementation:

---

## **Phase 1: Add `schoolId` to All Models**

### **NEW FILE: `models/School.js`**
```javascript
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  
  adminUsername: { type: String, required: true, unique: true },
  adminPassword: { type: String, required: true },  // hashed
  
  isActive: { type: Boolean, default: true },
  studentCount: { type: Number, default: 0 },
  teacherCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }  // Developer username
});

module.exports = mongoose.model('School', SchoolSchema);
```

### **UPDATE: `models/User.js`** - Add after line 11:
```javascript
  // Multi-tenancy: School isolation
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String },
```

### **UPDATE: `models/Exam.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Fee.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

### **UPDATE: `models/Result.js`** - Add after first field:
```javascript
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
```

**Do the same for:** `SubjectResult.js`, `TestScore.js`, `Notification.js`, `TeacherPayment.js`

---

## **Phase 2: Create Developer Routes**

### **NEW FILE: `routes/developer.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
require('dotenv').config();

/* Developer authentication */
const verifyDeveloper = (req, res, next) => {
  const devKey = req.headers['x-developer-key'] || req.body.devKey;
  if (devKey !== process.env.DEVELOPER_KEY) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Invalid developer key.' });
  }
  next();
};

/* ═══════════════════════════════════════════════════════════
   DEVELOPER ENDPOINTS FOR MULTI-TENANCY
   ═══════════════════════════════════════════════════════════ */

/* Register New School */
router.post('/register-school', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, principalName, adminUsername, adminPassword } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) return res.status(400).json({ success: false, message: 'School email already exists.' });

    const existingAdmin = await School.findOne({ adminUsername });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin username already exists.' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await School.create({
      name,
      email,
      phone,
      address,
      city,
      principalName,
      adminUsername,
      adminPassword: hashedPassword,
      isActive: true,
      approvalStatus: 'approved',
      createdBy: 'developer'
    });

    res.json({
      success: true,
      message: 'School registered successfully!',
      school: {
        _id: school._id,
        name: school.name,
        adminUsername: school.adminUsername
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get All Schools */
router.get('/schools', verifyDeveloper, async (req, res) => {
  try {
    const schools = await School.find({}).select('-adminPassword');
    res.json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get School Details */
router.get('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId).select('-adminPassword');
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    const studentCount = await User.countDocuments({ schoolId: school._id, role: 'student' });
    const teacherCount = await User.countDocuments({ schoolId: school._id, role: 'teacher' });

    res.json({
      success: true,
      school: {
        ...school.toObject(),
        studentCount,
        teacherCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Update School */
router.put('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const { name, email, phone, address, city, isActive } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { name, email, phone, address, city, isActive, updatedAt: new Date() },
      { new: true }
    ).select('-adminPassword');

    res.json({ success: true, message: 'School updated.', school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Delete School (DANGEROUS - removes all data) */
router.delete('/schools/:schoolId', verifyDeveloper, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found.' });

    // Delete all users from this school
    await User.deleteMany({ schoolId: school._id });

    res.json({ success: true, message: 'School and all its data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Get Statistics */
router.get('/stats/overview', verifyDeveloper, async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    res.json({
      success: true,
      stats: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
```

---

## **Phase 2B: Update Authentication in `routes/auth.js`**

Add this endpoint to log in school admins:

```javascript
/* School Admin Login */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const school = await School.findOne({ adminUsername: username });
    if (!school) {
      return res.status(401).json({ success: false, message: 'Invalid school admin credentials.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, school.adminPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: school._id, 
        username: school.adminUsername, 
        role: 'admin',
        schoolId: school._id,
        schoolName: school.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## **Phase 2C: Update Routes to Filter by `schoolId`**

### **Example: Update `routes/students.js`**

```javascript
/* Get all students for a school */
router.get('/', auth, async (req, res) => {
  try {
    // Filter by schoolId from authenticated user
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId  // ← ADD THIS LINE
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Apply same filter to all other endpoints */
```

**Do this for:** `teachers.js`, `exams.js`, `results.js`, `fees.js`, `subjects.js`, etc.

---

## **Phase 3-4: Developer Dashboard HTML**

### **NEW FILE: `public/developer.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Control Panel — EduPortal Multi
```


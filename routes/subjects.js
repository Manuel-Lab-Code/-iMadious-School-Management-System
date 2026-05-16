/* ═══════════════════════════════════════════════════════════
   EduPortal — routes/subjects.js
   Helper endpoint to fetch subjects data for registration UI
   ═══════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { 
  JSS_SUBJECTS, 
  DEPARTMENT_SUBJECTS, 
  getSubjectsByClass,
  getSubjectsByDepartment,
  requiresDepartment 
} = require('../config/subjectCombinations');

/* ═══════════════════════════════════════════════════════════
   GET ALL AVAILABLE DATA FOR REGISTRATION
   GET /api/subjects/registration-data
   ═══════════════════════════════════════════════════════════ */
router.get('/registration-data', (req, res) => {
  try {
    res.json({
      jssSubjects: JSS_SUBJECTS,
      departments: Object.keys(DEPARTMENT_SUBJECTS),
      departmentSubjects: DEPARTMENT_SUBJECTS,
      sssLevels: ['SSS1', 'SSS2', 'SSS3'],
      jssLevels: ['JSS1', 'JSS2', 'JSS3']
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET SUBJECTS FOR A SPECIFIC CLASS
   GET /api/subjects/class/:classLevel
   ═══════════════════════════════════════════════════════════ */
router.get('/class/:classLevel', (req, res) => {
  try {
    const { classLevel } = req.params;
    const subjects = getSubjectsByClass(classLevel);
    const isDepartmentBased = requiresDepartment(classLevel);

    if (subjects === null && isDepartmentBased) {
      return res.json({
        classLevel,
        isDepartmentBased: true,
        departments: Object.keys(DEPARTMENT_SUBJECTS),
        message: 'This class level requires department selection'
      });
    }

    if (!subjects) {
      return res.status(400).json({ 
        message: `Class level "${classLevel}" not recognized` 
      });
    }

    res.json({
      classLevel,
      isDepartmentBased: false,
      subjects,
      subjectCount: subjects.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET SUBJECTS FOR A SPECIFIC DEPARTMENT
   GET /api/subjects/department/:department
   ═══════════════════════════════════════════════════════════ */
router.get('/department/:department', (req, res) => {
  try {
    const { department } = req.params;
    const subjects = getSubjectsByDepartment(department);

    if (subjects.length === 0) {
      return res.status(400).json({ 
        message: `Department "${department}" not recognized. Use: SCIENCE, ART, or COMMERCIAL` 
      });
    }

    res.json({
      department,
      subjects,
      subjectCount: subjects.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

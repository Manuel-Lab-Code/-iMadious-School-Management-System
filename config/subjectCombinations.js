/* ═══════════════════════════════════════════════════════════
   EduPortal — config/subjectCombinations.js
   Defines subject combinations for all departments and class levels.
   ═══════════════════════════════════════════════════════════ */

const JSS_SUBJECTS = [
  'English Studies',
  'Mathematics',
  'Basic Science',
  'Basic Technology',
  'Social Studies',
  'Civic Education',
  'Security Education',
  'Physical & Health Education (PHE)',
  'Computer Studies / ICT',
  'Business Studies',
  'Home Economics',
  'Agricultural Science',
  'Cultural and Creative Arts (CCA)',
  'French Language',
  'Arabic Language',
  'Nigerian Language (Yoruba / Igbo / Hausa)',
  'Christian Religious Studies (CRS)',
  'Islamic Religious Studies (IRS)',
  'History',
  'Digital Literacy / Coding'
];

const DEPARTMENT_SUBJECTS = {
  SCIENCE: [
    'English Language',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Physics',
    'Further Math',
    'Agric',
    'ICT',
    'Civic Education'
  ],
  ART: [
    'English Language',
    'Mathematics',
    'Literature in English',
    'Government',
    'Economics',
    'CRS or IRS',
    'History',
    'ICT',
    'Civic Education'
  ],
  COMMERCIAL: [
    'English Language',
    'Mathematics',
    'Accounting',
    'Commerce',
    'Economics',
    'ICT',
    'CRS or IRS',
    'Civic Education',
    'Marketing'
  ]
};

/**
 * Get subjects based on class level
 * @param {String} classLevel - e.g., "JSS1", "SSS2", etc.
 * @returns {Array} - Available subjects for the class level
 */
function getSubjectsByClass(classLevel) {
  if (!classLevel) return [];
  
  const level = classLevel.toUpperCase();
  
  // JSS1-JSS3: return full subject list for manual selection
  if (['JSS1', 'JSS2', 'JSS3'].includes(level)) {
    return JSS_SUBJECTS;
  }
  
  // SSS1-SSS3: departments choose their subjects
  return null; // Department-based selection
}

/**
 * Get subjects for a specific department
 * @param {String} department - "SCIENCE", "ART", or "COMMERCIAL"
 * @returns {Array} - Subjects for the department
 */
function getSubjectsByDepartment(department) {
  if (!department) return [];
  const dept = department.toUpperCase();
  return DEPARTMENT_SUBJECTS[dept] || [];
}

/**
 * Check if a class level requires department selection
 * @param {String} classLevel - e.g., "JSS1", "SSS2", etc.
 * @returns {Boolean}
 */
function requiresDepartment(classLevel) {
  if (!classLevel) return false;
  const level = classLevel.toUpperCase();
  return ['SSS1', 'SSS2', 'SSS3'].includes(level);
}

/**
 * Validate subjects for a student
 * @param {String} classLevel - Student's class level
 * @param {String} department - Student's department (if applicable)
 * @param {Array} subjects - School of subjects to validate
 * @returns {Object} - { valid: Boolean, message: String }
 */
function validateSubjects(classLevel, department, subjects) {
  if (!Array.isArray(subjects)) {
    return { valid: false, message: 'Subjects must be an array' };
  }

  const level = classLevel.toUpperCase();

  // JSS students: validate against full subject list
  if (['JSS1', 'JSS2', 'JSS3'].includes(level)) {
    const validSubjects = JSS_SUBJECTS;
    const invalidSubjects = subjects.filter(s => !validSubjects.includes(s));
    
    if (invalidSubjects.length > 0) {
      return { 
        valid: false, 
        message: `Invalid subjects for ${classLevel}: ${invalidSubjects.join(', ')}` 
      };
    }
    return { valid: true };
  }

  // SSS students: validate against department subjects
  if (['SSS1', 'SSS2', 'SSS3'].includes(level)) {
    if (!department) {
      return { valid: false, message: 'Department is required for SSS students' };
    }

    const deptSubjects = getSubjectsByDepartment(department);
    const invalidSubjects = subjects.filter(s => !deptSubjects.includes(s));
    
    if (invalidSubjects.length > 0) {
      return { 
        valid: false, 
        message: `Invalid subjects for ${department} department: ${invalidSubjects.join(', ')}` 
      };
    }
    return { valid: true };
  }

  return { valid: false, message: `Invalid class level: ${classLevel}` };
}

module.exports = {
  JSS_SUBJECTS,
  DEPARTMENT_SUBJECTS,
  getSubjectsByClass,
  getSubjectsByDepartment,
  requiresDepartment,
  validateSubjects
};

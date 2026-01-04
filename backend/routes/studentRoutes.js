const express = require("express");
const Student = require("../models/Student");
const auth = require("../middleware/authmiddleware");
const requireRole = auth.requireRole;

const router = express.Router();

/**
 * GET students by class & section
 * /api/students?class=10&section=A
 */
router.get("/", auth, async (req, res) => {
  try {
    // accept either `class` or `department` as query param (department is an alias)
    const { class: className, department, section } = req.query;
    const dept = department || className;

    if (!dept || !section) {
      return res.status(400).json({
        message: "Department and Section are required"
      });
    }

    // Match by `department` field only (legacy `class` field is removed)
    const students = await Student.find({
      department: dept,
      section: section
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/:studentId
router.get('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.json(student);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/students/:studentId  -- update name/department/section (authenticated users)
// Note: previously admin-only; relaxed to allow authenticated users to edit student details.
router.put('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, department, section } = req.body || {};
    if (!name || !department || !section) return res.status(400).json({ message: 'name, department and section are required' });

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found. Use Creation to add new students.' });

    student.name = name;
    student.department = department;
    student.section = section;
    await student.save();
    return res.json({ message: 'Student updated', student });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


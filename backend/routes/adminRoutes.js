const express = require('express');
const Department = require('../models/Department');
const Section = require('../models/Section');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/authmiddleware');

const router = express.Router();

// Require admin role helper
const requireAdmin = auth.requireRole ? auth.requireRole('admin') : (req, res, next) => next();

// Create department (allow any authenticated user to create)
router.post('/departments', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Department already exists' });
    const dept = new Department({ name });
    await dept.save();
    console.log('[adminRoutes] Created department:', dept.name, 'by user=', req.user && req.user.userId);
    res.status(201).json(dept);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Charts: marks (avg per student) and attendance (percent per student)
// GET /api/admin/charts/marks?limit=10&startDate=&endDate=&department=&section=
router.get('/charts/marks', auth, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate, department, section } = req.query;
    const match = {};
    if (startDate && endDate) match.date = { $gte: startDate, $lte: endDate };
    if (department) match.department = department;
    if (section) match.section = section;

    const Marks = require('../models/Marks');

    const pipeline = [
      { $match: match },
      { $unwind: '$records' },
      { $group: { _id: '$records.student', avgMark: { $avg: '$records.mark' } } },
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { studentId: '$student.studentId', name: '$student.name', avgMark: 1 } },
      { $sort: { avgMark: -1 } },
      { $limit: Number(limit) }
    ];

    const rows = await Marks.aggregate(pipeline);
    return res.json({ data: rows });
  } catch (err) {
    console.error('Charts marks error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/charts/attendance?limit=10&startDate=&endDate=&department=&section=
router.get('/charts/attendance', auth, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate, department, section } = req.query;
    let start = startDate, end = endDate;
    if (!start || !end) {
      const today = new Date();
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = start || first.toISOString().split('T')[0];
      end = end || today.toISOString().split('T')[0];
    }

    const Attendance = require('../models/Attendance');

    const pipeline = [
      { $match: { date: { $gte: start, $lte: end } } },
      { $unwind: '$records' },
      { $lookup: { from: 'students', localField: 'records.student', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
    ];

    if (department) pipeline.push({ $match: { 'student.department': department } });
    if (section) pipeline.push({ $match: { 'student.section': section } });

    pipeline.push({
      $group: {
        _id: '$student._id',
        studentId: { $first: '$student.studentId' },
        name: { $first: '$student.name' },
        presents: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
        total: { $sum: 1 }
      }
    });

    pipeline.push({ $project: { studentId: 1, name: 1, percent: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$presents', '$total'] }, 100] }] } } });
    pipeline.push({ $sort: { percent: -1 } });
    pipeline.push({ $limit: Number(limit) });

    const rows = await Attendance.aggregate(pipeline);
    return res.json({ data: rows });
  } catch (err) {
    console.error('Charts attendance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List departments (allow any authenticated user)
router.get('/departments', auth, async (req, res) => {
  console.log('[adminRoutes] GET /departments - req.user=', req.user && { id: req.user.userId, role: req.user.role });
  try {
    const depts = await Department.find().sort('name');
    res.json(depts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk create departments (array of names)
router.post('/departments/bulk', auth, async (req, res) => {
  try {
    const { classes } = req.body; // still accept `classes` for compatibility
    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'classes must be a non-empty array' });
    }

    const docs = classes.map((c) => (typeof c === 'string' ? { name: c } : { name: c.name }));
    // insertMany with ordered:false to continue on duplicates
    const result = await Department.insertMany(docs, { ordered: false }).catch((err) => err);

    if (result && result.writeErrors) {
      return res.status(207).json({ message: 'Partial success', result });
    }

    res.status(201).json({ message: 'Departments created', count: Array.isArray(result) ? result.length : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create section (allow any authenticated user to create)
router.post('/sections', auth, async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) return res.status(400).json({ message: 'department and name are required' });
    const existing = await Section.findOne({ name, department });
    if (existing) return res.status(400).json({ message: 'Section already exists for this department' });
    const sec = new Section({ name, department });
    await sec.save();
    console.log('[adminRoutes] Created section:', sec.name, 'department=', sec.department, 'by user=', req.user && req.user.userId);
    res.status(201).json(sec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List sections (allow any authenticated user)
router.get('/sections', auth, async (req, res) => {
  console.log('[adminRoutes] GET /sections - req.user=', req.user && { id: req.user.userId, role: req.user.role });
  try {
    // accept `department` query param (legacy `className` previously used)
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;
    const sections = await Section.find(filter).sort('name');
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student (allow any authenticated user to create)
router.post('/students', auth, async (req, res) => {
  try {
    const { studentId, name, department, section } = req.body;
    const dept = department;
    if (!studentId || !name || !dept || !section) {
      return res.status(400).json({ message: 'studentId, name, department and section are required' });
    }
    const existing = await Student.findOne({ studentId });
    if (existing) return res.status(400).json({ message: 'Student with this ID already exists' });
    // write department only
    const student = new Student({ studentId, name, department: dept, section });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk create/update students. Expect array of objects with studentId,name,class,section,email
router.post('/students/bulk', auth, async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'students must be a non-empty array' });
    }

    const operations = students.map((s) => {
      const dept = s.department || s.class;
      return {
        updateOne: {
          filter: { studentId: s.studentId || s.email },
          update: {
            $set: {
              studentId: s.studentId || s.email,
              name: s.name,
              email: s.email,
              department: dept,
              section: s.section,
            },
          },
          upsert: true,
        },
      };
    });

    const writeResult = await Student.bulkWrite(operations, { ordered: false });
    res.status(200).json({ message: 'Bulk students processed', result: writeResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student
router.put('/students/:id', auth, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student
router.delete('/students/:id', auth, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Admin stats: counts for dashboard
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const staffCount = await User.countDocuments({ role: 'staff' });
    const studentCount = await Student.countDocuments();
    const todayIso = new Date().toISOString().split('T')[0];
    const attendanceDoc = await Attendance.findOne({ date: todayIso });
    const sessionsToday = attendanceDoc ? (attendanceDoc.records ? attendanceDoc.records.length : 0) : 0;
    const presentsToday = attendanceDoc ? attendanceDoc.records.filter(r => r.status === 'present').length : 0;

    return res.json({ staffCount, studentCount, sessionsToday, presentsToday, date: todayIso });
  } catch (err) {
    console.error('Admin stats error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Monthly reports endpoint
router.get('/reports/monthly', auth, requireAdmin, async (req, res) => {
  try {
    const { month, year, startDate, endDate, department, section, view = 'student', page = 1, limit = 50, format } = req.query;
    let start = startDate;
    let end = endDate;
    if (!start || !end) {
      if (month && year) {
        const m = Number(month);
        const y = Number(year);
        const first = new Date(y, m - 1, 1);
        const last = new Date(y, m, 0);
        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
        start = `${first.getFullYear()}-${pad(first.getMonth()+1)}-${pad(first.getDate())}`;
        end = `${last.getFullYear()}-${pad(last.getMonth()+1)}-${pad(last.getDate())}`;
      }
    }

    if (!start || !end) return res.status(400).json({ message: 'startDate/endDate or month+year are required' });

    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(1000, Number(limit) || 50));

    const Attendance = require('../models/Attendance');
    const Student = require('../models/Student');

    // Build aggregation pipeline
    const match = { date: { $gte: start, $lte: end } };

    const pipeline = [
      { $match: match },
      { $unwind: '$records' },
      // lookup student
      { $lookup: { from: 'students', localField: 'records.student', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
    ];

    // apply filters
    const studentFilter = {};
    if (department) studentFilter['student.department'] = department;
    if (section) studentFilter['student.section'] = section;
    if (Object.keys(studentFilter).length) pipeline.push({ $match: studentFilter });

    if (view === 'class') {
      pipeline.push({
        $group: {
          _id: { department: '$student.department', section: '$student.section' },
          sessions: { $sum: 1 },
          presents: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
        }
      });

      pipeline.push({
        $project: {
          department: '$_id.department',
          section: '$_id.section',
          sessions: 1,
          presents: 1,
          absents: { $subtract: ['$sessions', '$presents'] },
          percent: { $cond: [{ $eq: ['$sessions', 0] }, 0, { $multiply: [{ $divide: ['$presents', '$sessions'] }, 100] }] }
        }
      });

      // count total groups
      const all = await Attendance.aggregate(pipeline.concat([{ $sort: { department: 1, section: 1 } }]));
      const total = all.length;
      const paged = all.slice((pageNum - 1) * lim, (pageNum - 1) * lim + lim);

      // export formats
      if (format === 'csv' || format === 'xlsx') {
        const rows = paged.map(r => ({ Department: r.department, Section: r.section, Sessions: r.sessions, Presents: r.presents, Absents: r.absents, Percent: r.percent.toFixed(2) }));
        if (format === 'csv') {
          const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
          res.setHeader('Content-Disposition', `attachment; filename=monthly-class-report-${start}-to-${end}.csv`);
          res.setHeader('Content-Type', 'text/csv');
          return res.send(csv);
        } else {
          const ExcelJS = require('exceljs');
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('Classes');
          if (rows.length) ws.addRow(Object.keys(rows[0]));
          rows.forEach(r => ws.addRow(Object.values(r)));
          res.setHeader('Content-Disposition', `attachment; filename=monthly-class-report-${start}-to-${end}.xlsx`);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          await wb.xlsx.write(res);
          return res.end();
        }
      }

      return res.json({ data: paged, total, page: pageNum, pages: Math.ceil(total / lim) });
    }

    // default: per-student view
    pipeline.push({
      $group: {
        _id: '$student._id',
        studentId: { $first: '$student.studentId' },
        name: { $first: '$student.name' },
        department: { $first: '$student.department' },
        section: { $first: '$student.section' },
        sessions: { $sum: 1 },
        presents: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
      }
    });

    pipeline.push({
      $project: {
        studentId: 1, name: 1, department: 1, section: 1,
        sessions: 1, presents: 1,
        absents: { $subtract: ['$sessions', '$presents'] },
        percent: { $cond: [{ $eq: ['$sessions', 0] }, 0, { $multiply: [{ $divide: ['$presents', '$sessions'] }, 100] }] }
      }
    });

    pipeline.push({ $sort: { name: 1 } });

    const agg = await Attendance.aggregate(pipeline);
    const total = agg.length;
    const paged = agg.slice((pageNum - 1) * lim, (pageNum - 1) * lim + lim);

    if (format === 'csv' || format === 'xlsx') {
      const rows = paged.map(r => ({ StudentID: r.studentId, Name: r.name, Department: r.department, Section: r.section, Sessions: r.sessions, Presents: r.presents, Absents: r.absents, Percent: r.percent.toFixed(2) }));
      if (format === 'csv') {
        const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
        res.setHeader('Content-Disposition', `attachment; filename=monthly-student-report-${start}-to-${end}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.send(csv);
      } else {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Students');
        if (rows.length) ws.addRow(Object.keys(rows[0]));
        rows.forEach(r => ws.addRow(Object.values(r)));
        res.setHeader('Content-Disposition', `attachment; filename=monthly-student-report-${start}-to-${end}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await wb.xlsx.write(res);
        return res.end();
      }
    }

    return res.json({ data: paged, total, page: pageNum, pages: Math.ceil(total / lim) });
  } catch (err) {
    console.error('Monthly report error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

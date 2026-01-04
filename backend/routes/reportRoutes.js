const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const { Parser } = require('json2csv');
const ExcelJS = (() => { try { return require('exceljs'); } catch(e){ return null; } })();

// GET /api/reports/monthly
// Query params: month, year OR startDate,endDate (YYYY-MM-DD)
// department, section, view=student|class, page, limit, export=csv|xlsx
router.get('/monthly', auth, requireRole('admin'), async (req, res) => {
  try {
    const { month, year, startDate, endDate, department, section, view = 'student', page = 1, limit = 50, export: _export } = req.query;
    let start = startDate, end = endDate;
    if (!start || !end) {
      if (month && year) {
        const m = String(month).padStart(2,'0');
        start = `${year}-${m}-01`;
        // compute last day of month
        const lastDay = new Date(year, Number(month), 0).getDate();
        end = `${year}-${m}-${String(lastDay).padStart(2,'0')}`;
      } else {
        return res.status(400).json({ message: 'Provide month+year or startDate+endDate' });
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(1000, Number(limit) || 50));

    // match attendance docs by date range
    const match = { date: { $gte: start, $lte: end } };

    // pipeline: unwind records, lookup student, optional filter by dept/section, group
    const pipeline = [
      { $match: match },
      { $unwind: '$records' },
      { $lookup: { from: 'students', localField: 'records.student', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
    ];

    if (department) pipeline.push({ $match: { 'student.department': department } });
    if (section) pipeline.push({ $match: { 'student.section': section } });

    if (view === 'student') {
      pipeline.push({
        $group: {
          _id: '$student._id',
          studentId: { $first: '$student.studentId' },
          name: { $first: '$student.name' },
          department: { $first: '$student.department' },
          section: { $first: '$student.section' },
          presents: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
          total: { $sum: 1 },
        }
      });
      pipeline.push({ $project: { studentId:1,name:1,department:1,section:1,presents:1,total:1,percent: { $multiply:[{ $divide:['$presents','$total'] },100] } } });
      pipeline.push({ $sort: { name: 1 } });
      // pagination
      pipeline.push({ $skip: (pageNum-1)*lim });
      pipeline.push({ $limit: lim });

      const docs = await Attendance.aggregate(pipeline);

      if (_export === 'csv' || _export === 'xlsx') {
        const rows = docs.map(d => ({ studentId: d.studentId, name: d.name, department: d.department, section: d.section, presents: d.presents, total: d.total, percent: d.percent }));
        if (_export === 'csv') {
          const parser = new Parser();
          const csv = parser.parse(rows);
          res.setHeader('Content-Type','text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${start}-to-${end}.csv"`);
          return res.send(csv);
        }
        if (_export === 'xlsx') {
          if (!ExcelJS) return res.status(500).json({ message: 'Excel export not available' });
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('Report');
          ws.addRow(['Student ID','Name','Department','Section','Presents','Total','Percent']);
          rows.forEach(r => ws.addRow([r.studentId,r.name,r.department,r.section,r.presents,r.total,r.percent]));
          res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${start}-to-${end}.xlsx"`);
          await wb.xlsx.write(res);
          return res.end();
        }
      }

      return res.json({ data: docs, page: pageNum });
    }

    // class summary view: group by department+section
    pipeline.push({
      $group: {
        _id: { department: '$student.department', section: '$student.section' },
        presents: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
        total: { $sum: 1 },
      }
    });
    pipeline.push({ $project: { department: '$_id.department', section: '$_id.section', presents:1, total:1, percent: { $multiply:[{ $divide:['$presents','$total'] },100] } } });
    pipeline.push({ $sort: { department:1, section:1 } });
    pipeline.push({ $skip: (pageNum-1)*lim });
    pipeline.push({ $limit: lim });

    const summary = await Attendance.aggregate(pipeline);

    if (_export === 'csv' || _export === 'xlsx') {
      const rows = summary.map(s => ({ department: s.department, section: s.section, presents: s.presents, total: s.total, percent: s.percent }));
      if (_export === 'csv') {
        const parser = new Parser();
        const csv = parser.parse(rows);
        res.setHeader('Content-Type','text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="monthly-class-report-${start}-to-${end}.csv"`);
        return res.send(csv);
      }
      if (_export === 'xlsx') {
        if (!ExcelJS) return res.status(500).json({ message: 'Excel export not available' });
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Report');
        ws.addRow(['Department','Section','Presents','Total','Percent']);
        rows.forEach(r => ws.addRow([r.department,r.section,r.presents,r.total,r.percent]));
        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="monthly-class-report-${start}-to-${end}.xlsx"`);
        await wb.xlsx.write(res);
        return res.end();
      }
    }

    return res.json({ data: summary, page: pageNum });
  } catch (err) {
    console.error('Monthly report error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

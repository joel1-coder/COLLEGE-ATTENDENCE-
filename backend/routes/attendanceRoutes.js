const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/authmiddleware');
const requireRole = authMiddleware.requireRole;
const fs = require('fs');
const path = require('path');
let ExcelJS;
try {
  ExcelJS = require('exceljs');
} catch (e) {
  ExcelJS = null;
  console.warn('exceljs not installed; xlsx export disabled');
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function ensureExportsDir() {
  const dir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

// POST /api/attendance
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, description, records } = req.body || {};
    if (!date || !Array.isArray(records)) return res.status(400).json({ message: 'Missing date or records' });

    // ensure single doc per date
    let doc = await Attendance.findOne({ date });
    if (!doc) doc = new Attendance({ date, description: description || '', records: [] });
    else if (description) doc.description = description;

    // upsert records
    for (const rec of records) {
      const studentId = String(rec.student);
      const existing = doc.records.find(r => String(r.student) === studentId);
      if (existing) existing.status = rec.status;
      else doc.records.push({ student: rec.student, status: rec.status });
    }
    await doc.save();

    // generate CSV
    const exportDir = await ensureExportsDir();
    const filename = `attendance-${date}.csv`;
    const filepath = path.join(exportDir, filename);

    const attendanceDoc = await Attendance.findOne({ date }).populate('records.student');
    const rows = [];
    if (attendanceDoc.description) rows.push([`Description: ${attendanceDoc.description}`].join(','));
    rows.push(['StudentID', 'Name', 'Status'].join(','));
    for (const r of attendanceDoc.records) {
      const s = r.student || {};
      const sid = s.studentId || (s._id ? String(s._id) : '');
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      rows.push([csvEscape(sid), csvEscape(name), csvEscape(r.status)].join(','));
    }
    await fs.promises.writeFile(filepath, rows.join('\n'));

    return res.json({ message: 'Attendance saved', file: `/api/attendance/export?date=${date}` });
  } catch (err) {
    console.error('Attendance save error', err);
    return res.status(500).json({ message: 'Server error saving attendance' });
  }
});

// GET /api/attendance?date=YYYY-MM-DD (authenticated users)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, format } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const attendance = await Attendance.findOne({ date }).populate('records.student');
    return res.json(attendance || {});
  } catch (err) {
    console.error('Fetch attendance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/export?date=YYYY-MM-DD (admin)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { date, format } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const exportDir = await ensureExportsDir();
    const filename = `attendance-${date}.csv`;
    const filepath = path.join(exportDir, filename);

    if (format === 'xlsx') {
      if (!ExcelJS) return res.status(500).json({ message: 'xlsx export not available on server' });
      // generate xlsx in-memory then send
      const attendanceDoc = await Attendance.findOne({ date }).populate('records.student');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Attendance');

      let rowIndex = 1;
      if (attendanceDoc && attendanceDoc.description) {
        sheet.getCell(`A${rowIndex}`).value = `Description: ${attendanceDoc.description}`;
        rowIndex += 1;
      }
      sheet.addRow(['StudentID', 'Name', 'Status']);
      if (attendanceDoc && attendanceDoc.records) {
        for (const r of attendanceDoc.records) {
          const s = r.student || {};
          const sid = s.studentId || (s._id ? String(s._id) : '');
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || '';
          sheet.addRow([sid, name, r.status]);
        }
      }

      // write to buffer and send
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    if (!fs.existsSync(filepath)) {
      const attendanceDoc = await Attendance.findOne({ date }).populate('records.student');
      const rows = [];
      if (attendanceDoc && attendanceDoc.description) rows.push([`Description: ${attendanceDoc.description}`].join(','));
      rows.push(['StudentID', 'Name', 'Status'].join(','));
      if (attendanceDoc && attendanceDoc.records) {
        for (const r of attendanceDoc.records) {
          const s = r.student || {};
          const sid = s.studentId || (s._id ? String(s._id) : '');
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
          rows.push([csvEscape(sid), csvEscape(name), csvEscape(r.status)].join(','));
        }
      }
      await fs.promises.writeFile(filepath, rows.join('\n'));
    }

    return res.download(filepath, filename);
  } catch (err) {
    console.error('Export error', err);
    return res.status(500).json({ message: 'Failed to export attendance' });
  }
});

// POST /api/attendance/reset  (admin only)
// body: { date: 'YYYY-MM-DD', action: 'reset' | 'reopen' }
router.post('/reset', authMiddleware, requireRole ? requireRole('admin') : (req,res,next)=>next(), async (req, res) => {
  try {
    const { date, action } = req.body || {};
    if (!date || !action) return res.status(400).json({ message: 'date and action are required' });

    const attendance = await Attendance.findOne({ date });
    if (!attendance) return res.status(404).json({ message: 'No attendance found for that date' });

    if (action === 'reset') {
      // delete the attendance document
      await Attendance.deleteOne({ _id: attendance._id });
      return res.json({ message: 'Attendance reset (deleted) for date ' + date });
    }

    if (action === 'reopen') {
      // clear records but keep document (and description)
      attendance.records = [];
      await attendance.save();
      return res.json({ message: 'Attendance reopened for date ' + date });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    console.error('Reset attendance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/authMiddleware');
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
    const { date, description, records, department, section } = req.body || {};
    if (!date || !Array.isArray(records)) return res.status(400).json({ message: 'Missing date or records' });

    // create a new attendance document for this submission (allow multiple per date)
    const doc = new Attendance({ date, description: description || '', department: department || '', section: section || '', records: [] });

    // add records
    for (const rec of records) {
      doc.records.push({ student: rec.student, status: rec.status });
    }
    await doc.save();

    // prepare export path (one file per date; export endpoint will combine docs)
    const exportDir = await ensureExportsDir();
    const filename = `attendance-${date}.csv`;
    const filepath = path.join(exportDir, filename);

    // regenerate combined CSV for the date
    const attendanceDocs = await Attendance.find({ date }).populate('records.student');
    const rows = [];
    for (const attendanceDoc of attendanceDocs) {
      if (attendanceDoc.description) rows.push([`Description: ${attendanceDoc.description}`].join(','));
      rows.push(['StudentID', 'Name', 'Status'].join(','));
      for (const r of attendanceDoc.records) {
        const s = r.student || {};
        const sid = s.studentId || (s._id ? String(s._id) : '');
        const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        rows.push([csvEscape(sid), csvEscape(name), csvEscape(r.status)].join(','));
      }
      rows.push([]);
    }
    await fs.promises.writeFile(filepath, rows.join('\n'));

    return res.json({ message: 'Attendance saved', file: `/api/attendance/export?date=${date}` });
  } catch (err) {
    console.error('Attendance save error', err);
    return res.status(500).json({ message: 'Server error saving attendance' });
  }
});

// GET /api/attendance?date=YYYY-MM-DD (authenticated users)
// returns an array of attendance documents matching filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, department, section } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const filter = { date };
    if (department) filter.department = department;
    if (section) filter.section = section;
    // return newest-first
    const attendance = await Attendance.find(filter).sort({ createdAt: -1 }).populate('records.student');
    return res.json(attendance || []);
  } catch (err) {
    console.error('Fetch attendance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/export?date=YYYY-MM-DD (admin)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { date, format, department, section } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const exportDir = await ensureExportsDir();
    const filename = `attendance-${date}.csv`;
    const filepath = path.join(exportDir, filename);

    if (format === 'xlsx') {
      if (!ExcelJS) return res.status(500).json({ message: 'xlsx export not available on server' });
      // generate xlsx in-memory then send - combine all docs for that date
      const filter = { date };
      if (department) filter.department = department;
      if (section) filter.section = section;
      const attendanceDocs = await Attendance.find(filter).populate('records.student');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Attendance');

      let rowIndex = 1;
      for (const attendanceDoc of attendanceDocs) {
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
        rowIndex = sheet.lastRow.number + 1;
      }

      // write to buffer and send
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    if (!fs.existsSync(filepath)) {
      const filter = { date };
      if (department) filter.department = department;
      if (section) filter.section = section;
      const attendanceDocs = await Attendance.find(filter).populate('records.student');
      const rows = [];
      for (const attendanceDoc of attendanceDocs) {
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
        rows.push([]);
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
    const { date, action, department, section } = req.body || {};
    if (!date || !action) return res.status(400).json({ message: 'date and action are required' });

    const filter = { date };
    if (department) filter.department = department;
    if (section) filter.section = section;

    if (action === 'reset') {
      // delete matching attendance documents
      const result = await Attendance.deleteMany(filter);
      return res.json({ message: `Attendance reset (deleted) for date ${date}`, deleted: result.deletedCount });
    }

    if (action === 'reopen') {
      // clear records but keep documents (and description)
      const docs = await Attendance.find(filter);
      if (!docs || docs.length === 0) return res.status(404).json({ message: 'No attendance found for that date/filters' });
      for (const doc of docs) {
        doc.records = [];
        await doc.save();
      }
      return res.json({ message: 'Attendance reopened for date ' + date, updated: docs.length });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    console.error('Reset attendance error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Helper: regenerate CSV/XLSX export for a date (and optional filters)
async function regenerateExportForDate(date, department, section) {
  try {
    const exportDir = await ensureExportsDir();
    const filename = `attendance-${date}.csv`;
    const filepath = path.join(exportDir, filename);

    const filter = { date };
    if (department) filter.department = department;
    if (section) filter.section = section;

    const attendanceDocs = await Attendance.find(filter).populate('records.student');
    const rows = [];
    for (const attendanceDoc of attendanceDocs) {
      if (attendanceDoc && attendanceDoc.description) rows.push([`Description: ${attendanceDoc.description}`].join(','));
      rows.push(['StudentID', 'Name', 'Status'].join(','));
      if (attendanceDoc && attendanceDoc.records) {
        for (const r of attendanceDoc.records) {
          const s = r.student || {};
          const sid = s.studentId || (s._id ? String(s._id) : '');
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || '';
          rows.push([csvEscape(sid), csvEscape(name), csvEscape(r.status)].join(','));
        }
      }
      rows.push([]);
    }
    await fs.promises.writeFile(filepath, rows.join('\n'));
    return { filepath, filename };
  } catch (err) {
    console.error('Regenerate export error', err);
    return null;
  }
}

// Update a single attendance record's status
router.put('/:attendanceId/records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { attendanceId, recordId } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });
    const doc = await Attendance.findById(attendanceId).populate('records.student');
    if (!doc) return res.status(404).json({ message: 'Attendance document not found' });
    const rec = doc.records.id(recordId);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    rec.status = status;
    await doc.save();
    // regenerate export for the date
    await regenerateExportForDate(doc.date, doc.department, doc.section);
    return res.json({ message: 'Record updated', record: rec });
  } catch (err) {
    console.error('Update record error', err);
    return res.status(500).json({ message: 'Server error updating record' });
  }
});

// Delete a single attendance record
router.delete('/:attendanceId/records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { attendanceId, recordId } = req.params;
    const doc = await Attendance.findById(attendanceId).populate('records.student');
    if (!doc) return res.status(404).json({ message: 'Attendance document not found' });
    const rec = doc.records.id(recordId);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    rec.remove();
    await doc.save();
    // regenerate export for the date
    await regenerateExportForDate(doc.date, doc.department, doc.section);
    return res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error('Delete record error', err);
    return res.status(500).json({ message: 'Server error deleting record' });
  }
});

module.exports = router;

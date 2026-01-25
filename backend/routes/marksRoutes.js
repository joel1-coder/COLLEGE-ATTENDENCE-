const express = require('express');
const router = express.Router();
const Marks = require('../models/Marks');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/marks  - save marks for a date+department+section
// Supports optional `description` and `merge` flag. If a marks document
// with the same date+department+section+description already exists and
// `merge` is not true, the route returns 409 to let the client confirm.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, department, section, records, description, merge } = req.body || {};
    if (!date || !Array.isArray(records)) return res.status(400).json({ message: 'date and records are required' });

    let doc = null;

    if (description) {
      const existingWithDesc = await Marks.findOne({ date, department, section, description });
      if (existingWithDesc && !merge) {
        return res.status(409).json({ message: 'Marks with this description already exist for the same date/department/section', existingId: existingWithDesc._id });
      }
      if (existingWithDesc && merge) {
        doc = existingWithDesc;
      } else {
        // create new doc for this description
        doc = await Marks.findOne({ date, department, section, description: { $exists: false } });
        if (!doc) doc = new Marks({ date, department, section, description, records: [] });
        else doc.description = description;
      }
    } else {
      // legacy behaviour: single doc per date+dept+section
      doc = await Marks.findOne({ date, department, section });
      if (!doc) doc = new Marks({ date, department, section, records: [] });
    }

    // upsert records into selected doc
    for (const rec of records) {
      const sid = String(rec.student);
      const existing = doc.records.find(r => String(r.student) === sid);
      if (existing) existing.mark = rec.mark;
      else doc.records.push({ student: rec.student, mark: rec.mark });
    }
    // ensure description set when provided
    if (description) doc.description = description;

    await doc.save();
    return res.json({ message: 'Marks saved', doc });
  } catch (err) {
    console.error('Marks save error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/marks?date=YYYY-MM-DD&department=...&section=...
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, department, section } = req.query;
    if (!date || !department || !section) return res.status(400).json({ message: 'date, department and section required' });
    const doc = await Marks.find({ date, department, section }).populate('records.student');
    return res.json(doc || { records: [] });
  } catch (err) {
    console.error('Marks fetch error', err);
    return res.status(500).json({ message: 'Server error' });
  } 
});

module.exports = router;

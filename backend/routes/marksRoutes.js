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
    // return all marks documents for the date+department+section (supports multiple submissions per day)
    const filter = { date, department, section };
    const docs = await Marks.find(filter).sort({ createdAt: -1 }).populate('records.student');
    return res.json(Array.isArray(docs) ? docs : []);
  } catch (err) {
    console.error('Marks fetch error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/marks/:marksId/records/:recordId  - update a single mark
router.put('/:marksId/records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { marksId, recordId } = req.params;
    const { mark } = req.body || {};
    if (mark === undefined) return res.status(400).json({ message: 'mark is required' });
    const doc = await Marks.findById(marksId).populate('records.student');
    if (!doc) return res.status(404).json({ message: 'Marks document not found' });
    const rec = doc.records.id(recordId);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    rec.mark = mark;
    await doc.save();
    return res.json({ message: 'Record updated', record: rec });
  } catch (err) {
    console.error('Update mark error', err);
    return res.status(500).json({ message: 'Server error updating record' });
  }
});

// DELETE /api/marks/:marksId/records/:recordId  - delete a single mark record
router.delete('/:marksId/records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { marksId, recordId } = req.params;
    const doc = await Marks.findById(marksId).populate('records.student');
    if (!doc) return res.status(404).json({ message: 'Marks document not found' });
    const rec = doc.records.id(recordId);
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    rec.remove();
    await doc.save();
    return res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error('Delete mark error', err);
    return res.status(500).json({ message: 'Server error deleting record' });
  }
});

module.exports = router;

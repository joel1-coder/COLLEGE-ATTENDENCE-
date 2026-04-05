// ===========================================================
// marksRoutes.js — Backend API routes for Marks
// 
// 💡 BEGINNER EXPLANATION:
// Routes = URL patterns that your Express server listens to.
// When the frontend sends a request to /api/marks, this file handles it.
//
// We added a PUT route (line ~90) which was MISSING before.
// PUT = "Update an existing record" (different from POST = "Create new")
// ===========================================================

const express = require('express');
const router = express.Router();
const Marks = require('../models/Marks');
const authMiddleware = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────
// POST /api/marks  — Save marks for a date+department+section
// This is the ORIGINAL route. It creates OR updates mark records.
// ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, department, section, records, description, merge } = req.body || {};
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'date and records are required' });
    }

    let doc = null;

    if (description) {
      const existingWithDesc = await Marks.findOne({ date, department, section, description });
      if (existingWithDesc && !merge) {
        return res.status(409).json({
          message: 'Marks with this description already exist for the same date/department/section',
          existingId: existingWithDesc._id
        });
      }
      if (existingWithDesc && merge) {
        doc = existingWithDesc;
      } else {
        doc = await Marks.findOne({ date, department, section, description: { $exists: false } });
        if (!doc) doc = new Marks({ date, department, section, description, records: [] });
        else doc.description = description;
      }
    } else {
      doc = await Marks.findOne({ date, department, section });
      if (!doc) doc = new Marks({ date, department, section, records: [] });
    }

    // Upsert records into selected doc
    for (const rec of records) {
      const sid = String(rec.student);
      const existing = doc.records.find(r => String(r.student) === sid);
      if (existing) existing.mark = rec.mark;
      else doc.records.push({ student: rec.student, mark: rec.mark });
    }

    if (description) doc.description = description;

    await doc.save();
    return res.json({ message: 'Marks saved', doc });
  } catch (err) {
    console.error('Marks save error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/marks?date=YYYY-MM-DD&department=...&section=...
// Returns all mark documents for the given filters.
// ─────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, department, section } = req.query;
    if (!date || !department || !section) {
      return res.status(400).json({ message: 'date, department and section required' });
    }
    const docs = await Marks.find({ date, department, section }).populate('records.student');
    return res.json(docs || []);
  } catch (err) {
    console.error('Marks fetch error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/marks/:id  — UPDATE an existing marks document
//
// 💡 BEGINNER: This is the NEW route we added to fix "Save failed".
//
// WHY was "Save failed" happening?
//   The MarkRecord page was calling PUT /api/marks/:id (update),
//   but this route didn't exist! The server returned a 404 error.
//   We've now created this route so updates work correctly.
//
// HOW PUT works:
//   The frontend sends: { records: [{student: id, mark: value}, ...] }
//   We find the marks document by its _id (the :id in the URL),
//   then update each student's mark in the records array.
// ─────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;  // The marks document ID from the URL
    const { records } = req.body || {};

    // Validate input
    if (!Array.isArray(records)) {
      return res.status(400).json({ message: 'records array is required' });
    }

    // Find the existing marks document
    const doc = await Marks.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Marks document not found' });
    }

    // Update each record's mark value
    // If a student is already in the records array, update their mark
    // If not (shouldn't happen normally), add them
    for (const rec of records) {
      const sid = String(rec.student);
      const existing = doc.records.find(r => String(r.student) === sid);
      if (existing) {
        existing.mark = Number(rec.mark); // Make sure it's a number
      } else {
        doc.records.push({ student: rec.student, mark: Number(rec.mark) });
      }
    }

    // Save the updated document to MongoDB
    await doc.save();

    return res.json({ message: 'Marks updated successfully', doc });
  } catch (err) {
    console.error('Marks update error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
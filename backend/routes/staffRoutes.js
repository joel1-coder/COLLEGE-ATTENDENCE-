const express = require("express");
const bcrypt = require('bcryptjs');
const User = require("../models/User");
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get staff list (admin or authenticated)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(100, Number(limit) || 20));

    const filter = { role: 'staff' };
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ name: re }, { email: re }, { staffId: re }, { department: re }];
    }

    const total = await User.countDocuments(filter);
    const docs = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .skip((pageNum - 1) * lim)
      .limit(lim)
      .sort({ name: 1 });

    res.json({ data: docs, total, page: pageNum, pages: Math.ceil(total / lim) });
  } catch (err) {
    console.error('Fetch staff list error', err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create staff (admin only)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, staffId, department } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const exists = await User.findOne({ $or: [{ email }, { staffId }] });
    if (exists) {
      if (exists.email === email) return res.status(409).json({ message: 'User with this email already exists' });
      if (staffId && exists.staffId === staffId) return res.status(409).json({ message: 'User with this staffId already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: 'staff', staffId, department });
    await user.save();
    return res.json({ message: 'Staff created', user: { _id: user._id, name: user.name, email: user.email, role: user.role, staffId: user.staffId, department: user.department } });
  } catch (err) {
    console.error('Create staff error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update staff (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, password, staffId, department } = req.body || {};
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Staff not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (staffId) user.staffId = staffId;
    if (department) user.department = department;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    return res.json({ message: 'Staff updated', user: { _id: user._id, name: user.name, email: user.email, staffId: user.staffId, department: user.department } });
  } catch (err) {
    console.error('Update staff error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete staff (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Staff not found' });
    await User.deleteOne({ _id: id });
    return res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error('Delete staff error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

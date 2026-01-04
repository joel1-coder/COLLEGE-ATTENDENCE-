const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require('../middleware/authmiddleware');

const router = express.Router();
const crypto = require('crypto');

// helper: send reset email (falls back to console log if SMTP not configured)
async function sendResetEmail(toEmail, resetLink) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  // require nodemailer only when SMTP is configured
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    console.warn('nodemailer not installed; password reset link will be logged to console');
    console.log(`Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: toEmail,
    subject: 'Password reset',
    text: `Reset your password using this link: ${resetLink}`,
    html: `Reset your password using this link: <a href="${resetLink}">${resetLink}</a>`,
  });
}

// Login (admin & staff)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // sign JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'change_this_secret',
      { expiresIn: '8h' }
    );

    res.json({
      message: "Login successful",
      role: user.role,
      userId: user._id,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// Verify token and return user info (used by frontend on startup)
router.get('/verify', auth, async (req, res) => {
  try {
    // auth middleware attaches `req.user`
    return res.json({ valid: true, user: req.user });
  } catch (err) {
    return res.status(401).json({ valid: false });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // respond 200 to avoid leaking whether account exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontend}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendResetEmail(email, resetLink);

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgot-password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ message: 'email, token and newPassword are required' });

    const user = await User.findOne({ email, passwordResetToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid token or email' });
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) return res.status(400).json({ message: 'Token expired' });

    const hash = await require('bcryptjs').hash(newPassword, 10);
    user.password = hash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('reset-password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

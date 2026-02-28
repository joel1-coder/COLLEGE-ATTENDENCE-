const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

/* helper: send reset email */
async function sendResetEmail(toEmail, resetLink) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    console.log(`Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@example.com",
    to: toEmail,
    subject: "Password reset",
    text: `Reset your password: ${resetLink}`,
    html: `<a href="${resetLink}">${resetLink}</a>`,
  });
}

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      role: user.role,
      userId: user._id,
      token,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* VERIFY TOKEN */
router.get("/verify", auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If that email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save();

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontend}/reset-password?token=${token}&email=${email}`;
    await sendResetEmail(email, resetLink);

    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ✅ EXPORT AT THE VERY END */
module.exports = router;

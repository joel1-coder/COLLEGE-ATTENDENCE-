const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();
const existingUser = await User.findOne({ email });
if (existingUser) {
  return res.status(400).json({ message: "User already exists" });
}


router.post("/create-user", async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    role,
  });

  await user.save();

  res.json({ message: "User created" });
});

module.exports = router;

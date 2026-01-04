require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const email = 'admin@example.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('User already exists:', existing.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash('password', 10);

  const user = new User({
    name: 'Admin',
    email,
    password: hashed,
    role: 'admin',
  });

  await user.save();
  console.log('Created user', email);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

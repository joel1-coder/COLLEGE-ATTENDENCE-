require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';

async function run() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error('Usage: node createAdmin.js <email> <password>');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email });
  if (existing) {
    console.error('User already exists:', existing.email);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name: 'Admin',
    email,
    password: hashed,
    role: 'admin',
  });

  await user.save();
  console.log('Created admin user', email);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

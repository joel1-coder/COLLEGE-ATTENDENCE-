require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find();
  for (const u of users) {
    if (!u.password || u.password.startsWith('$2')) continue;
    const hashed = await bcrypt.hash(u.password, 10);
    u.password = hashed;
    await u.save();
    console.log('Hashed password for', u.email);
  }

  console.log('Done');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });

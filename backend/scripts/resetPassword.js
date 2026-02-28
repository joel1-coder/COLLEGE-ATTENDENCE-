const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');

dotenv.config();

async function usage() {
  console.log('Usage: node resetPassword.js <email> <newPassword>');
  console.log('If <newPassword> is omitted the script will prompt for it.');
}

async function promptPassword() {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write('Enter new password: ');
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.once('data', function (data) {
      stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    await usage();
    process.exit(1);
  }
  const email = args[0];
  let newPassword = args[1];

  if (!newPassword) {
    newPassword = await promptPassword();
    if (!newPassword) {
      console.error('No password provided');
      process.exit(1);
    }
  }

  const MONGO = process.env.MONGO_URI;
  if (!MONGO) {
    console.error('Missing MONGO_URI in environment. Set it in .env or the environment.');
    process.exit(1);
  }

  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(1);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    console.log('Password updated for', email);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();

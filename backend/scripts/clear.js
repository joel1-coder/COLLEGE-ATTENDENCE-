/**
 * Database cleanup script – run with: node scripts/clear.js
 * Removes all seeded data and leaves only default admin & staff accounts.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Department = require('../models/Department');
const Section = require('../models/Section');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Class = require('../models/Class');
const Staff = require('../models/Staff');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

// Default accounts to preserve/create
const ADMIN = { name: 'Admin', email: 'admin@school.edu', password: 'Admin@123', role: 'admin' };
const STAFF = { name: 'Staff User', email: 'staff@school.edu', password: 'Staff@123', role: 'staff' };

async function clearDb() {
  console.log('\n🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('   Connected ✅\n');

  console.log('🧹 Clearing collections...');
  
  await Attendance.deleteMany({});
  console.log('   - Attendance deleted');

  await Marks.deleteMany({});
  console.log('   - Marks deleted');

  await Student.deleteMany({});
  console.log('   - Student deleted');

  await Section.deleteMany({});
  console.log('   - Section deleted');

  await Department.deleteMany({});
  console.log('   - Department deleted');

  await Class.deleteMany({});
  console.log('   - Class deleted');

  await Staff.deleteMany({});
  console.log('   - Staff deleted');

  await User.deleteMany({});
  console.log('   - Users deleted');

  // Re-create default accounts
  for (const u of [ADMIN, STAFF]) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
    console.log(`   ✅ Restored ${u.role}: ${u.email}  /  ${u.password}`);
  }

  console.log('\n🎉 Database cleared successfully!');
  console.log('  You can now log in using these default credentials to add fresh data:\n');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  Role   │  Email              │  Password    │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log('  │  Admin  │  admin@school.edu   │  Admin@123   │');
  console.log('  │  Staff  │  staff@school.edu   │  Staff@123   │');
  console.log('  └─────────────────────────────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

clearDb().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});

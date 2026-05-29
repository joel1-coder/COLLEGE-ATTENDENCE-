/**
 * Seed script – run with:  node scripts/seed.js
 * Populates a fresh local MongoDB with demo data.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User       = require('../models/User');
const Department = require('../models/Department');
const Section    = require('../models/Section');
const Student    = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Attendance';

// ── Demo accounts ──────────────────────────────────────────────────────────
const ADMIN = { name: 'Admin',       email: 'admin@school.edu',  password: 'Admin@123', role: 'admin' };
const STAFF = { name: 'Staff User',  email: 'staff@school.edu',  password: 'Staff@123', role: 'staff' };

// ── Departments & sections ──────────────────────────────────────────────────
const DEPARTMENTS = ['CS', 'IT'];
const SECTIONS    = ['A', 'B'];

// ── Student name pool (used to generate realistic names) ───────────────────
const FIRST = [
  'Arun','Bala','Divya','Elan','Fathima','Gopal','Harini','Inba','Jeeva','Kavi',
  'Lakshmi','Mani','Nisha','Oviya','Priya','Rajan','Saranya','Tamil','Uma','Vijay',
];
const LAST = ['Kumar','Raj','Devi','Shankar','Murugan','Pillai','Pandi','Vel','Ganesan','Nathan'];

function pickName(i) {
  return `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
}

async function seed() {
  console.log('\n🌱 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('   Connected ✅\n');

  // ── 1. Users ────────────────────────────────────────────────────────────
  for (const u of [ADMIN, STAFF]) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`   ⚠  User already exists: ${u.email}`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
    console.log(`   ✅ Created ${u.role}: ${u.email}  /  ${u.password}`);
  }

  // ── 2. Departments ───────────────────────────────────────────────────────
  for (const deptName of DEPARTMENTS) {
    const exists = await Department.findOne({ name: deptName });
    if (!exists) {
      await Department.create({ name: deptName });
      console.log(`   ✅ Department: ${deptName}`);
    } else {
      console.log(`   ⚠  Department already exists: ${deptName}`);
    }
  }

  // ── 3. Sections ──────────────────────────────────────────────────────────
  for (const deptName of DEPARTMENTS) {
    for (const secName of SECTIONS) {
      const exists = await Section.findOne({ name: secName, department: deptName });
      if (!exists) {
        await Section.create({ name: secName, department: deptName });
        console.log(`   ✅ Section: ${deptName} - ${secName}`);
      } else {
        console.log(`   ⚠  Section already exists: ${deptName} - ${secName}`);
      }
    }
  }

  // ── 4. Students (10 per section) ─────────────────────────────────────────
  let studentIndex = 0;
  for (const dept of DEPARTMENTS) {
    for (const sec of SECTIONS) {
      for (let n = 1; n <= 10; n++) {
        const rollNo = `${dept}${sec}${String(n).padStart(3, '0')}`;
        const exists = await Student.findOne({ studentId: rollNo });
        if (!exists) {
          const name = pickName(studentIndex);
          await Student.create({ studentId: rollNo, name, department: dept, section: sec });
          console.log(`   ✅ Student: ${rollNo}  ${name}  (${dept}-${sec})`);
        } else {
          console.log(`   ⚠  Student already exists: ${rollNo}`);
        }
        studentIndex++;
      }
    }
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('  Login credentials:');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  Role   │  Email              │  Password    │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log('  │  Admin  │  admin@school.edu   │  Admin@123   │');
  console.log('  │  Staff  │  staff@school.edu   │  Staff@123   │');
  console.log('  └─────────────────────────────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

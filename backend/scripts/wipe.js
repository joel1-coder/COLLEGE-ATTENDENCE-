/**
 * wipe.js — Wipes ALL data from every collection, including users.
 * After this runs, the app will redirect to /onboarding on next load.
 *
 * Run with:  node scripts/wipe.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User       = require('../models/User');
const Department = require('../models/Department');
const Section    = require('../models/Section');
const Student    = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks      = require('../models/Marks');
const Class      = require('../models/Class');
const Staff      = require('../models/Staff');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI not found in .env');
  process.exit(1);
}

async function wipeAll() {
  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('    Connected ✅\n');

  const collections = [
    { model: Attendance, name: 'Attendance'  },
    { model: Marks,      name: 'Marks'       },
    { model: Student,    name: 'Students'    },
    { model: Section,    name: 'Sections'    },
    { model: Department, name: 'Departments' },
    { model: Class,      name: 'Classes'     },
    { model: Staff,      name: 'Staff'       },
    { model: User,       name: 'Users'       },
  ];

  console.log('🗑️   Wiping all collections...\n');
  for (const { model, name } of collections) {
    const result = await model.deleteMany({});
    console.log(`    ✅  ${name.padEnd(14)} — ${result.deletedCount} documents deleted`);
  }

  console.log('\n🎉  Database is now completely empty!');
  console.log('    The app will now show the onboarding wizard on next page load.\n');

  await mongoose.disconnect();
  process.exit(0);
}

wipeAll().catch((err) => {
  console.error('❌  Wipe failed:', err.message || err);
  process.exit(1);
});

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const students = [
    { studentId: 'S1001', name: 'Alice', class: '10', section: 'A' },
    { studentId: 'S1002', name: 'Bob', class: '10', section: 'A' },
    { studentId: 'S1003', name: 'Charlie', class: '10', section: 'B' }
  ];

  for (const s of students) {
    const exists = await Student.findOne({ studentId: s.studentId });
    if (exists) {
      console.log('Already exists', s.studentId);
      continue;
    }
    await Student.create(s);
    console.log('Created', s.studentId);
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

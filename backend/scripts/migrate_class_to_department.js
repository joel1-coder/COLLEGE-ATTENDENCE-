const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Student = require('../models/Student');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB', uri);

  const students = await Student.find({});
  console.log(`Found ${students.length} students`);

  let updated = 0;
  for (const s of students) {
    if (!s.department && s.class) {
      s.department = s.class;
      await s.save();
      updated++;
    }
  }

  console.log(`Updated ${updated} student(s) with department field`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration error', err);
  process.exit(1);
});

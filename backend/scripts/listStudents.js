const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Student = require('../models/Student');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB', uri);
  const students = await Student.find().sort('studentId');
  if (!students.length) {
    console.log('No students found');
  } else {
    console.log(`Found ${students.length} students:`);
    students.forEach(s => {
      console.log('-', s.studentId, '|', s.name, '| class:', s.class, 'section:', s.section);
    });
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error listing students', err);
  process.exit(1);
});

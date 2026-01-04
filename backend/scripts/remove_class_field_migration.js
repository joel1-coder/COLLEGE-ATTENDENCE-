const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Student = require('../models/Student');
const Section = require('../models/Section');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB', uri);

  // Remove `class` field from students
  const studentsResult = await Student.updateMany({ class: { $exists: true } }, { $unset: { class: "" } });
  console.log('Students updated (class unset):', studentsResult.modifiedCount || studentsResult.nModified || studentsResult.n);

  // Rename Section.className -> department (if documents still use className)
  const sectionsWithClass = await Section.updateMany({ className: { $exists: true } }, [
    { $set: { department: "$className" } },
    { $unset: "className" }
  ]);
  console.log('Sections updated (className -> department):', sectionsWithClass.modifiedCount || sectionsWithClass.nModified || sectionsWithClass.n);

  await mongoose.disconnect();
  console.log('Migration completed');
}

main().catch(err => {
  console.error('Migration error', err);
  process.exit(1);
});

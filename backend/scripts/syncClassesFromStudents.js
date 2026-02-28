const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Student = require('../models/Student');
const Department = require('../models/Department');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attenance';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB', uri);

  const classes = await Student.distinct('class');
  console.log('Distinct classes from students:', classes);

  for (const cname of classes) {
    if (!cname) continue;
    const existing = await Department.findOne({ name: cname });
    if (existing) {
      console.log('Department exists:', cname);
      continue;
    }
    await Department.create({ name: cname });
    console.log('Created department:', cname);
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error('Error syncing classes', err);
  process.exit(1);
});

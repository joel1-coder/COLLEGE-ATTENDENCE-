const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Department = require('../models/Department');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/attenance';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const depts = await Department.find().sort('name');
  console.log('Departments in DB:');
  depts.forEach(d => console.log('-', d.name));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error listing classes', err);
  process.exit(1);
});

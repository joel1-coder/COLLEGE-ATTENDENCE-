const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    description: { type: String },
    department: { type: String },
    section: { type: String },
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        mark: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Marks || mongoose.model('Marks', marksSchema);

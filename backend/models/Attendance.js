const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    description: { type: String },
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        status: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
}, { timestamps: true });

// unique per department
sectionSchema.index({ department: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);

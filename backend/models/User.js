const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
      email: { type: String, unique: true },
      staffId: { type: String, unique: true, sparse: true },
      department: { type: String },
    password: String,
      passwordResetToken: String,
      passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["admin", "staff"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

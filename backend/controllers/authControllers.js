const Attendance = require("../models/Attendance");

// ======================
// MARK Attendance
// ======================
exports.markAttendance = async (req, res) => {
  try {
    const { staffId, studentId, status, date } = req.body;

    if (!staffId || !studentId || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const AttendanceDate = date ? new Date(date) : new Date();
    AttendanceDate.setHours(0, 0, 0, 0);

    const Attendance = new Attendance({
      staff: staffId,
      studentId,
      status,
      date: AttendanceDate,
    });

    await Attendance.save();

    res.status(201).json({
      message: "Attendance marked successfully",
      Attendance,
    });
  } catch (error) {
    console.error("Error marking Attendance ❌", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// GET Attendance BY DATE
// ======================
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { staffId, date } = req.query;

    if (!staffId || !date) {
      return res.status(400).json({ message: "staffId and date required" });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const Attendance = await Attendance.find({
      staff: staffId,
      date: queryDate,
    });

    res.status(200).json(Attendance);
  } catch (error) {
    console.error("Fetch Attendance error ❌", error);
    res.status(500).json({ message: "Server error" });
  }
};

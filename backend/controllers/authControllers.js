const Attendance = require("../models/Attendance");

// ======================
// MARK ATTENDANCE
// ======================
exports.markAttendance = async (req, res) => {
  try {
    const { staffId, studentId, status, date } = req.body;

    if (!staffId || !studentId || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = new Attendance({
      staff: staffId,
      studentId,
      status,
      date: attendanceDate,
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error marking attendance ❌", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// GET ATTENDANCE BY DATE
// ======================
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { staffId, date } = req.query;

    if (!staffId || !date) {
      return res.status(400).json({ message: "staffId and date required" });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      staff: staffId,
      date: queryDate,
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Fetch attendance error ❌", error);
    res.status(500).json({ message: "Server error" });
  }
};

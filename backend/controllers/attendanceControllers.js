const Attendance = require("../models/Attendance");

exports.markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;

    const AttendanceDate = new Date(date);
    AttendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map((r) => ({
      updateOne: {
        filter: {
          student: r.student,
          date: AttendanceDate,
        },
        update: {
          $set: {
            status: r.status,
            date: AttendanceDate,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    res.json({ message: "Attendance saved successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Attendance save failed ❌" });
  }
};

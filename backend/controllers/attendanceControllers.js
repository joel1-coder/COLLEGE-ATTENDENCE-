const Attendance = require("../models/Attendance");

exports.markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map((r) => ({
      updateOne: {
        filter: {
          student: r.student,
          date: attendanceDate,
        },
        update: {
          $set: {
            status: r.status,
            date: attendanceDate,
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

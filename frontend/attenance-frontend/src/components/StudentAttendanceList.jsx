import { useState } from "react";

const dummyStudents = [
  { id: "STU001", name: "John Doe" },
  { id: "STU002", name: "Mary Jane" },
  { id: "STU003", name: "Alex Smith" },
  { id: "STU004", name: "Priya Kumar" },
];

export default function StudentAttendanceList({ onSubmit }) {
  const [Attendance, setAttendance] = useState({});

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSubmit = () => {
    const result = dummyStudents.map((s) => ({
      studentId: s.id,
      status: Attendance[s.id] ? "Present" : "Absent",
    }));

    onSubmit(result);
  };

  return (
    <div>
      <h3>Student Attendance</h3>

      {dummyStudents.map((student) => (
        <div key={student.id} style={{ marginBottom: "8px" }}>
          <label>
            <input
              type="checkbox"
              checked={Attendance[student.id] || false}
              onChange={() => toggleAttendance(student.id)}
            />
            {"  "}
            {student.name} ({student.id})
          </label>
        </div>
      ))}

      <button onClick={handleSubmit}>Submit Attendance</button>
    </div>
  );
}

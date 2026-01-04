import React from "react";

export default function StudentRow({ student, toggleStatus }) {
  return (
    <tr>
      <td>{student.studentId}</td>
      <td>{student.name}</td>
      <td>
        <button
          onClick={() => toggleStatus(student.studentId)}
          style={{
            backgroundColor: student.status === "Present" ? "green" : "red",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {student.status}
        </button>
      </td>
    </tr>
  );
}

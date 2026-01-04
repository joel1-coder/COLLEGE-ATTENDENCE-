import { useState } from "react";
import api from "../api/axiosConfig";

const AttendanceView = () => {
  const [date, setDate] = useState("");
  const [records, setRecords] = useState([]);

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/attendance/date/${date}`);
      setRecords(res.data);
    } catch (err) {
      alert("Error fetching attendance");
    }
  };

  return (
    <div>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button onClick={fetchAttendance}>View</button>

      <ul>
        {records.map((r) => (
          <li key={r._id}>
            Staff: {r.staffId} | Status: {r.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttendanceView;

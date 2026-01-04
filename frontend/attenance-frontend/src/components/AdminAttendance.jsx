import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AttendanceForm.css";

const AdminAttendance = () => {
  // default to today
  const todayIso = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayIso);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    setIsAdmin(stored?.role === 'admin');

    const fetchAttendance = async () => {
      if (!date) return;

      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`http://localhost:5000/api/attendance?date=${date}`);
        // API returns an attendance document or {}. Use its `records` array or empty array.
        const attendance = res.data || {};
        setRecords(Array.isArray(attendance.records) ? attendance.records : []);
      } catch (err) {
        setError("Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [date]);

  // safe debug: records is an array of attendance rows
  // console.log example: records[0]?.status
  return (
    <div className="attendance-container">
      <h2>Admin Attendance View</h2>

      <div className="filter-row">
        <label>Select Date:</label>
        <select value={date} onChange={(e) => setDate(e.target.value)}>
          {(() => {
            const opts = [];
            for (let i = 0; i < 14; i++) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const iso = d.toISOString().split('T')[0];
              const display = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
              opts.push(<option key={iso} value={iso}>{display}</option>);
            }
            return opts;
          })()}
        </select>
        {isAdmin && (
          <div style={{ marginLeft: 12 }}>
            <button
              disabled={actionLoading}
              onClick={async () => {
                if (!window.confirm(`Reset attendance for ${date}? This will delete records.`)) return;
                try {
                  setActionLoading(true);
                  const api = axios.create({ baseURL: 'http://localhost:5000/api' });
                  const stored = JSON.parse(localStorage.getItem('user')) || null;
                  if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
                  await api.post('/attendance/reset', { date, action: 'reset' });
                  setRecords([]);
                } catch (err) {
                  setError('Failed to reset attendance');
                  if (err?.response && (err.response.status === 401 || err.response.status === 403)) window.location.href = '/admin/login';
                } finally { setActionLoading(false); }
              }}
            >{actionLoading ? 'Processing...' : 'Reset'}</button>

            <button
              disabled={actionLoading}
              style={{ marginLeft: 8 }}
              onClick={async () => {
                if (!window.confirm(`Reopen attendance for ${date}? This clears records but keeps the entry.`)) return;
                try {
                  setActionLoading(true);
                  const api = axios.create({ baseURL: 'http://localhost:5000/api' });
                  const stored = JSON.parse(localStorage.getItem('user')) || null;
                  if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
                  await api.post('/attendance/reset', { date, action: 'reopen' });
                  setRecords([]);
                } catch (err) {
                  setError('Failed to reopen attendance');
                  if (err?.response && (err.response.status === 401 || err.response.status === 403)) window.location.href = '/admin/login';
                } finally { setActionLoading(false); }
              }}
            >Reopen</button>
          </div>
        )}
      </div>

      {loading && <p>Loading attendance...</p>}
      {error && <p className="error">{error}</p>}

      {records.length > 0 && (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
                <th>Department</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
            <tbody>
            {records.map((row) => {
              const sid = row._id || (row.student && row.student._id) || JSON.stringify(row);
              const isToggling = togglingIds.has(String(sid));
              const status = row.status || 'absent';
              return (
              <tr key={sid}>
                <td>{row.student?.studentId}</td>
                <td>{row.student?.name}</td>
                <td>{row.student?.department}</td>
                <td>{row.student?.section}</td>
                <td>
                  <button
                    disabled={isToggling}
                    className={status === 'present' ? 'status-present' : 'status-absent'}
                    onClick={async () => {
                      try {
                        const newStatus = status === 'present' ? 'absent' : 'present';
                        // optimistic UI
                        setRecords(prev => prev.map(r => (r === row ? { ...r, status: newStatus } : r)));
                        setTogglingIds(prev => new Set([...prev, String(sid)]));

                        const api = axios.create({ baseURL: 'http://localhost:5000/api' });
                        const stored = JSON.parse(localStorage.getItem('user')) || null;
                        if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;

                        const studentId = row.student?._id || row.student || row.studentId || null;
                        await api.post('/attendance', { date, records: [{ student: studentId, status: newStatus }] });
                      } catch (err) {
                        // revert on error
                        setRecords(prev => prev.map(r => (r === row ? { ...r, status } : r)));
                        setError('Failed to update attendance');
                        if (err?.response && (err.response.status === 401 || err.response.status === 403)) window.location.href = '/admin/login';
                      } finally {
                        setTogglingIds(prev => {
                          const s = new Set(prev);
                          s.delete(String(sid));
                          return s;
                        });
                      }
                    }}
                  >
                    {isToggling ? 'Saving...' : status}
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && date && records.length === 0 && (
        <p>No attendance found for this date.</p>
      )}
    </div>
  );
};

export default AdminAttendance;

import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';

const AdminAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin] = useState(true);

  // 💡 Replaced plain setError with toast notifications
  const { toasts, toast, removeToast } = useToast();

  const makeApi = () => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const api = makeApi();
        const res = await api.get(`/attendance?date=${date}`);
        const attendance = Array.isArray(res.data) ? res.data[0] : res.data;
        const recs = attendance?.records || [];
        setRecords(recs);

        if (departments.length === 0 && recs.length > 0) {
          const depts = [...new Set(recs.map(r => r.student?.department).filter(Boolean))];
          setDepartments(depts);
        }
      } catch (err) {
        toast.error("Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [date]);

  const filteredRecords = records.filter(r => {
    if (department && r.student?.department !== department) return false;
    if (section && r.student?.section !== section) return false;
    return true;
  });

  return (
    <div className="attendance-container">
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

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

        <label style={{ marginLeft: 12 }}>Department:</label>
        <select value={department} onChange={(e) => { setDepartment(e.target.value); setSection(''); }}>
          <option value="">All</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <label style={{ marginLeft: 12 }}>Section:</label>
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">All</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {isAdmin && (
          <div style={{ marginLeft: 12 }}>
            <button
              disabled={actionLoading}
              onClick={async () => {
                if (!window.confirm(`Reset attendance for ${date}?`)) return;
                try {
                  setActionLoading(true);
                  await makeApi().post('/attendance/reset', { date, action: 'reset' });
                  setRecords([]);
                  toast.success(`Attendance for ${date} has been reset`);
                } catch (err) {
                  toast.error('Failed to reset attendance');
                  if (err?.response && (err.response.status === 401 || err.response.status === 403))
                    window.location.href = '/admin/login';
                } finally { setActionLoading(false); }
              }}
            >{actionLoading ? 'Processing...' : 'Reset'}</button>

            <button
              disabled={actionLoading}
              style={{ marginLeft: 8 }}
              onClick={async () => {
                if (!window.confirm(`Reopen attendance for ${date}?`)) return;
                try {
                  setActionLoading(true);
                  await makeApi().post('/attendance/reset', { date, action: 'reopen' });
                  setRecords([]);
                  toast.success(`Attendance for ${date} has been reopened`);
                } catch (err) {
                  toast.error('Failed to reopen attendance');
                  if (err?.response && (err.response.status === 401 || err.response.status === 403))
                    window.location.href = '/admin/login';
                } finally { setActionLoading(false); }
              }}
            >Reopen</button>
          </div>
        )}
      </div>

      {loading && <p>Loading attendance...</p>}

      {filteredRecords.length > 0 && (
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
            {filteredRecords.map((row) => {
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
                          setRecords(prev => prev.map(r => (r === row ? { ...r, status: newStatus } : r)));
                          setTogglingIds(prev => new Set([...prev, String(sid)]));
                          const studentId = row.student?._id || row.student || row.studentId || null;
                          await makeApi().post('/attendance', { date, records: [{ student: studentId, status: newStatus }] });
                          toast.success(`Status changed to "${newStatus}" for ${row.student?.name}`);
                        } catch (err) {
                          setRecords(prev => prev.map(r => (r === row ? { ...r, status } : r)));
                          toast.error('Failed to update attendance status');
                          if (err?.response && (err.response.status === 401 || err.response.status === 403))
                            window.location.href = '/admin/login';
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
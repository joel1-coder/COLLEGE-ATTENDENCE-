import { useState, useEffect } from "react";
import api from "../api/api";

const AttendanceView = () => {
  const [date, setDate] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [attendanceDocs, setAttendanceDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAttendance = async () => {
    if (!date) return alert('Choose a date');
    setLoading(true);
    setErrorMessage("");
    try {
      let url = `/attendance?date=${date}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (section) url += `&section=${encodeURIComponent(section)}`;
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
      const res = await api.get(url, { headers });
      setAttendanceDocs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch attendance error', err);
      setErrorMessage(err?.response?.data?.message || err.message || 'Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
        const res = await api.get('/admin/departments', { headers });
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Load departments error', err);
        setDepartments([]);
        setErrorMessage('Could not load departments');
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      if (!department) return setSections([]);
      try {
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
        const res = await api.get(`/admin/sections?department=${encodeURIComponent(department)}`, { headers });
        setSections(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Load sections error', err);
        setSections([]);
        setErrorMessage('Could not load sections');
      }
    };
    loadSections();
  }, [department]);

  /*
    ✅ toggleStatus:
    - Gets called when user CLICKS the status button
    - Figures out the NEW status (opposite of current)
    - Sends a PUT request to the backend to save the change
    - Then re-fetches attendance so the UI updates
    - NO dropdown needed — one click does everything!
  */
  const toggleStatus = async (attendanceId, recordId, currentStatus) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
      await api.put(`/attendance/${attendanceId}/records/${recordId}`, { status: newStatus }, { headers });
      await fetchAttendance();
    } catch (err) {
      console.error('Update status error', err);
      alert('Failed to update status');
    }
  };

  const deleteRecord = async (attendanceId, recordId) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
      await api.delete(`/attendance/${attendanceId}/records/${recordId}`, { headers });
      await fetchAttendance();
    } catch (err) {
      console.error('Delete record error', err);
      alert('Failed to delete record');
    }
  };

  return (
    <div>
      {/* ---- Filters ---- */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <select value={department} onChange={(e) => { setDepartment(e.target.value); setSection(''); }}>
          <option value="">All Departments</option>
          {departments.map((d) => {
            const name = (typeof d === 'string') ? d : (d.name || d);
            const key = (d && d._id) ? d._id : name;
            return <option key={key} value={name}>{name}</option>;
          })}
        </select>

        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">All Sections</option>
          {sections.map((s) => {
            const name = (typeof s === 'string') ? s : (s.name || s);
            const key = (s && s._id) ? s._id : name;
            return <option key={key} value={name}>{name}</option>;
          })}
        </select>

        <button onClick={fetchAttendance}>Fetch</button>
      </div>

      {loading && <p>Loading...</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {/* ---- Attendance Tables ---- */}
      {attendanceDocs.map((doc, di) => (
        <div key={doc._id || di} style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 8 }}>
            {doc.department} — {doc.section} &nbsp;|&nbsp; {doc.date?.slice(0, 10)}
            {doc.description && <span style={{ fontWeight: 400, marginLeft: 8, color: '#666' }}>({doc.description})</span>}
          </h4>

          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: 6 }}>#</th>
                <th style={{ border: '1px solid #ddd', padding: 6 }}>Student ID</th>
                <th style={{ border: '1px solid #ddd', padding: 6 }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: 6 }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: 6 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {(doc.records || []).map((r, i) => {
                const s = r.student || {};
                const sid = s.studentId || (s._id ? String(s._id) : '');
                const name = (s.firstName || s.lastName)
                  ? `${s.firstName || ''} ${s.lastName || ''}`.trim()
                  : (s.name || '');

                return (
                  <tr key={r._id || i}>
                    <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{sid}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{name}</td>

                    <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>
                      {/*
                        🎨 HOW THE COLOR BUTTON WORKS HERE:
                        - r.status is either "present" or "absent" (comes from the database)
                        - We use inline styles to set background color:
                            present → Blue  (#3b82f6)
                            absent  → Red   (#ef4444)
                        - Clicking calls toggleStatus() which flips present ↔ absent in the DB
                        - The icon ✔ shows for present, ✘ shows for absent
                        - No dropdown anywhere — just one click!
                      */}
                      <button
                        onClick={() => toggleStatus(doc._id, r._id, r.status)}
                        style={{
                          background: r.status === 'present' ? '#3b82f6' : '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 20,
                          padding: '4px 16px',
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'background 0.2s, transform 0.1s',
                          minWidth: 90,
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {r.status === 'present' ? '✔ Present' : '✘ Absent'}
                      </button>
                    </td>

                    <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'center' }}>
                      <button
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: 6,
                          padding: '3px 10px',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                        onClick={() => deleteRecord(doc._id, r._id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default AttendanceView;
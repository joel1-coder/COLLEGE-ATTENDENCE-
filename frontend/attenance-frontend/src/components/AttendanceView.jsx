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
      console.log('Fetching attendance', { url, headers });
      const res = await api.get(url, { headers });
      // res.data is an array of attendance documents
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
        console.log('Loading departments with headers', headers);
        const res = await api.get('/admin/departments', { headers });
        console.log('Departments response', res.data);
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
        console.log('Loading sections for', department, headers);
        const res = await api.get(`/admin/sections?department=${encodeURIComponent(department)}`, { headers });
        console.log('Sections response', res.data);
        setSections(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Load sections error', err);
        setSections([]);
        setErrorMessage('Could not load sections');
      }
    };
    loadSections();
  }, [department]);

  const toggleStatus = async (attendanceId, recordId, currentStatus) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
      await api.put(`/attendance/${attendanceId}/records/${recordId}`, { status: newStatus }, { headers });
      // refresh
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

        <button onClick={fetchAttendance} disabled={loading}>Fetch</button>
      </div>

      {loading && <div>Loading...</div>}
      {errorMessage && <div style={{ color: 'red', marginTop: 8 }}>{errorMessage}</div>}

      {attendanceDocs.map((doc) => (
        <div key={doc._id} style={{ border: '1px solid #ddd', marginTop: 12, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{doc.description || 'Attendance'}</strong>
              <div style={{ fontSize: 12, color: '#666' }}>{doc.date} {doc.department ? `• ${doc.department}` : ''} {doc.section ? `• ${doc.section}` : ''}</div>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
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
                const name = (s.firstName || s.lastName) ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : (s.name || '');
                return (
                  <tr key={r._id || i}>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{i+1}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{sid}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{name}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{r.status}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>
                      <button onClick={() => toggleStatus(doc._id, r._id, r.status)}>Toggle</button>
                      <button style={{ marginLeft: 8 }} onClick={() => deleteRecord(doc._id, r._id)}>Delete</button>
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

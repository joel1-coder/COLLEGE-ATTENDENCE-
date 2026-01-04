import React, { useState } from 'react';
import api from '../api/api';

export default function EditAddStudent(){
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStudent = async () => {
    setMessage('');
    if (!studentId) return setMessage('StudentID is required');
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const instance = api;
      if (stored?.token) instance.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      const resp = await instance.get(`/students/${encodeURIComponent(studentId)}`);
      const s = resp.data;
      if (!s || !s.studentId) return setMessage('Student not found');
      setStudent(s);
      setMessage('Student loaded');
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || err.message || 'Fetch failed');
    } finally { setLoading(false); }
  };

  const saveStudent = async () => {
    setMessage('');
    if (!studentId || !student || !student.department || !student.section) return setMessage('StudentID, Department and Section are required');
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const instance = api;
      if (stored?.token) instance.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      const resp = await instance.put(`/students/${encodeURIComponent(studentId)}`, { name: student.name, department: student.department, section: student.section });
      setMessage(resp.data?.message || 'Updated');
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || err.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Editing & Adding (Edit student details)</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Student ID: </label>
        <input value={studentId} onChange={e => setStudentId(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={fetchStudent} style={{ marginLeft: 8 }}>Fetch</button>
      </div>

      {student && (
        <div style={{ marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Student ID</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Department</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Section</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>{student.studentId}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <input value={student.name || ''} onChange={e => setStudent({ ...student, name: e.target.value })} />
                  </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <input value={student.department || ''} onChange={e => setStudent({ ...student, department: e.target.value })} />
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <input value={student.section || ''} onChange={e => setStudent({ ...student, section: e.target.value })} />
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>
                  <button onClick={saveStudent} disabled={loading}>Save</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}

// ============================================================
// EditAddStudent.jsx — updated with toast notifications
// ============================================================
import React, { useState } from 'react';
import api from '../api/api';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';

export default function EditAddStudent() {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // 💡 Toast replaces plain setMessage
  const { toasts, toast, removeToast } = useToast();

  const fetchStudent = async () => {
    if (!studentId) { toast.warning('Student ID is required'); return; }
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      const resp = await api.get(`/students/${encodeURIComponent(studentId)}`);
      const s = resp.data;
      if (!s || !s.studentId) { toast.error('Student not found'); return; }
      setStudent(s);
      toast.success('Student loaded successfully');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Fetch failed');
    } finally { setLoading(false); }
  };

  const saveStudent = async () => {
    if (!studentId || !student || !student.department || !student.section) {
      toast.warning('Student ID, Department and Section are required');
      return;
    }
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      await api.put(`/students/${encodeURIComponent(studentId)}`, {
        name: student.name,
        department: student.department,
        section: student.section,
      });
      toast.success('Student details updated successfully ✅');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <h2>Editing & Adding (Edit student details)</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Student ID: </label>
        <input value={studentId} onChange={e => setStudentId(e.target.value.toUpperCase())} style={{ marginLeft: 8 }} />
        <button onClick={fetchStudent} style={{ marginLeft: 8 }} disabled={loading}>Fetch</button>
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
              </tr>
            </tbody>
          </table>
          <button onClick={saveStudent} style={{ marginTop: 12 }} disabled={loading}>Save Changes</button>
        </div>
      )}
    </div>
  );
}
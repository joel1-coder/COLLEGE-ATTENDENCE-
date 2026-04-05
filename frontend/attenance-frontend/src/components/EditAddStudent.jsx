// EditAddStudent.jsx — Manage Student Details (unified light theme)
import React, { useState } from 'react';
import api from '../api/api';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';

const pageStyle = {
  maxWidth: 900,
  margin: '32px auto',
  padding: '0 20px',
  fontFamily: "'Nunito', system-ui, sans-serif",
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid rgba(30,58,138,0.12)',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 16,
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
};

const labelStyle = {
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#64748B',
  marginRight: 8,
};

const inputStyle = {
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.9rem',
  padding: '9px 12px',
  background: '#F8FAFC',
  border: '1px solid #CBD5E1',
  borderRadius: 8,
  color: '#1E293B',
  outline: 'none',
  minWidth: 180,
};

const btnStyle = {
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.88rem',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  borderRadius: 8,
  padding: '9px 20px',
  background: '#1E3A8A',
  color: '#FFFFFF',
  boxShadow: '0 2px 8px rgba(30,58,138,0.25)',
  transition: 'all 0.18s ease',
  marginLeft: 8,
};

const thStyle = {
  padding: '11px 14px',
  textAlign: 'left',
  background: '#1E3A8A',
  color: '#FFFFFF',
  fontFamily: "'Sora', system-ui, sans-serif",
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const tdStyle = {
  padding: '10px 14px',
  borderBottom: '1px solid #E2E8F0',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.88rem',
  color: '#1E293B',
  background: '#FFFFFF',
};

export default function EditAddStudent() {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
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
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={pageStyle}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <h2 style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        fontSize: '1.6rem',
        fontWeight: 800,
        color: '#1E3A8A',
        marginBottom: 24
      }}>
        🎓 Manage Student Details
      </h2>

      {/* ── SEARCH CARD ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={labelStyle}>Student ID:</label>
          <input
            value={studentId}
            onChange={e => setStudentId(e.target.value.toUpperCase())}
            placeholder="e.g. STUD1001"
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && fetchStudent()}
          />
          <button
            onClick={fetchStudent}
            disabled={loading}
            style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = '#1E40AF'}
            onMouseLeave={e => e.currentTarget.style.background = '#1E3A8A'}
          >
            {loading ? 'Fetching...' : '🔍 Fetch'}
          </button>
        </div>
      </div>

      {/* ── STUDENT EDIT TABLE ── */}
      {student && (
        <div style={cardStyle}>
          <h3 style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '1rem',
            fontWeight: 700,
            color: '#1E3A8A',
            margin: '0 0 16px 0'
          }}>
            Edit Details
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, borderRadius: '8px 0 0 0' }}>Student ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Department</th>
                  <th style={{ ...thStyle, borderRadius: '0 8px 0 0' }}>Section</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#94A3B8' }}>{student.studentId}</td>
                  <td style={tdStyle}>
                    <input
                      value={student.name || ''}
                      style={{ ...inputStyle, width: '100%' }}
                      onChange={e => setStudent({ ...student, name: e.target.value })}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={student.department || ''}
                      style={{ ...inputStyle, width: '100%' }}
                      onChange={e => setStudent({ ...student, department: e.target.value })}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      value={student.section || ''}
                      style={{ ...inputStyle, width: 100 }}
                      onChange={e => setStudent({ ...student, section: e.target.value })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            onClick={saveStudent}
            disabled={loading}
            style={{ ...btnStyle, marginLeft: 0, marginTop: 14 }}
            onMouseEnter={e => e.currentTarget.style.background = '#1E40AF'}
            onMouseLeave={e => e.currentTarget.style.background = '#1E3A8A'}
          >
            💾 Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
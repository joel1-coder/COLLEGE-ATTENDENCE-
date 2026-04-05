// ============================================================
// EditAddStudent.jsx — Full-width layout matching PreviousAttendance
// ============================================================

/*
  💡 BEGINNER TIP:
  This page now has the same full-width layout as PreviousAttendance:
  - Heading on the left, no max-width box
  - Student ID input and Fetch button in one row
  - Edit table appears below as a card
  - All buttons are navy and never turn white
*/

import React, { useState } from 'react';
import api from '../api/api';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';
import './EditAddStudent.css';

export default function EditAddStudent() {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const { toasts, toast, removeToast } = useToast();

  /* ── FETCH STUDENT BY ID ── */
  const fetchStudent = async () => {
    if (!studentId) { toast.warning('Please enter a Student ID'); return; }
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
    } finally {
      setLoading(false);
    }
  };

  /* ── SAVE UPDATED STUDENT ── */
  const saveStudent = async () => {
    if (!studentId || !student || !student.department || !student.section) {
      toast.warning('Department and Section are required');
      return;
    }
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      await api.put(`/students/${encodeURIComponent(studentId)}`, {
        name:       student.name,
        department: student.department,
        section:    student.section,
      });
      toast.success('Student updated successfully ✅');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-student-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADING ── */}
      <div className="edit-student-header">
        <h2>Manage Student Details</h2>
      </div>

      {/* ── SEARCH ROW: Student ID input + Fetch button ──
          Same single-row layout as PreviousAttendance controls
      */}
      <div className="edit-student-controls">
        <input
          value={studentId}
          placeholder="Student ID (e.g. STUD1001)"
          onChange={e => setStudentId(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && fetchStudent()}
        />

        <button
          className="btn-fetch"
          onClick={fetchStudent}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Fetch'}
        </button>
      </div>

      {/* ── EDIT CARD — appears after a student is found ── */}
      {student && (
        <div className="edit-student-card">
          <h4 className="edit-card-title">Edit Student</h4>

          <div style={{ overflowX: 'auto' }}>
            <table className="edit-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* ID is read-only */}
                  <td>
                    <span className="student-id-badge">{student.studentId}</span>
                  </td>
                  <td>
                    <input
                      className="edit-input"
                      value={student.name || ''}
                      placeholder="Full Name"
                      onChange={e => setStudent({ ...student, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="edit-input"
                      value={student.department || ''}
                      placeholder="Department"
                      onChange={e => setStudent({ ...student, department: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="edit-input"
                      value={student.section || ''}
                      placeholder="Section"
                      onChange={e => setStudent({ ...student, section: e.target.value })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            className="btn-save"
            onClick={saveStudent}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
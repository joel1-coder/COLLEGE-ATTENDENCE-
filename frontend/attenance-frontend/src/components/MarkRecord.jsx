// ===========================================================
// MarkRecord.jsx — View and Edit Saved Marks
//
// 💡 BEGINNER EXPLANATION OF CHANGES MADE:
//
// BUG 1 — "Save failed. Please try again."
//   CAUSE: The saveTable() function was calling PUT /marks/:id,
//   but that route didn't exist in the backend (marksRoutes.js).
//   FIX: We added the PUT route in marksRoutes.js. Now saves work!
//
// BUG 2 — Download button not on the left
//   FIX: We moved the download icon (📥) to the LEFT of the Save button.
//   We also made it more visible with a green background.
//
// NEW FEATURE: Save button now shows ✅ checkmark after successful save.
// ===========================================================

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './MarkRecord.css';

export default function MarkRecord() {

  // ── STATE ──
  // 💡 State = variables React "watches". When they change, screen updates.
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [markTables, setMarkTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [savingId, setSavingId] = useState(null); // Tracks which table is saving

  // ── API CLIENT ──
  // 💡 useCallback = memoized function. Doesn't get recreated on every render.
  const apiClient = useCallback(() => {
    const api = axios.create({
      baseURL: 'https://college-attendence.onrender.com/api'
    });
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    }
    return api;
  }, []);

  // ── HELPER: Show message ──
  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // ── LOAD DEPARTMENTS ──
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient().get('/admin/departments');
        const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
        setClassesList(list);
        if (!department && list.length) setDepartment(list[0]);
      } catch (err) {
        console.warn('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, [apiClient, department]);

  // ── LOAD SECTIONS ──
  useEffect(() => {
    if (!department) return;
    const fetchSections = async () => {
      try {
        const res = await apiClient().get('/admin/sections', { params: { department } });
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn('Failed to load sections', err);
      }
    };
    fetchSections();
  }, [department, apiClient, section]);

  // ── FETCH MARKS ──
  // Called when user clicks "Fetch" button.
  // Gets students + their marks for the selected date/dept/section.
  const fetchMarks = async () => {
    if (!date || !department || !section) {
      return showMsg('Please select date, department and section', 'error');
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    setMarkTables([]);
    setFetchAttempted(false);

    try {
      const api = apiClient();

      // 1. Get students list
      const studentRes = await api.get('/students', { params: { department, section } });
      const students = Array.isArray(studentRes.data) ? studentRes.data : [];

      // 2. Get marks documents for this date/dept/section
      const marksRes = await api.get('/marks', { params: { date, department, section } });
      const markDocs = Array.isArray(marksRes.data) ? marksRes.data : [];

      // 3. Merge: for each marks doc, match students to their marks
      const tables = markDocs.map(doc => {
        // Build a lookup: { studentObjectId → mark }
        const marksMap = {};
        doc.records.forEach(r => {
          // r.student might be a full object (if populated) or just an ID
          const id = r.student?._id || r.student;
          marksMap[String(id)] = r.mark;
        });

        return {
          _id: doc._id,
          description: doc.description || 'No description',
          createdAt: doc.createdAt,
          records: students.map(s => ({
            id: s._id,
            studentId: s.studentId,
            name: s.name,
            mark: marksMap[String(s._id)] ?? 0,
          }))
        };
      });

      setMarkTables(tables);

      if (tables.length === 0) {
        showMsg(`No marks found for ${department} - ${section} on ${date}`, 'error');
      }
    } catch (err) {
      console.error('Fetch marks error:', err);
      showMsg(err?.response?.data?.message || 'Failed to fetch marks', 'error');
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  // ── UPDATE MARK (local state) ──
  // When teacher types a new number in the mark input,
  // we update our local copy (not saved to server yet).
  const updateMark = (tableIndex, recordIndex, value) => {
    const updated = [...markTables];
    updated[tableIndex].records[recordIndex].mark = value;
    setMarkTables(updated);
  };

  // ── SAVE TABLE ──
  // 💡 FIXED: Now calls PUT /api/marks/:id which we added to marksRoutes.js
  // Previously this was failing because PUT route didn't exist on backend.
  const saveTable = async (table) => {
    setSavingId(table._id); // Show loading state on this specific table
    try {
      await apiClient().put(`/marks/${table._id}`, {
        records: table.records.map(r => ({
          student: r.id,
          mark: Number(r.mark)  // Convert to number (inputs return strings)
        }))
      });
      showMsg(`✅ Saved marks for: ${table.description}`);
    } catch (err) {
      console.error('Save error:', err);
      showMsg(
        err?.response?.data?.message || 'Save failed. Check your connection and try again.',
        'error'
      );
    } finally {
      setSavingId(null);
    }
  };

  // ── DOWNLOAD EXCEL ──
  // 💡 Uses the xlsx library to convert our data to a downloadable Excel file.
  // This runs entirely in the browser — no server needed for downloading!
  const downloadExcel = (table) => {
    // Build rows array for the spreadsheet
    const data = table.records.map((r, i) => ({
      '#': i + 1,
      'Student ID': r.studentId,
      'Name': r.name,
      'Mark': r.mark
    }));

    // Create workbook + worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');

    // Auto-size columns for better readability
    ws['!cols'] = [
      { wch: 5 },   // # column
      { wch: 14 },  // Student ID
      { wch: 22 },  // Name
      { wch: 8 },   // Mark
    ];

    // Trigger browser download
    XLSX.writeFile(wb, `${table.description}_${date}.xlsx`);
  };

  // ── RENDER (What appears on screen) ──
  return (
    <div className="mark-record-page">
      <h2>📊 Mark Record</h2>

      {/* ── FILTER ROW ── */}
      <div className="mr-filters">
        <label className="mr-label">
          Department
          <select
            value={department}
            onChange={e => {
              setDepartment(e.target.value);
              setSection('');
              setMarkTables([]);
              setFetchAttempted(false);
              setMessage({ text: '', type: '' });
            }}
            className="mr-select"
          >
            {classesList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <label className="mr-label">
          Section
          <select
            value={section}
            onChange={e => {
              setSection(e.target.value);
              setMarkTables([]);
              setFetchAttempted(false);
              setMessage({ text: '', type: '' });
            }}
            className="mr-select"
          >
            {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="mr-label">
          Date
          <input
            type="date"
            value={date}
            onChange={e => {
              setDate(e.target.value);
              setMarkTables([]);
              setFetchAttempted(false);
              setMessage({ text: '', type: '' });
            }}
            className="mr-input"
          />
        </label>

        <button
          onClick={fetchMarks}
          disabled={loading}
          className="mr-btn-fetch"
        >
          {loading ? '⏳ Fetching...' : '🔍 Fetch'}
        </button>
      </div>

      {/* ── STATUS MESSAGE ── */}
      {loading && (
        <div className="mr-loading">⏳ Loading marks...</div>
      )}

      {message.text && (
        <div className={`mr-message ${message.type === 'error' ? 'mr-message--error' : 'mr-message--success'}`}>
          {message.text}
        </div>
      )}

      {/* ── MARK TABLES ── */}
      {markTables.map((table, tableIndex) => (
        <div key={table._id} className="mr-table-card">

          {/* Card header: description + entered date */}
          <div className="mr-card-header">
            <div>
              <span className="mr-card-icon">📝</span>
              <span className="mr-card-title">{table.description}</span>
              <span className="mr-card-date">
                Entered: {new Date(table.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* ── ACTION BUTTONS ──
              📥 Download is on the LEFT (as requested!)
              💾 Save is on the RIGHT
          */}
          <div className="mr-action-row">
            {/* DOWNLOAD BUTTON — LEFT SIDE */}
            <button
              className="mr-btn-download"
              onClick={() => downloadExcel(table)}
              title="Download as Excel file"
            >
              📥 Download Excel
            </button>

            {/* SAVE BUTTON — RIGHT SIDE */}
            <button
              className="mr-btn-save"
              onClick={() => saveTable(table)}
              disabled={savingId === table._id}
            >
              {savingId === table._id ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>

          {/* ── MARKS TABLE ── */}
          <div className="mr-table-wrapper">
            <table className="mr-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Mark</th>
                </tr>
              </thead>
              <tbody>
                {table.records.map((r, recordIndex) => (
                  <tr key={r.id}>
                    <td className="mr-td-num">{recordIndex + 1}</td>
                    <td className="mr-td-id">{r.studentId}</td>
                    <td className="mr-td-name">{r.name}</td>
                    <td className="mr-td-mark">
                      {/* Editable number input — type new mark here */}
                      <input
                        type="number"
                        value={r.mark}
                        min={0}
                        max={100}
                        className="mr-mark-input"
                        onChange={e => updateMark(tableIndex, recordIndex, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── EMPTY STATE: shown when fetch done but no marks ── */}
      {fetchAttempted && markTables.length === 0 && !loading && !message.text && (
        <div className="mr-empty">
          <p>📭 No mark records found for the selected filters.</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
            Try a different date or make sure marks were entered using the "Marks Portal" page.
          </p>
        </div>
      )}
    </div>
  );
}
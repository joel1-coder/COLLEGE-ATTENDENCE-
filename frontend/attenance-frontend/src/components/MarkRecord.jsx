import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function MarkRecord() {
  // 📦 STATE — These are like variables that React watches.
  // When they change, the screen automatically re-renders.
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Today's date by default
  const [markTables, setMarkTables] = useState([]); // List of mark entries (one per test/exam)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // ✅ FIX: New state to track if a fetch was attempted (so we can show "No marks found")
  const [fetchAttempted, setFetchAttempted] = useState(false);

  /* ---------------- API CLIENT ----------------
   * useCallback means this function won't be recreated on every render.
   * It creates an axios instance (a pre-configured HTTP request tool)
   * with your backend URL and the user's login token attached.
   */
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

  /* ---------------- LOAD DEPARTMENTS ----------------
   * useEffect runs code AFTER the component appears on screen.
   * This one loads the list of departments from the backend.
   */
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

  /* ---------------- LOAD SECTIONS ----------------
   * Runs whenever `department` changes.
   * Loads sections that belong to the selected department.
   */
  useEffect(() => {
    if (!department) return;

    const fetchSections = async () => {
      try {
        const res = await apiClient().get('/admin/sections', {
          params: { department }
        });
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn('Failed to load sections', err);
      }
    };

    fetchSections();
  }, [department, apiClient, section]);

  /* ---------------- FETCH MARKS ----------------
   * This runs when the user clicks the "Fetch" button.
   * It:
   *  1. Gets the students for that dept/section
   *  2. Gets the marks saved for that date/dept/section
   *  3. Merges them together into tables to display
   */
  const fetchMarks = async () => {
    if (!date || !department || !section) {
      setMessage('Please select date, department and section');
      return;
    }

    setLoading(true);
    setMessage('');
    setMarkTables([]);
    setFetchAttempted(false); // Reset before new fetch

    try {
      const api = apiClient();

      // 1️⃣ Fetch students for this dept/section
      const studentRes = await api.get('/students', {
        params: { department, section }
      });
      const students = Array.isArray(studentRes.data) ? studentRes.data : [];

      // 2️⃣ Fetch all mark documents for this date/dept/section
      // ✅ FIX: Added console.log so you can debug in DevTools → Console
      console.log('Fetching marks with params:', { date, department, section });
      const marksRes = await api.get('/marks', {
        params: { date, department, section }
      });
      console.log('Marks API response:', marksRes.data);

      const markDocs = Array.isArray(marksRes.data) ? marksRes.data : [];

      // 3️⃣ Build a table for each mark document (one per exam/test)
      const tables = markDocs.map(doc => {
        // Create a map: { studentId → mark } for quick lookup
        const marksMap = {};
        doc.records.forEach(r => {
          const id = r.student?._id || r.student;
          marksMap[id] = r.mark;
        });

        // Merge student info with their mark
        return {
          _id: doc._id,
          description: doc.description || 'No description',
          createdAt: doc.createdAt,
          records: students.map(s => ({
            id: s._id,
            studentId: s.studentId,
            name: s.name,
            mark: marksMap[s._id] ?? 0 // If no mark found, default to 0
          }))
        };
      });

      setMarkTables(tables);

      // ✅ FIX: Show a clear message when no marks exist for this selection
      if (tables.length === 0) {
        setMessage(`No marks found for ${department} - ${section} on ${date}. Make sure marks were entered for this date.`);
      }

    } catch (err) {
      console.error('Fetch marks error:', err);
      // Show the actual error message from backend if available
      setMessage(err?.response?.data?.message || 'Failed to fetch marks. Check console for details.');
    } finally {
      setLoading(false);
      setFetchAttempted(true); // Mark that a fetch was attempted
    }
  };

  /* ---------------- UPDATE MARK VALUE ----------------
   * When a teacher edits a mark in the table input box,
   * this updates that specific cell in our local state.
   * tableIndex = which exam table, recordIndex = which student row
   */
  const updateMark = (tableIndex, recordIndex, value) => {
    const updated = [...markTables]; // Copy the array (don't mutate state directly!)
    updated[tableIndex].records[recordIndex].mark = value;
    setMarkTables(updated);
  };

  /* ---------------- SAVE TABLE ----------------
   * Sends updated marks back to the backend using PUT (update).
   * PUT means "replace this existing record with new data".
   */
  const saveTable = async (table) => {
    try {
      await apiClient().put(`/marks/${table._id}`, {
        records: table.records.map(r => ({
          student: r.id,
          mark: Number(r.mark) // Make sure it's a number, not a string
        }))
      });
      setMessage(`✅ Saved: ${table.description}`);
    } catch (err) {
      console.error('Save error:', err);
      setMessage('Save failed. Please try again.');
    }
  };

  /* ---------------- DOWNLOAD TABLE ----------------
   * Uses the XLSX library to convert table data into an Excel file
   * and automatically downloads it in the browser.
   */
  const downloadExcel = (table) => {
    const data = table.records.map((r, i) => ({
      '#': i + 1,
      'Student ID': r.studentId,
      Name: r.name,
      Mark: r.mark
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table.description);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${table.description}-${date}.xlsx`;
    link.click();
  };

  /* ---------------- UI / RENDER ----------------
   * This is what gets shown on screen.
   * React re-renders this whenever state changes.
   */
  return (
    <div style={{ padding: 16 }}>
      <h2>Mark Record</h2>

      {/* --- FILTER ROW --- */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Department
          <select value={department} onChange={e => {
            setDepartment(e.target.value);
            setSection(''); // Reset section when dept changes
            setMarkTables([]);
            setFetchAttempted(false);
            setMessage('');
          }}>
            {classesList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Section
          <select value={section} onChange={e => {
            setSection(e.target.value);
            setMarkTables([]);
            setFetchAttempted(false);
            setMessage('');
          }}>
            {sectionsList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Date
          <input
            type="date"
            value={date}
            onChange={e => {
              setDate(e.target.value);
              setMarkTables([]);
              setFetchAttempted(false);
              setMessage('');
            }}
          />
        </label>

        <div className='mark-fetch'>
          <button onClick={fetchMarks} disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
      </div>

      {/* --- STATUS MESSAGES --- */}
      {loading && <p style={{ color: '#555' }}>⏳ Loading...</p>}

      {/* ✅ FIX: Message now shows clearly — including "no marks found" */}
      {message && (
        <p style={{
          color: message.startsWith('✅') ? 'green' : '#c0392b',
          background: message.startsWith('✅') ? '#eafaf1' : '#fdf2f2',
          padding: '10px 14px',
          borderRadius: 8,
          border: `1px solid ${message.startsWith('✅') ? '#a9dfbf' : '#fadbd8'}`
        }}>
          {message}
        </p>
      )}

      {/* --- MARK TABLES (one per exam/test) --- */}
      {markTables.map((table, tableIndex) => (
        <div key={table._id} style={{ marginBottom: 40, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>

          <h3 style={{ margin: '0 0 4px 0' }}>
            📝 {table.description}
            <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
              (Entered: {new Date(table.createdAt).toLocaleString()})
            </span>
          </h3>

          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => saveTable(table)}>💾 Save</button>
            <button onClick={() => downloadExcel(table)}>📥 Download Excel</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Student ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Mark</th>
              </tr>
            </thead>
            <tbody>
              {table.records.map((r, recordIndex) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{recordIndex + 1}</td>
                  <td style={tdStyle}>{r.studentId}</td>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={r.mark}
                      min={0}
                      style={{ width: 70, padding: '4px 8px' }}
                      onChange={e => updateMark(tableIndex, recordIndex, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// Simple reusable styles for table cells
const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '2px solid #ddd'
};

const tdStyle = {
  padding: '8px 12px'
};
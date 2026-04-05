import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

// ── What is this page? ────────────────────────────────────────────────────
// MarkRecord lets teachers VIEW and EDIT marks they previously entered.
// It fetches marks from the backend by date/dept/section, shows them in
// a table, and lets the teacher update + save them.
// ─────────────────────────────────────────────────────────────────────────

// Shared styles so every page looks the same
const pageStyle = {
  maxWidth: 1000,
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
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#64748B',
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
};

const primaryBtn = {
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  borderRadius: 8,
  padding: '9px 18px',
  background: '#1E3A8A',
  color: '#FFFFFF',
  boxShadow: '0 2px 8px rgba(30,58,138,0.25)',
  transition: 'all 0.18s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const greenBtn = {
  ...primaryBtn,
  background: '#16A34A',
  boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
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

export default function MarkRecord() {
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDate());
  const [markTables, setMarkTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // ── API Client ───────────────────────────────────────────────────────────
  // useCallback means this function is only recreated when dependencies change,
  // saving memory by not creating a new function on every re-render.
  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  }, []);

  // ── Load Departments ─────────────────────────────────────────────────────
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

  // ── Load Sections ────────────────────────────────────────────────────────
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

  // ── Fetch Marks ──────────────────────────────────────────────────────────
  const getUtcDate = () => {
    return new Date().toISOString().slice(0, 10);
  };

  const fetchMarks = async () => {
    if (!date || !department || !section) {
      setMessage('Please select date, department and section');
      return;
    }
    setLoading(true);
    setMessage('');
    setMarkTables([]);
    setFetchAttempted(false);
    try {
      const api = apiClient();

      // 1. Get the students for this dept/section
      const studentRes = await api.get('/students', { params: { department, section } });
      const students = Array.isArray(studentRes.data) ? studentRes.data : [];

      // 2. Get all mark documents for this date/dept/section
      let marksRes = await api.get('/marks', { params: { date, department, section } });
      let markDocs = Array.isArray(marksRes.data) ? marksRes.data : [];

      // 3. Fallback: if no local-date marks found, try UTC-based date (older saved marks may use UTC date)
      const utcDate = getUtcDate();
      if (markDocs.length === 0 && utcDate !== date) {
        const fallbackRes = await api.get('/marks', { params: { date: utcDate, department, section } });
        markDocs = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        if (markDocs.length > 0) {
          setMessage(`Showing marks saved under UTC date ${utcDate}.`);
        }
      }

      // 4. Merge: match each mark entry with the student's name/ID
      const tables = markDocs.map(doc => {
        const marksMap = {};
        doc.records.forEach(r => {
          const id = r.student?._id || r.student;
          marksMap[id] = r.mark;
        });
        return {
          _id: doc._id,
          description: doc.description || 'No description',
          createdAt: doc.createdAt,
          records: students.map(s => ({
            id: s._id,
            studentId: s.studentId,
            name: s.name,
            mark: marksMap[s._id] ?? 0
          }))
        };
      });

      setMarkTables(tables);
      if (tables.length === 0) {
        setMessage(`No marks found for ${department} — ${section} on ${date}.`);
      }
    } catch (err) {
      console.error('Fetch marks error:', err);
      setMessage(err?.response?.data?.message || 'Failed to fetch marks.');
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  // ── Update Mark in Local State ───────────────────────────────────────────
  // When a teacher types a new mark, we update it locally first.
  // This is called "optimistic update" — changes happen instantly in the UI.
  const updateMark = (tableIndex, recordIndex, value) => {
    const updated = [...markTables];
    updated[tableIndex].records[recordIndex].mark = value;
    setMarkTables(updated);
  };

  // ── Save Table ───────────────────────────────────────────────────────────
  // ✅ FIXED: Now calls PUT /api/marks/:id which we added to the backend.
  // PUT means "update this existing document" — we send the full updated list.
  const saveTable = async (table) => {
    setMessage('');
    try {
      await apiClient().put(`/marks/${table._id}`, {
        records: table.records.map(r => ({
          student: r.id,
          mark: Number(r.mark) // Always send a number, not a string
        }))
      });
      setMessage(`✅ Saved: "${table.description}"`);
    } catch (err) {
      console.error('Save error:', err);
      const errMsg = err?.response?.data?.message || 'Save failed. Check your connection and try again.';
      setMessage(`❌ ${errMsg}`);
    }
  };

  // ── Download Excel ───────────────────────────────────────────────────────
  const downloadExcel = (table) => {
    const data = table.records.map((r, i) => ({
      '#': i + 1,
      'Student ID': r.studentId,
      'Name': r.name,
      'Mark': r.mark
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table.description.slice(0, 31));
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${table.description}-${date}.xlsx`;
    link.click();
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {/* ── PAGE HEADER ── */}
      <h2 style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        fontSize: '1.6rem',
        fontWeight: 800,
        color: '#1E3A8A',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        📊 Mark Record
      </h2>

      {/* ── FILTER CARD ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={labelStyle}>
            Department
            <select
              value={department}
              style={inputStyle}
              onChange={e => {
                setDepartment(e.target.value);
                setSection('');
                setMarkTables([]);
                setFetchAttempted(false);
                setMessage('');
              }}
            >
              {classesList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Section
            <select
              value={section}
              style={inputStyle}
              onChange={e => {
                setSection(e.target.value);
                setMarkTables([]);
                setFetchAttempted(false);
                setMessage('');
              }}
            >
              {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Date
            <input
              type="date"
              value={date}
              style={inputStyle}
              onChange={e => {
                setDate(e.target.value);
                setMarkTables([]);
                setFetchAttempted(false);
                setMessage('');
              }}
            />
          </label>

          <button
            style={{ ...primaryBtn, alignSelf: 'flex-end' }}
            onClick={fetchMarks}
            disabled={loading}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#1E40AF')}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = '#1E3A8A')}
          >
            {loading ? '⏳ Fetching...' : '🔍 Fetch'}
          </button>
        </div>
      </div>

      {/* ── STATUS MESSAGE ── */}
      {message && (
        <div style={{
          padding: '11px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontFamily: "'Nunito', system-ui, sans-serif",
          fontSize: '0.85rem',
          fontWeight: 600,
          background: message.startsWith('✅') ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          color: message.startsWith('✅') ? '#16A34A' : '#DC2626',
          border: `1px solid ${message.startsWith('✅') ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
        }}>
          {message}
        </div>
      )}

      {/* ── MARK TABLES ── */}
      {markTables.map((table, tableIndex) => (
        <div key={table._id} style={cardStyle}>
          {/* Table header with description */}
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: '#1E3A8A',
                margin: '0 0 4px 0'
              }}>
                📝 {table.description}
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: "'Nunito', system-ui, sans-serif" }}>
                Entered: {new Date(table.createdAt).toLocaleString()}
              </span>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={greenBtn}
                onClick={() => downloadExcel(table)}
                onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
              >
                📥 Download Excel
              </button>
              <button
                style={primaryBtn}
                onClick={() => saveTable(table)}
                onMouseEnter={e => e.currentTarget.style.background = '#1E40AF'}
                onMouseLeave={e => e.currentTarget.style.background = '#1E3A8A'}
              >
                💾 Save Changes
              </button>
            </div>
          </div>

          {/* Marks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, borderRadius: '8px 0 0 0' }}>#</th>
                  <th style={thStyle}>Student ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={{ ...thStyle, borderRadius: '0 8px 0 0' }}>Mark</th>
                </tr>
              </thead>
              <tbody>
                {table.records.map((r, recordIndex) => (
                  <tr key={r.id}>
                    <td style={{ ...tdStyle, color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>
                      {recordIndex + 1}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.studentId}</td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        value={r.mark}
                        min={0}
                        style={{
                          ...inputStyle,
                          width: 80,
                          padding: '6px 10px',
                          textAlign: 'center',
                          fontWeight: 700,
                        }}
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
    </div>
  );
}
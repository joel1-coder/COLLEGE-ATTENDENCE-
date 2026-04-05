import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./AttendanceForm.css";

// ── What is a "component"? ──────────────────────────────────────────────────
// A component is just a JavaScript function that returns HTML-like code (JSX).
// React calls this function every time something changes (like a click) and
// updates only the parts of the screen that need to change.
// ────────────────────────────────────────────────────────────────────────────

const AttendanceForm = () => {
  // useState is a React "hook" — it lets us store values that,
  // when changed, automatically update what's shown on screen.
  const [students, setStudents] = useState([]);
  const [Attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState(false);
  const [message, setMessage] = useState("");
  const descRef = useRef(null);

  // 🔒 Date locked to today
  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const displayDate = `${pad(todayDate.getDate())}-${pad(todayDate.getMonth() + 1)}-${todayDate.getFullYear()}`;

  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  // Helper to build an API client with auth token
  const makeApi = () => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  };

  // Load departments on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await makeApi().get('/admin/departments');
        const cls = Array.isArray(res.data) ? res.data.map(c => c.name) : [];
        setClassesList(cls);
        if (!department && cls.length) setDepartment(cls[0]);
      } catch (err) {
        console.warn('Could not load classes', err);
        setMessage('Could not load classes — please login or check server');
      }
    };
    fetchClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sections whenever department changes
  useEffect(() => {
    if (!department) return;
    const fetchSections = async () => {
      try {
        const res = await makeApi().get(`/admin/sections?department=${encodeURIComponent(department)}`);
        const secs = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(secs);
        setSection(secs[0] || "");
      } catch (err) {
        console.warn('Could not load sections', err);
        setSectionsList([]);
        setSection("");
      }
    };
    fetchSections();
  }, [department]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load students whenever department OR section changes
  useEffect(() => {
    if (!department || !section) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await makeApi().get(
          `/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`
        );
        setStudents(res.data || []);
        // Default every student to "present"
        const defaultAttendance = {};
        (res.data || []).forEach((s) => { defaultAttendance[s._id] = "present"; });
        setAttendance(defaultAttendance);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [department, section]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle between present ↔ absent on single click
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const presentCount = Object.values(Attendance).filter(s => s === "present").length;
  const absentCount = Object.values(Attendance).filter(s => s === "absent").length;

  const handleSubmit = async () => {
    if (!description || !description.trim()) {
      setDescError(true);
      if (descRef.current) descRef.current.focus();
      return;
    }
    try {
      setDescError(false);
      const records = Object.keys(Attendance).map((studentId) => ({
        student: studentId,
        status: Attendance[studentId],
      }));
      const payload = { date: today, description, department, section, records };
      const resp = await makeApi().post('/Attendance', payload);
      if (resp.data && resp.data.file) {
        setMessage(`✅ Attendance saved. Download: ${resp.data.file}`);
      } else {
        setMessage("✅ Attendance saved successfully");
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message || "Error saving Attendance";
      setMessage(`❌ ${errMsg}`);
    }
  };

  if (loading) return (
    <div className="Attendance-container">
      <p className="loading">⏳ Loading students...</p>
    </div>
  );

  return (
    <div className="Attendance-container">
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>CS LAB Attendance</h2>
        <span style={{
          background: '#EFF6FF',
          color: '#1E3A8A',
          border: '1px solid rgba(30,58,138,0.2)',
          borderRadius: 8,
          padding: '6px 14px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '0.85rem'
        }}>
          📅 Date: {displayDate}
        </span>
      </div>

      {/* ── FILTERS ── */}
      <div className="info">
        <label>
          Department:
          <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ marginLeft: 8 }}>
            {classesList.length ? (
              classesList.map((c) => <option key={c} value={c}>{c}</option>)
            ) : (
              <>
                <option value="BSc">BSc</option>
                <option value="BA">BA</option>
              </>
            )}
          </select>
        </label>

        <label>
          Section:
          <select value={section} onChange={(e) => setSection(e.target.value)} style={{ marginLeft: 8 }}>
            {sectionsList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ flex: 1 }}>
          Description:
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value.trim()) setDescError(false);
            }}
            placeholder="Reason / notes for this session (required)"
            rows={1}
            style={{
              marginLeft: 8,
              verticalAlign: 'middle',
              resize: 'none',
              minWidth: 220,
              border: descError ? '1.5px solid #DC2626' : '1px solid #CBD5E1'
            }}
          />
          {descError && (
            <span style={{ color: '#DC2626', marginLeft: 6, fontSize: '0.8rem', fontWeight: 700 }}>
              ⚠ Required
            </span>
          )}
        </label>
      </div>

      {/* ── STATS BADGE ── */}
      {students.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
          padding: '10px 16px',
          background: '#F8FAFC',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          alignItems: 'center'
        }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, color: '#2563EB' }}>
            🔵 Present: {presentCount}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, color: '#DC2626' }}>
            🔴 Absent: {absentCount}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
            Tap a chip to mark absent (red)
          </span>
        </div>
      )}

      {/* ── STUDENT GRID ── */}
      {students.length > 0 ? (
        <div className="students-grid">
          {students.map((student) => (
            <div
              key={student._id}
              className={`student-box ${Attendance[student._id] === "present" ? "present" : "absent"}`}
              onClick={() => toggleAttendance(student._id)}
              title={Attendance[student._id] === "present" ? "✔ Present" : "✘ Absent"}
            >
              <span className="student-id-text">{student.studentId}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No students found for {department} — Section {section}
        </div>
      )}

      {/* ── SUBMIT ── */}
      {students.length > 0 && (
        <button className="submit-btn" onClick={handleSubmit} style={{ marginTop: 20 }}>
          Submit Attendance
        </button>
      )}

      {message && (
        <p className="message" style={{
          color: message.startsWith('✅') ? '#16A34A' : '#DC2626',
          background: message.startsWith('✅') ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          border: `1px solid ${message.startsWith('✅') ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AttendanceForm;
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Toast from "./Toast";
import useToast from "../Hooks/usetoast";

// Shared inline styles — same look as MarkRecord.jsx and Login.jsx
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

export default function EnterMarks() {
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { toasts, toast, removeToast } = useToast();

  const todayDate = new Date();
  const displayDate = todayDate.toLocaleDateString('en-GB');
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    return api;
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient().get("/admin/departments");
        const list = Array.isArray(res.data) ? res.data.map((d) => d.name) : [];
        setClassesList(list);
        if (!department && list.length) setDepartment(list[0]);
      } catch (err) {
        console.warn("Failed to load departments", err);
        toast.error("Failed to load departments");
      }
    };
    fetchDepartments();
  }, [apiClient, department]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!department) return;
    const fetchSections = async () => {
      try {
        const res = await apiClient().get("/admin/sections", { params: { department } });
        const list = Array.isArray(res.data) ? res.data.map((s) => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn("Failed to load sections", err);
        setSectionsList([]);
      }
    };
    fetchSections();
  }, [department, section, apiClient]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!department || !section) return;
    setLoading(true);
    apiClient()
      .get("/students", { params: { department, section } })
      .then((res) => {
        const data = res.data || [];
        setStudents(data);
        const initialMarks = {};
        data.forEach((s) => { initialMarks[s._id] = "0"; });
        setMarks(initialMarks);
      })
      .catch((err) => {
        console.error("Failed to load students", err);
        toast.error("Failed to load students");
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [department, section, apiClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (opts = {}) => {
    const records = Object.keys(marks).map((id) => ({ student: id, mark: Number(marks[id]) }));
    const payload = {
      date: getLocalDate(),
      department,
      section,
      description,
      records,
      merge: opts.merge,
    };
    try {
      const res = await apiClient().post("/marks", payload);
      toast.success(res.data?.message || "Marks saved successfully! ✅");
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      if (status === 409 && body?.existingId) {
        const ok = window.confirm("Marks already exist for this session. Merge with existing record?");
        if (ok) { await save({ merge: true }); return; }
      }
      toast.error(body?.message || "Save failed. Please try again.");
    }
  };

  return (
    <div style={pageStyle}>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#1E3A8A',
          margin: 0
        }}>
          ✏️ Enter Marks
        </h2>
        <span style={{
          background: '#EFF6FF',
          color: '#1E3A8A',
          border: '1px solid rgba(30,58,138,0.2)',
          borderRadius: 8,
          padding: '6px 14px',
          fontFamily: "'Nunito', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: '0.85rem'
        }}>
          📅 {displayDate}
        </span>
      </div>

      {/* ── FILTER CARD ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={labelStyle}>
            Department
            <select value={department} style={inputStyle} onChange={(e) => setDepartment(e.target.value)}>
              {classesList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Section
            <select value={section} style={inputStyle} onChange={(e) => setSection(e.target.value)}>
              {sectionsList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label style={{ ...labelStyle, flex: 1, minWidth: 200 }}>
            Description (exam / test name)
            <input
              type="text"
              placeholder="e.g. Lab Test 1, Unit Exam..."
              value={description}
              style={{ ...inputStyle, width: '100%' }}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* ── STUDENTS TABLE ── */}
      <div style={cardStyle}>
        {loading ? (
          <p style={{ color: '#64748B', fontFamily: "'Nunito', sans-serif", padding: '20px 0' }}>
            ⏳ Loading students...
          </p>
        ) : (
          <>
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
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', padding: 32 }}>
                      No students found for {department} — Section {section}
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ ...tdStyle, color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.studentId}</td>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        value={marks[s._id] || ""}
                        min={0}
                        style={{ ...inputStyle, width: 80, padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}
                        onChange={(e) => setMarks({ ...marks, [s._id]: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length > 0 && (
              <button
                onClick={save}
                style={{
                  marginTop: 16,
                  fontFamily: "'Nunito', system-ui, sans-serif",
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 22px',
                  background: '#1E3A8A',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(30,58,138,0.25)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1E40AF'}
                onMouseLeave={e => e.currentTarget.style.background = '#1E3A8A'}
              >
                💾 Save Marks
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
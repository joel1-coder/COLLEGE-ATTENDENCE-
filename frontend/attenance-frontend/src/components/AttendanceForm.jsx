import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AttendanceForm.css";

const AttendanceForm = () => {
  const [students, setStudents] = useState([]);
  // ── WHAT IS "Attendance" STATE? ──────────────────────────────
  // It's an object (like a dictionary) where:
  //   key   = student's MongoDB _id
  //   value = "present" or "absent"
  // Example: { "abc123": "present", "def456": "absent" }
  const [Attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState(false);
  const descRef = React.createRef();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  // 🔒 Date locked to today — we build a nicely formatted string
  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const displayDate = `${pad(todayDate.getMonth() + 1)}-${pad(
    todayDate.getDate()
  )}-${todayDate.getFullYear()}`;

  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  // ── LOAD DEPARTMENTS ─────────────────────────────────────────
  // This runs once when the page loads (empty dependency = [])
  useEffect(() => {
    const api = axios.create({
      baseURL: "https://college-attendence.onrender.com/api",
    });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;

    const fetchClasses = async () => {
      try {
        const cRes = await api.get("/admin/departments");
        const cls = Array.isArray(cRes.data)
          ? cRes.data.map((c) => c.name)
          : [];
        setClassesList(cls);
        if (!department && cls.length) setDepartment(cls[0]);
      } catch (err) {
        console.warn("Could not load classes", err);
        setMessage("Could not load classes — please login or check server");
        setMessageType("error");
      }
    };

    fetchClasses();
  }, []);

  // ── LOAD SECTIONS WHEN DEPARTMENT CHANGES ────────────────────
  // The [department] at the end means: "re-run when department changes"
  useEffect(() => {
    if (!department) return;
    const api = axios.create({
      baseURL: "https://college-attendence.onrender.com/api",
    });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;

    const fetchSections = async () => {
      try {
        const res = await api.get(
          `/admin/sections?department=${encodeURIComponent(department)}`
        );
        const secs = res.data.map((s) => s.name);
        setSectionsList(secs);
        setSection(secs[0] || "");
      } catch (err) {
        setSectionsList([]);
        setSection("");
      }
    };

    fetchSections();
  }, [department]);

  // ── LOAD STUDENTS WHEN DEPT + SECTION BOTH SET ───────────────
  useEffect(() => {
    if (!department || !section) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const api = axios.create({
          baseURL: "https://college-attendence.onrender.com/api",
        });
        const stored = JSON.parse(localStorage.getItem("user"));
        if (stored?.token)
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${stored.token}`;

        const res = await api.get(
          `/students?department=${encodeURIComponent(
            department
          )}&section=${encodeURIComponent(section)}`
        );

        setStudents(res.data || []);

        // ── DEFAULT: everyone starts as PRESENT ──────────────
        const defaultAttendance = {};
        res.data.forEach((s) => {
          defaultAttendance[s._id] = "present";
        });
        setAttendance(defaultAttendance);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [department, section]);

  // ── TOGGLE ATTENDANCE ────────────────────────────────────────
  // This is the KEY function — clicking a chip calls this.
  // It uses the "spread operator" (...prev) to copy the old state
  // and just flip the one student who was clicked.
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  // ── SUBMIT ATTENDANCE ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!description || !description.trim()) {
      setDescError(true);
      window.alert("You didn't put anything in the Description");
      if (descRef.current) descRef.current.focus();
      return;
    }
    try {
      setDescError(false);
      // Convert our attendance object into an array of { student, status }
      const records = Object.keys(Attendance).map((studentId) => ({
        student: studentId,
        status: Attendance[studentId],
      }));

      const payload = { date: today, description, department, section, records };

      const api = axios.create({
        baseURL: "https://college-attendence.onrender.com/api",
      });
      const stored = JSON.parse(localStorage.getItem("user")) || null;
      if (stored?.token)
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${stored.token}`;

      await api.post("/Attendance", payload);
      setMessage("Attendance saved successfully!");
      setMessageType("success");
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error.message ||
        "Error saving Attendance";
      setMessage(errMsg);
      setMessageType("error");
    }
  };

  // ── COUNTS: how many present / absent ───────────────────────
  const presentCount = Object.values(Attendance).filter(
    (v) => v === "present"
  ).length;
  const absentCount = Object.values(Attendance).filter(
    (v) => v === "absent"
  ).length;

  if (loading)
    return (
      <div className="att-loading">
        <div className="att-spinner" />
        <p>Loading students...</p>
      </div>
    );

  return (
    <div className="att-wrapper">
      {/* ── TOP CARD ─────────────────────────────────────── */}
      <div className="att-card">
        <div className="att-title-row">
          <h2 className="att-title">CS LAB ATTENDANCE</h2>
          <span className="att-date">Date: {displayDate}</span>
        </div>

        {/* ── FILTERS ROW ──────────────────────────────────── */}
        <div className="att-filters">
          {/* Department dropdown */}
          <div className="att-field">
            <label className="att-label">Department:</label>
            <select
              className="att-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {classesList.length ? (
                classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              ) : (
                <>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                </>
              )}
            </select>
          </div>

          {/* Section dropdown */}
          <div className="att-field">
            <label className="att-label">Section:</label>
            <select
              className="att-select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              {sectionsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Description textarea */}
          <div className="att-field att-field--desc">
            <label className="att-label">Description:</label>
            <textarea
              ref={descRef}
              className={`att-textarea${descError ? " att-textarea--error" : ""}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value.trim()) setDescError(false);
              }}
              placeholder="Reason / notes for this Attendance"
              rows={3}
            />
            {descError && (
              <span className="att-error-hint">⚠ Description is required</span>
            )}
          </div>
        </div>

        {/* ── LEGEND + COUNTS ──────────────────────────────── */}
        <div className="att-legend">
          <span className="att-legend-item att-legend-present">
            ● Present: {presentCount}
          </span>
          <span className="att-legend-item att-legend-absent">
            ● Absent: {absentCount}
          </span>
          <span className="att-legend-hint">
            Tap a chip to mark absent (red)
          </span>
        </div>

        {/* ── STUDENT CHIPS GRID ────────────────────────────
            This is the MAIN UI — a CSS grid of clickable chips.
            Each chip shows the student ID.
            Clicking toggles between present (white) and absent (red).
        ────────────────────────────────────────────────── */}
        {students.length === 0 ? (
          <p className="att-empty">
            No students found for {department} — Section {section}
          </p>
        ) : (
          <div className="att-chips-grid">
            {students.map((student) => {
              const isAbsent = Attendance[student._id] === "absent";
              return (
                <button
                  key={student._id}
                  // ── className changes based on absent/present ──
                  // This is "conditional classNames" — a very common React pattern
                  className={`att-chip${isAbsent ? " att-chip--absent" : ""}`}
                  onClick={() => toggleAttendance(student._id)}
                  title={`${student.name} — click to toggle`}
                >
                  <span className="att-chip-id">{student.studentId}</span>
                  {student.name && (
                    <span className="att-chip-name">{student.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── SUBMIT BUTTON ─────────────────────────────────── */}
        {students.length > 0 && (
          <button className="att-submit-btn" onClick={handleSubmit}>
            Submit Attendance
          </button>
        )}

        {/* ── STATUS MESSAGE ────────────────────────────────── */}
        {message && (
          <div className={`att-message att-message--${messageType}`}>
            {messageType === "success" ? "✅" : "❌"} {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;
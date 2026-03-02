import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AttendanceForm.css";
import Toast from "./Toast";
import useToast from "../Hooks/usetoast";

const AttendanceForm = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState(false);
  const descRef = React.createRef();

  // 💡 We replaced setMessage (plain text) with toast (pop-up notifications)
  const { toasts, toast, removeToast } = useToast();

  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const displayDate = `${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}-${todayDate.getFullYear()}`;

  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  useEffect(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;

    const fetchClasses = async () => {
      try {
        const cRes = await api.get('/admin/departments');
        const cls = Array.isArray(cRes.data) ? cRes.data.map(c => c.name) : [];
        setClassesList(cls);
        if (!department && cls.length) setDepartment(cls[0]);
      } catch (err) {
        console.warn('Could not load classes', err);
        toast.error('Could not load departments — please login or check server');
      }
    };

    const fetchSectionsForClass = async (forClass) => {
      try {
        if (!forClass) return setSectionsList([]);
        const sRes = await api.get(`/admin/sections?department=${encodeURIComponent(forClass)}`);
        const secs = Array.isArray(sRes.data) ? sRes.data.map(s => s.name) : [];
        setSectionsList(secs);
        setSection(secs[0] || "");
      } catch (err) {
        setSectionsList([]);
        setSection("");
      }
    };

    fetchClasses().then(() => {
      if (department) fetchSectionsForClass(department);
    });
  }, []);

  useEffect(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;

    const fetchSections = async () => {
      try {
        const res = await api.get(`/admin/sections?department=${encodeURIComponent(department)}`);
        const secs = res.data.map((s) => s.name);
        setSectionsList(secs);
        setSection(secs[0] || "");
      } catch (err) {
        setSectionsList([]);
        setSection("");
      }
    };
    if (department) fetchSections();
  }, [department]);

  useEffect(() => {
    if (!department || !section) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
        const stored = JSON.parse(localStorage.getItem("user"));
        if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
        const res = await api.get(`/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`);
        setStudents(res.data || []);
        const defaultAttendance = {};
        res.data.forEach((s) => { defaultAttendance[s._id] = "present"; });
        setAttendance(defaultAttendance);
      } catch (err) {
        setStudents([]);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [department, section]);

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSubmit = async () => {
    if (!description || !description.trim()) {
      setDescError(true);
      toast.warning("Please fill in the Description before submitting");
      if (descRef.current) descRef.current.focus();
      return;
    }
    try {
      setDescError(false);
      const records = Object.keys(attendance).map((studentId) => ({
        student: studentId,
        status: attendance[studentId],
      }));
      const payload = { date: today, description, department, section, records };
      const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      await api.post('/attendance', payload);
      toast.success("Attendance saved successfully! 🎉");
    } catch (error) {
      console.error('Attendance save error:', error);
      const errMsg = error?.response?.data?.message || error.message || "Error saving attendance";
      toast.error(errMsg);
    }
  };

  if (loading) return <p className="loading">Loading students...</p>;

  return (
    <div className="attendance-container">
      {/* 💡 Toast component renders all active notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <h2>CS LAB ATTENDANCE</h2>

      <div className="info">
        <label>
          Department:
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {classesList.length ? (
              classesList.map((c) => <option key={c} value={c}>{c}</option>)
            ) : (
              <>
                <option value="BSc">BSc</option>
                <option value="BA">BA</option>
                <option value="MSc">MSc</option>
                <option value="MA">MA</option>
              </>
            )}
          </select>
        </label>

        <label>
          Section:
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            {sectionsList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ marginLeft: 12 }}>
          Description:
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setDescError(false); }}
            placeholder="Reason / notes for this attendance"
            style={{ marginLeft: 6, verticalAlign: 'middle' }}
          />
          {descError && <span style={{ color: '#e74c3c', marginLeft: 8 }}>⚠️</span>}
        </label>

        <span style={{ marginLeft: 12 }}>Date: {displayDate}</span>
      </div>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student._id}>
              <td>{index + 1}</td>
              <td>{student.studentId}</td>
              <td>{student.name}</td>
              <td>
                <button
                  className={attendance[student._id] === "present" ? "present" : "absent"}
                  onClick={() => toggleAttendance(student._id)}
                >
                  {attendance[student._id]}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="submit-btn" onClick={handleSubmit}>
        Submit Attendance
      </button>
    </div>
  );
};

export default AttendanceForm;
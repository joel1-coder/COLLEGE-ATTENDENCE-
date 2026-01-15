import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Creation.css";

export default function AdminStudent() {
  const [newDepartment, setNewDepartment] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [message, setMessage] = useState("");

  const [student, setStudent] = useState({
    studentId: "",
    name: "",
    email: "",
    department: "",
    section: ""
  });
  const [students, setStudents] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [listDepartment, setListDepartment] = useState('');
  const [listSection, setListSection] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  const getApi = () => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return api;
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await getApi().get("/admin/departments");
        const list = res.data.map(d => d.name);
        setClassesList(list);
        if (list.length && !selectedDepartment) {
          setSelectedDepartment(list[0]);
          setListDepartment(list[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      if (!listDepartment) return setSectionsList([]);
      try {
        const res = await getApi().get(`/admin/sections?department=${encodeURIComponent(listDepartment)}`);
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (list.length && !listSection) setListSection(list[0]);
      } catch (err) {
        console.error('Load sections error', err);
        setSectionsList([]);
      }
    };
    loadSections();
  }, [listDepartment]);

  const fetchStudents = async (dept = listDepartment, sec = listSection) => {
    setStudentsError('');
    setStudents([]);
    const d = dept || listDepartment;
    const s = sec || listSection;
    if (!d || !s) return setStudentsError('Select department and section to view students');
    setLoadingStudents(true);
    try {
      const res = await getApi().get(`/students?department=${encodeURIComponent(d)}&section=${encodeURIComponent(s)}`);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Fetch students error', err);
      setStudentsError((err && err.response && err.response.data && err.response.data.message) || err.message || 'Failed to fetch students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await getApi().post("/admin/departments", { name: newDepartment });
      setMessage(`Department "${res.data.name}" added`);
      setNewDepartment("");
      setClassesList(prev => [...prev, res.data.name]);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add department");
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      const res = await getApi().post("/admin/sections", { name: sectionName, department: selectedDepartment });
      setMessage(`Section "${res.data.name}" added`);
      setSectionName("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add section");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: student.studentId || student.email,
        name: student.name,
        email: student.email,
        department: student.department,
        class: student.department,
        section: student.section
      };

      const res = await getApi().post("/admin/students", payload);
      setMessage(`Student "${res.data.name}" added`);
      setStudent({ studentId: "", name: "", email: "", department: "", section: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add student");
    }
  };

  return (
    <div className="creation-page">
      <h2>Student Management (Session Setup)</h2>
      {message && <div className="creation-message">{message}</div>}

      <section className="creation-panel">
        <h3>Add Department</h3>
        <form onSubmit={handleAddDepartment}>
          <input
            placeholder="Department name"
            value={newDepartment}
            onChange={e => setNewDepartment(e.target.value)}
            required
          />
          <button>Add</button>
        </form>
      </section>

      <section className="creation-panel">
        <h3>Add Section</h3>
        <form onSubmit={handleAddSection}>
          <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
            {classesList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            placeholder="Section name"
            value={sectionName}
            onChange={e => setSectionName(e.target.value)}
            required
          />
          <button>Add</button>
        </form>
      </section>

      <section className="creation-panel">
        <h3>Add Student</h3>
        <form onSubmit={handleAddStudent}>
          <input placeholder="Student ID" value={student.studentId}
            onChange={e => setStudent({ ...student, studentId: e.target.value })} />
          <input placeholder="Name" required value={student.name}
            onChange={e => setStudent({ ...student, name: e.target.value })} />
          <input placeholder="Email" required value={student.email}
            onChange={e => setStudent({ ...student, email: e.target.value })} />

          <select value={student.department}
            onChange={e => setStudent({ ...student, department: e.target.value })}>
            <option value="">Select Department</option>
            {classesList.map(d => <option key={d}>{d}</option>)}
          </select>

          <input placeholder="Section" value={student.section}
            onChange={e => setStudent({ ...student, section: e.target.value })} />

          <button>Add Student</button>
        </form>
      </section>

      <section className="creation-panel">
        <h3>View / Remove Students</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <label>Department:
            <select value={listDepartment} onChange={e => setListDepartment(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              {classesList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>Section:
            <select value={listSection} onChange={e => setListSection(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button onClick={() => fetchStudents()}>Fetch Students</button>
        </div>
        {loadingStudents && <div>Loading students...</div>}
        {studentsError && <div style={{ color: 'red' }}>{studentsError}</div>}
        {students && students.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>#</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Student ID</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Section</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id || i}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{i+1}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.studentId || ''}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.name || ''}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.section || ''}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <button onClick={async () => {
                      if (!window.confirm(`Delete student ${s.name || s.email || s.studentId}? This action cannot be undone.`)) return;
                      try {
                        await getApi().delete(`/admin/students/${s._id}`);
                        fetchStudents();
                      } catch (err) {
                        console.error('Delete student error', err);
                        if (err?.response?.status === 401 || err?.response?.status === 403) { window.location.href = '/admin/login'; return; }
                        setStudentsError((err && err.response && err.response.data && err.response.data.message) || 'Delete failed');
                      }
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

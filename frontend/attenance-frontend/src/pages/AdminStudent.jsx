import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import useToast from "../Hooks/usetoast";

export default function AdminStudent() {
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [student, setStudent] = useState({ studentId: "", name: "", email: "", department: "", section: "" });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  // 💡 All success/error messages now go through toast
  const { toasts, toast, removeToast } = useToast();

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    return api;
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await apiClient().get("/admin/departments");
      const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
      setClassesList(list);
      if (!selectedDepartment && list.length) setSelectedDepartment(list[0]);
    } catch (err) {
      toast.error("Failed to load departments");
    }
  }, [apiClient, selectedDepartment]);

  const loadSections = useCallback(async () => {
    if (!selectedDepartment) return;
    try {
      const res = await apiClient().get("/admin/sections", { params: { department: selectedDepartment } });
      setSectionsList(Array.isArray(res.data) ? res.data.map(s => s.name) : []);
    } catch (err) {
      setSectionsList([]);
    }
  }, [apiClient, selectedDepartment]);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsError("");
    try {
      const res = await apiClient().get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setStudentsError(err?.response?.data?.message || "Failed to fetch students");
      toast.error("Failed to fetch students");
    } finally {
      setLoadingStudents(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadDepartments();
    fetchStudents();
  }, []);

  useEffect(() => { loadSections(); }, [selectedDepartment]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient().post("/admin/departments", { name: newDepartment });
      toast.success(`Department "${res.data.name}" added successfully`);
      setNewDepartment("");
      loadDepartments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add department");
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient().post("/admin/sections", { name: sectionName, department: selectedDepartment });
      toast.success(`Section "${res.data.name}" added successfully`);
      setSectionName("");
      loadSections();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add section");
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
        section: student.section,
      };
      const res = await apiClient().post("/admin/students", payload);
      toast.success(`Student "${res.data.name}" added successfully`);
      setStudent({ studentId: "", name: "", email: "", department: "", section: "" });
      fetchStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add student");
    }
  };

  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student ${name}?`)) return;
    try {
      await apiClient().delete(`/admin/students/${id}`);
      toast.success(`Student "${name}" deleted successfully`);
      fetchStudents();
    } catch (err) {
      console.error("Delete student error", err);
      toast.error(err?.response?.data?.message || "Failed to delete student");
    }
  };

  return (
    <div className="creation-page">
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <h2>Student Management</h2>

      {/* ADD DEPARTMENT */}
      <section className="creation-panel">
        <h3>Add Department</h3>
        <form onSubmit={handleAddDepartment}>
          <input placeholder="Department name" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} required />
          <button>Add</button>
        </form>
      </section>

      {/* ADD SECTION */}
      <section className="creation-panel">
        <h3>Add Section</h3>
        <form onSubmit={handleAddSection}>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {classesList.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input placeholder="Section name" value={sectionName} onChange={(e) => setSectionName(e.target.value.toUpperCase())} maxLength={1} required />
          <button>Add Section</button>
        </form>
      </section>

      {/* ADD STUDENT */}
      <section className="creation-panel">
        <h3>Add Student</h3>
        <form onSubmit={handleAddStudent}>
          <input placeholder="Student ID" value={student.studentId} onChange={(e) => setStudent({ ...student, studentId: e.target.value })} />
          <input placeholder="Name" required value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} />
          <input placeholder="Email" required value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
          <select value={student.department} onChange={(e) => setStudent({ ...student, department: e.target.value, section: '' })}>
            <option value="">Select Department</option>
            {classesList.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={student.section} onChange={(e) => setStudent({ ...student, section: e.target.value })}>
            <option value="">Select Section</option>
            {sectionsList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button>Add Student</button>
        </form>
      </section>

      {/* VIEW STUDENTS */}
      <section className="creation-panel">
        <h3>View / Remove Students</h3>
        {loadingStudents ? <p>Loading...</p> : (
          <table width="100%" border="1" cellPadding="6">
            <thead>
              <tr><th>#</th><th>Student ID</th><th>Name</th><th>Dept</th><th>Section</th><th>Action</th></tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.section}</td>
                  <td><button onClick={() => deleteStudent(s._id, s.name)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
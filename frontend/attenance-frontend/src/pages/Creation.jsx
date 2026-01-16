import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Creation.css";

function Creation() {
  /* ---------------- STATES ---------------- */
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
    section: "",
  });

  /* ---------------- API CLIENT ---------------- */
  const apiClient = useCallback(() => {
    const api = axios.create({
      baseURL: "https://college-attendence.onrender.com/api",
    });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return api;
  }, []);

  /* ---------------- LOAD DEPARTMENTS ---------------- */
  const loadDepartments = useCallback(async () => {
    try {
      const res = await apiClient().get("/admin/departments");
      const list = Array.isArray(res.data) ? res.data.map((d) => d.name) : [];
      setClassesList(list);

      if (list.length && !selectedDepartment) {
        setSelectedDepartment(list[0]);
      }
    } catch (err) {
      console.error("Load departments error", err);
    }
  }, [apiClient, selectedDepartment]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  /* ---------------- ADD DEPARTMENT ---------------- */
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await apiClient().post("/admin/departments", {
        name: newDepartment,
      });
      setMessage(`Department "${res.data.name}" added`);
      setNewDepartment("");
      loadDepartments();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to add department");
    }
  };

  /* ---------------- ADD SECTION ---------------- */
  const handleAddSection = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await apiClient().post("/admin/sections", {
        name: sectionName,
        department: selectedDepartment,
      });
      setMessage(`Section "${res.data.name}" added`);
      setSectionName("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to add section");
    }
  };

  /* ---------------- ADD STUDENT ---------------- */
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payload = {
        studentId: student.studentId || student.email,
        name: student.name,
        email: student.email,
        department: student.department,
        section: student.section,
      };

      const res = await apiClient().post("/admin/students", payload);
      setMessage(`Student "${res.data.name}" added`);
      setStudent({
        studentId: "",
        name: "",
        email: "",
        department: "",
        section: "",
      });
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to add student");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="creation-page">
      <h2>Creation / Management</h2>
      {message && <div className="creation-message">{message}</div>}

      {/* ADD DEPARTMENT */}
      <section className="creation-panel">
        <h3>Add Department</h3>
        <form onSubmit={handleAddDepartment}>
          <input
            placeholder="Department name"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            required
          />
          <button>Add</button>
        </form>
      </section>

      {/* ADD SECTION */}
      <section className="creation-panel">
        <h3>Add Section</h3>
        <form onSubmit={handleAddSection}>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {classesList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            placeholder="Section name"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            required
          />
          <button>Add</button>
        </form>
      </section>

      {/* ADD STUDENT */}
      <section className="creation-panel">
        <h3>Add Student</h3>
        <form onSubmit={handleAddStudent}>
          <input
            placeholder="Student ID"
            value={student.studentId}
            onChange={(e) =>
              setStudent({ ...student, studentId: e.target.value })
            }
          />
          <input
            placeholder="Name"
            required
            value={student.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })}
          />
          <input
            placeholder="Email"
            required
            value={student.email}
            onChange={(e) => setStudent({ ...student, email: e.target.value })}
          />
          <select
            value={student.department}
            onChange={(e) =>
              setStudent({ ...student, department: e.target.value })
            }
          >
            <option value="">Select Department</option>
            {classesList.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            placeholder="Section"
            value={student.section}
            onChange={(e) =>
              setStudent({ ...student, section: e.target.value })
            }
          />
          <button>Add Student</button>
        </form>
      </section>
    </div>
  );
}

export default Creation;

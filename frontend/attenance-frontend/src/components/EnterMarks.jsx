import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PreviousAttendance.css";

const api = axios.create({
  baseURL: "https://college-attendence.onrender.com/api",
});

const attachToken = () => {
  const stored = JSON.parse(localStorage.getItem("user")) || null;
  if (stored?.token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
  }
};

export default function EnterMarks() {
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [sectionsList, setSectionsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [students, setStudents] = useState([]);
  const [description, setDescription] = useState("");
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Date helpers
  const today = new Date();
  const displayDate = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}-${today.getFullYear()}`;

  /* ------------------ LOAD DEPARTMENTS & SECTIONS ------------------ */
  useEffect(() => {
    attachToken();

    const fetchDepartments = async () => {
      try {
        const res = await api.get("/admin/departments");
        const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
        setClassesList(list);
        if (!department && list.length) setDepartment(list[0]);
      } catch (err) {
        console.warn("Failed to load departments", err);
      }
    };

    const fetchSections = async () => {
      if (!department) return;
      try {
        const res = await api.get("/admin/sections", {
          params: { department },
        });
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn("Failed to load sections", err);
        setSectionsList([]);
      }
    };

    fetchDepartments();
    fetchSections();
  }, [department, section]);

  /* ------------------ LOAD STUDENTS ------------------ */
  useEffect(() => {
    if (!department || !section) return;

    attachToken();
    setLoading(true);

    api
      .get("/students", {
        params: { department, section },
      })
      .then(res => {
        const data = res.data || [];
        setStudents(data);
        const initialMarks = {};
        data.forEach(s => {
          initialMarks[s._id] = "0";
        });
        setMarks(initialMarks);
      })
      .catch(err => {
        console.error(err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [department, section]);

  /* ------------------ SAVE MARKS ------------------ */
  const save = async (opts = {}) => {
    setMessage("");

    const records = Object.keys(marks).map(id => ({
      student: id,
      mark: Number(marks[id]),
    }));

    const payload = {
      date: new Date().toISOString().split("T")[0],
      department,
      section,
      description,
      records,
      merge: opts.merge,
    };

    try {
      attachToken();
      const res = await api.post("/marks", payload);
      setMessage(res.data?.message || "Marks saved");
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};

      if (status === 409 && body?.existingId) {
        const ok = window.confirm(
          "Marks already exist. Merge with existing record?"
        );
        if (ok) {
          await save({ merge: true });
          return;
        }
      }
      setMessage(body?.message || "Save failed");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Enter Marks</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label>
          Department:
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {classesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Section:
          <select value={section} onChange={e => setSection(e.target.value)}>
            {sectionsList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label style={{ flex: 1 }}>
          Description:
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div>Date: {displayDate}</div>
      </div>

      {loading && <p>Loading students...</p>}

      <table width="100%" border="1">
        <thead>
          <tr>
            <th>#</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Mark</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={s._id}>
              <td>{i + 1}</td>
              <td>{s.studentId}</td>
              <td>{s.name}</td>
              <td>
                <input
                  value={marks[s._id] || ""}
                  onChange={e =>
                    setMarks({ ...marks, [s._id]: e.target.value })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={save} style={{ marginTop: 12 }}>
        Save Marks
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

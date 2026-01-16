import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import "./PreviousAttendance.css";

export default function PreviousAttendance() {
  /* ---------------- STATES ---------------- */
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [updatingIds, setUpdatingIds] = useState({});

  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");

  const today = new Date().toISOString().split("T")[0];

  /* ---------------- API CLIENT ---------------- */
  const apiClient = useCallback(() => {
    const instance = api;
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return instance;
  }, []);

  /* ---------------- HELPERS ---------------- */
  const parseDate = (val) => (/^\d{4}-\d{2}-\d{2}$/.test(val) ? val : null);
  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  /* ---------------- FETCH ATTENDANCE ---------------- */
  const fetchFor = async (rawDate) => {
    setError("");
    setAttendance([]);

    const dateStr = parseDate(rawDate);
    if (!dateStr) {
      setError("Please choose a valid date");
      return;
    }

    setLoading(true);
    try {
      const instance = apiClient();
      let url = `/attendance?date=${dateStr}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (section) url += `&section=${encodeURIComponent(section)}`;

      const res = await instance.get(url);
      const data = res.data;

      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data?.records) items = [data];

      setAttendance(items);
      if (items.length === 0) setError(`No attendance found for ${dateStr}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EXPORT ---------------- */
  const downloadExcel = async () => {
    const dateStr = parseDate(input);
    if (!dateStr) {
      alert("Choose a valid date first");
      return;
    }

    try {
      const instance = apiClient();
      let url = `/attendance/export?date=${dateStr}&format=xlsx`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (section) url += `&section=${encodeURIComponent(section)}`;

      const res = await instance.get(url, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `attendance-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  };

  /* ---------------- UPDATE RECORD ---------------- */
  const updateRecordStatus = async (attendanceId, recordId, status) => {
    if (!attendanceId || !recordId) return;

    setUpdatingIds((s) => ({ ...s, [recordId]: true }));
    setError("");

    try {
      // optimistic UI update
      setAttendance((prev) =>
        prev.map((item) =>
          item._id !== attendanceId
            ? item
            : {
                ...item,
                records: item.records.map((r) =>
                  r._id === recordId ? { ...r, status } : r
                ),
              }
        )
      );

      const instance = apiClient();
      await instance.put(`/attendance/${attendanceId}/records/${recordId}`, { status });
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed");
      await fetchFor(input);
    } finally {
      setUpdatingIds((s) => {
        const ns = { ...s };
        delete ns[recordId];
        return ns;
      });
    }
  };

  /* ---------------- LOAD DEPARTMENTS ---------------- */
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await apiClient().get("/admin/departments");
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, [apiClient]);

  /* ---------------- LOAD SECTIONS ---------------- */
  useEffect(() => {
    const loadSections = async () => {
      if (!department) {
        setSections([]);
        return;
      }
      try {
        const res = await apiClient().get(
          `/admin/sections?department=${encodeURIComponent(department)}`
        );
        setSections(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSections([]);
      }
    };
    loadSections();
  }, [department, apiClient]);

  /* ---------------- UI ---------------- */
  return (
    <div className="previous-attendance">
      <div className="header">
        <h2>Previous Attendance</h2>
        <button onClick={downloadExcel}>Download</button>
      </div>

      <div className="controls">
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => {
            const name = typeof d === "string" ? d : d.name;
            return <option key={name} value={name}>{name}</option>;
          })}
        </select>

        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">All Sections</option>
          {sections.map((s) => {
            const name = typeof s === "string" ? s : s.name;
            return <option key={name} value={name}>{name}</option>;
          })}
        </select>

        <input type="date" value={input} max={today} onChange={(e) => setInput(e.target.value)} />
        <button onClick={() => fetchFor(input)}>Fetch</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {attendance.map((item, idx) => (
        <div key={item._id || idx} className="attendance-card">
          <h4>{ordinal(idx + 1)} Attendance</h4>
          <p>{item.description || "—"}</p>

          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(item.records || []).map((r) => {
                const s = r.student || {};
                return (
                  <tr key={r._id}>
                    <td>{s.studentId || "-"}</td>
                    <td>{s.name || "-"}</td>
                    <td>
                      <button
                        onClick={() =>
                          updateRecordStatus(
                            item._id,
                            r._id,
                            r.status === "present" ? "absent" : "present"
                          )
                        }
                        disabled={updatingIds[r._id]}
                        style={{
                          background: r.status === "present" ? "#2ecc71" : "#e74c3c",
                          color: "#fff",
                        }}
                      >
                        {updatingIds[r._id] ? "Updating…" : r.status}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

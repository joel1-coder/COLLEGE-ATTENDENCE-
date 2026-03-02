import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Toast from "./Toast";
import useToast from "../Hooks/usetoast";

export default function PreviousAttendance() {
  const [input, setInput] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [updatingIds, setUpdatingIds] = useState({});

  // 💡 Replaced plain error/message state with toast
  const { toasts, toast, removeToast } = useToast();

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    return api;
  }, []);

  const parseDate = (val) => {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d)) return null;
    return d.toISOString().split("T")[0];
  };

  const fetchFor = async (rawDate) => {
    setAttendance([]);
    const dateStr = parseDate(rawDate);
    if (!dateStr) {
      toast.warning("Please choose a valid date");
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
      if (items.length === 0) toast.info(`No attendance found for ${dateStr}`);
      else toast.success(`Loaded attendance for ${dateStr}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    const dateStr = parseDate(input);
    if (!dateStr) {
      toast.warning("Choose a valid date first");
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
      toast.success("Excel file downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    }
  };

  const updateRecordStatus = async (attendanceId, recordId, status) => {
    if (!attendanceId || !recordId) return;
    setUpdatingIds((s) => ({ ...s, [recordId]: true }));

    try {
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
      toast.success(`Status updated to "${status}"`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
      await fetchFor(input);
    } finally {
      setUpdatingIds((s) => {
        const ns = { ...s };
        delete ns[recordId];
        return ns;
      });
    }
  };

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

  useEffect(() => {
    const loadSections = async () => {
      if (!department) { setSections([]); return; }
      try {
        const res = await apiClient().get(`/admin/sections?department=${encodeURIComponent(department)}`);
        setSections(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSections([]);
      }
    };
    loadSections();
  }, [department, apiClient]);

  return (
    <div className="previous-attendance">
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

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

        <input
          type="date"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={() => fetchFor(input)}>Fetch</button>
      </div>

      {loading && <p>Loading...</p>}

      {attendance.map((item) => (
        <div key={item._id} style={{ marginBottom: 24 }}>
          <h3>{item.description} — {item.date}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Student ID</th><th>Name</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(item.records || []).map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.student?.studentId}</td>
                  <td>{r.student?.name}</td>
                  <td>
                    <select
                      value={r.status}
                      disabled={updatingIds[r._id]}
                      onChange={(e) => updateRecordStatus(item._id, r._id, e.target.value)}
                    >
                      <option value="present">present</option>
                      <option value="absent">absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import api from "../api/api";
import "./PreviousAttendance.css";

export default function PreviousAttendance() {
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

  const getApiInstance = () => {
    const instance = api;
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return instance;
  };

  const findRecordExists = (attendanceId, recordId) => {
    if (!attendanceId || !recordId) return false;
    for (const item of attendance) {
      if (item._id === attendanceId) {
        if (Array.isArray(item.records) && item.records.some((r) => r._id === recordId)) return true;
      }
    }
    return false;
  };

  const parseDate = (val) => {
    if (!val) return null;
    const re = /^\d{4}-\d{2}-\d{2}$/;
    return re.test(val) ? val : null;
  };

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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
      const instance = getApiInstance();
      let url = `/attendance?date=${dateStr}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (section) url += `&section=${encodeURIComponent(section)}`;

      const res = await instance.get(url);
      const data = res.data;
      console.log('Fetched attendance response', data);

      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data?.records) items = [data];

      setAttendance(items);
      if (items.length === 0) {
        setError(`No attendance found for ${dateStr}`);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    const dateStr = parseDate(input);
    if (!dateStr) {
      alert("Choose a valid date first");
      return;
    }

    try {
      const instance = getApiInstance();
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
      alert("Download failed");
    }
  };

  const updateRecordStatus = async (attendanceId, recordId, status) => {
    if (!attendanceId || !recordId) {
      window.alert('Record or attendance id missing — cannot update');
      return;
    }
    setError("");
    setUpdatingIds((s) => ({ ...s, [recordId]: true }));
    try {
      // optimistic UI update
      setAttendance((prev) =>
        prev.map((item) => {
          if (item._id !== attendanceId) return item;
          return {
            ...item,
            records: (item.records || []).map((r) => (r._id === recordId ? { ...r, status } : r)),
          };
        })
      );
      const instance = getApiInstance();
      // debug: show stored user and axios auth header
      try {
        const storedDebug = JSON.parse(localStorage.getItem('user')) || null;
        console.log('DEBUG stored user before update:', storedDebug);
      } catch (e) {
        console.log('DEBUG stored user parse error');
      }
      console.log('DEBUG instance auth header:', instance?.defaults?.headers?.common?.Authorization);
      console.log('Updating record', { attendanceId, recordId, status });
      const endpoint = `/attendance/${attendanceId}/records/${recordId}`;
      console.log('PUT', endpoint, { status });
      const res = await instance.put(endpoint, { status });
      console.log('Update response', res && res.data);
      window.alert(res?.data?.message || 'Record updated');
    } catch (err) {
      console.error('Update record error', err);
      const msg = err?.response?.data?.message || err.message || 'Failed to update record';
      setError(msg);
      window.alert(msg);
      // revert optimistic update by re-fetching
      try {
        await fetchFor(input);
      } catch {}
    } finally {
      setUpdatingIds((s) => {
        const ns = { ...s };
        delete ns[recordId];
        return ns;
      });
    }
  };

  const deleteRecord = async (attendanceId, recordId) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    if (!attendanceId || !recordId) {
      window.alert('Record or attendance id missing — cannot delete');
      return;
    }
    setError("");
    setUpdatingIds((s) => ({ ...s, [recordId]: true }));
    try {
      // optimistic UI remove
      setAttendance((prev) =>
        prev.map((item) => {
          if (item._id !== attendanceId) return item;
          return { ...item, records: (item.records || []).filter((r) => r._id !== recordId) };
        })
      );
      const instance = getApiInstance();
      // debug: show stored user and axios auth header for delete
      try {
        const storedDebug = JSON.parse(localStorage.getItem('user')) || null;
        console.log('DEBUG stored user before delete:', storedDebug);
      } catch (e) {
        console.log('DEBUG stored user parse error (delete)');
      }
      console.log('DEBUG instance auth header (delete):', instance?.defaults?.headers?.common?.Authorization);
      const endpoint = `/attendance/${attendanceId}/records/${recordId}`;
      console.log('DELETE', endpoint);
      const res = await instance.delete(endpoint);
      console.log('Delete response', res && res.data);
      window.alert(res?.data?.message || 'Record deleted');
    } catch (err) {
      console.error('Delete record error', err);
      const msg = err?.response?.data?.message || err.message || 'Failed to delete record';
      setError(msg);
      window.alert(msg);
      // revert optimistic removal
      try {
        await fetchFor(input);
      } catch {}
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
        const res = await getApiInstance().get("/admin/departments");
        const list = Array.isArray(res.data) ? res.data : [];
        console.log('PreviousAttendance: loaded departments', list);
        setDepartments(list);
      } catch {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      if (!department) {
        setSections([]);
        return;
      }
      try {
        const res = await getApiInstance().get(
          `/admin/sections?department=${encodeURIComponent(department)}`
        );
        const list = Array.isArray(res.data) ? res.data : [];
        console.log('PreviousAttendance: loaded sections for', department, list);
        setSections(list);
      } catch {
        setSections([]);
      }
    };
    loadSections();
  }, [department]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") fetchFor(input);
  };

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
            const name = typeof d === 'string' ? d : (d.name || '');
            const key = (d && d._id) ? d._id : name;
            return <option key={key} value={name}>{name}</option>;
          })}
        </select>

        <select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">All Sections</option>
          {sections.map((s) => {
            const name = typeof s === 'string' ? s : (s.name || '');
            const key = (s && s._id) ? s._id : name;
            return <option key={key} value={name}>{name}</option>;
          })}
        </select>

        <input
          type="date"
          value={input}
          max={today}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <button onClick={() => fetchFor(input)}>Fetch</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {attendance.map((item, idx) => (
        <div key={idx} className="attendance-card">
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
              {(item.records || []).map((r, i) => {
                const s = r.student || {};
                const attendanceId = item._id;
                const recordId = r._id;
                const hasIds = Boolean(attendanceId && recordId);
                return (
                  <tr key={recordId || `rec-${i}`}>
                    <td>{s.studentId || "-"}</td>
                    <td>{
                      (s.name && String(s.name).trim())
                        ? s.name
                        : ((s.firstName || s.lastName) ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : (s.studentId || "-"))
                    }</td>
                    <td>
                      <button
                        onClick={() => hasIds ? updateRecordStatus(attendanceId, recordId, r.status === 'present' ? 'absent' : 'present') : window.alert('Missing record id; cannot update')}
                        disabled={!hasIds || Boolean(updatingIds[recordId])}
                        style={{
                          background: r.status === 'present' ? '#2ecc71' : '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: 4,
                          cursor: hasIds && !updatingIds[recordId] ? 'pointer' : 'not-allowed',
                          opacity: updatingIds[recordId] ? 0.7 : 1
                        }}
                      >
                        {updatingIds[recordId] ? 'Updating…' : r.status}
                      </button>
                      {!hasIds && <div style={{ color: '#a00', marginTop: 6 }}>Missing internal id — cannot edit</div>}
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

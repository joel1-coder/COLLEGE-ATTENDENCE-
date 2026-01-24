import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function MarkRecord() {
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient().get('/admin/departments');
        const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
        setClassesList(list);
        if (!department && list.length) setDepartment(list[0]);
      } catch (err) {
        console.warn('Failed to load departments', err);
      }
    };
    fetch();
  }, [apiClient, department]);

  useEffect(() => {
    if (!department) {
      setSectionsList([]);
      return;
    }
    const fetch = async () => {
      try {
        const res = await apiClient().get('/admin/sections', { params: { department } });
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn('Failed to load sections', err);
        setSectionsList([]);
      }
    };
    fetch();
  }, [department, apiClient, section]);

  // Fetch students for selected department/section and initialize records (default mark 0)
  useEffect(() => {
    if (!department || !section) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const api = apiClient();
        const res = await api.get(`/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`);
        const students = Array.isArray(res.data) ? res.data : [];
        const defaultRecords = students.map(s => ({
          id: s._id,
          studentId: s.studentId || '',
          name: s.name || '',
          mark: 0,
        }));
        setRecords(defaultRecords);
      } catch (err) {
        console.warn('Failed to fetch students', err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [department, section, apiClient]);

  const fetchMarks = async () => {
    if (!date || !department || !section) {
      setMessage('Select date, department and section');
      return;
    }
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (!stored?.token) {
      setMessage('Not authenticated — please log in');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const res = await apiClient().get('/marks', { params: { date, department, section } });
      const doc = res.data || { records: [] };
      const normalized = (doc.records || []).map(r => ({
        id: r.student?._id || r.student,
        studentId: r.student?.studentId || '',
        name: r.student?.name || '',
        mark: r.mark ?? 0,
      }));
      setRecords(normalized);
    } catch (err) {
      console.error('Failed to fetch marks', err);
      setRecords([]);
      if (err?.response?.status === 401) {
        setMessage('Unauthorized — please log in again');
        localStorage.removeItem('user');
        // redirect to login page (app should have a login route)
        window.location.href = '/login';
        return;
      }
      setMessage(err?.response?.data?.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!date || !department || !section) {
      setMessage('Select date, department and section');
      return;
    }
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (!stored?.token) {
      setMessage('Not authenticated — please log in');
      return;
    }
    setMessage('');
    const payload = {
      date,
      department,
      section,
      records: records.map(r => ({ student: r.id, mark: Number(r.mark) })),
    };
    try {
      const res = await apiClient().post('/marks', payload);
      setMessage(res.data?.message || 'Saved');
    } catch (err) {
      console.error('Save failed', err);
      if (err?.response?.status === 401) {
        setMessage('Unauthorized — please log in again');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      setMessage(err?.response?.data?.message || 'Save failed');
    }
  };

  const downloadExcel = () => {
    if (!records || records.length === 0) {
      setMessage('No records to download');
      return;
    }
    const data = records.map((r, i) => ({
      '#': i + 1,
      'Student ID': r.studentId ?? '',
      Name: r.name ?? '',
      Mark: r.mark ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(data, { header: ['#', 'Student ID', 'Name', 'Mark'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const fname = `marks-${department || 'all'}-${section || 'all'}-${date}.xlsx`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fname);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setMessage('Download started');
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Mark Record</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Department:
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Section:
          <select value={section} onChange={e => setSection(e.target.value)}>
            {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Date:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchMarks} className="btn">Fetch</button>
          <button onClick={save} className="btn" disabled={records.length === 0}>Save</button>
          <button onClick={downloadExcel} className="btn secondary" disabled={records.length === 0}>Download</button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Mark</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id || i}>
                <td>{i + 1}</td>
                <td>{r.studentId}</td>
                <td>{r.name}</td>
                <td>
                  <input value={r.mark} onChange={e => {
                    const copy = [...records];
                    copy[i] = { ...copy[i], mark: e.target.value };
                    setRecords(copy);
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
        

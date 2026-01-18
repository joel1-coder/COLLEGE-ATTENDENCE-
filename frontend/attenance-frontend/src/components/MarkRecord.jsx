import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function MarkRecord() {
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState('');

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient().get('/admin/departments');
        const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
        setClassesList(list);
        if (!department && list.length) setDepartment(list[0]);
      } catch (err) {
        console.warn('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, [apiClient, department]);

  useEffect(() => {
    if (!department) return;
    const fetchSections = async () => {
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
    fetchSections();
  }, [department, section, apiClient]);

  const fetchMarks = async (e) => {
    e && e.preventDefault();
    if (!date || !department || !section) {
      setMessage('Please select department, section and date');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient().get('/marks', { params: { date, department, section } });
      const doc = res.data || { records: [] };
      const recs = Array.isArray(doc.records)
        ? doc.records.map(r => ({ id: r.student?._id || r.student, studentId: r.student?.studentId || '', name: r.student?.name || '', mark: r.mark || 0 }))
        : [];
      setRecords(recs);
      if (!recs.length) setMessage('No marks found for the selected criteria');
    } catch (err) {
      console.error('Failed to fetch marks', err);
      setMessage('Failed to fetch marks');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (studentId, value) => {
    setRecords(prev => prev.map(r => (r.id === studentId ? { ...r, mark: value } : r)));
  };

  const save = async () => {
    if (!department || !section || !date) {
      setMessage('Department, section and date are required');
      return;
    }
    const payload = {
      date,
      department,
      section,
      records: records.map(r => ({ student: r.id, mark: Number(r.mark || 0) })),
    };
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient().post('/marks', payload);
      setMessage(res.data?.message || 'Saved');
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      if (status === 409 && body?.existingId) {
        const ok = window.confirm('Marks already exist for this date/department/section. Merge with existing?');
        if (ok) {
          await apiClient().post('/marks', { ...payload, merge: true });
          setMessage('Merged successfully');
          setLoading(false);
          return;
        }
      }
      setMessage(body?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Mark Record</h2>
      <form onSubmit={fetchMarks} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <label>
          Department:
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Section:
          <select value={section} onChange={e => setSection(e.target.value)}>
            {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Date:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>

        <button type="submit">Load</button>
        <button type="button" onClick={save} disabled={loading || !records.length}>Save</button>
      </form>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

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
          {records.map((r, i) => (
            <tr key={r.id || i}>
              <td>{i + 1}</td>
              <td>{r.studentId}</td>
              <td>{r.name}</td>
              <td>
                <input value={r.mark} onChange={e => updateMark(r.id, e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

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
    if (!department) return;
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

  const fetchMarks = async () => {
    if (!date || !department || !section) {
      setMessage('Select date, department and section');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const res = await apiClient().get('/marks', { params: { date, department, section } });
      const doc = res.data || { records: [] };
      // records may contain populated student object or just id
      const normalized = (doc.records || []).map(r => ({
        id: r.student?._id || r.student,
        studentId: r.student?.studentId || r.student?.studentId || '',
        name: r.student?.name || '',
        mark: r.mark ?? 0,
      }));
      setRecords(normalized);
    } catch (err) {
      console.error('Failed to fetch marks', err);
      setRecords([]);
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
      setMessage(err?.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Mark Record</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <label>
          Department:
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Section:
          <select value={section} onChange={e => setSection(e.target.value)}>
            {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Date:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <button onClick={fetchMarks}>Fetch</button>
      </div>

      {loading && <p>Loading...</p>}

      {records.length === 0 && !loading && <p>No records found for selected date.</p>}

      {records.length > 0 && (
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
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={records.length === 0}>Save Changes</button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

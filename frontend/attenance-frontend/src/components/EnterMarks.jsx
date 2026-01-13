import React, { useEffect, useState } from "react";
import axios from "axios";
import './PreviousAttendance.css';

export default function EnterMarks(){
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [sectionsList, setSectionsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [students, setStudents] = useState([]);
  const [description, setDescription] = useState('');
  // date helpers (display like MM-DD-YYYY, payload as YYYY-MM-DD)
  const todayDate = new Date();
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const displayDate = `${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}-${todayDate.getFullYear()}`;
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;

    const fetchClasses = async () => {
      try {
        const res = await api.get('/admin/departments');
        const cls = Array.isArray(res.data) ? res.data.map(c => c.name) : [];
        setClassesList(cls);
        if (!department && cls.length) setDepartment(cls[0]);
      } catch (err) {
        console.warn('Could not load classes', err);
      }
    };

    const fetchSectionsForClass = async (forClass) => {
      try {
        if (!forClass) return setSectionsList([]);
        // request sections by department
        const sRes = await api.get(`/admin/sections?department=${encodeURIComponent(forClass)}`);
        const secs = Array.isArray(sRes.data) ? sRes.data.map(s => s.name) : [];
        setSectionsList(secs);
        if (!section && secs.length) setSection(secs[0]);
      } catch (err) {
        console.warn('Could not load sections for class', forClass, err);
        setMessage('Could not load sections — please login or check server');
      }
    };


    if (department) fetchSectionsForClass(department);
    const onSectionsUpdated = () => fetchSectionsForClass(department);
    window.addEventListener('sectionsUpdated', onSectionsUpdated);
    const fetchSections = async (dept) => {
      try {
        const res = await api.get('/admin/sections', { params: { department: dept } });
        const secs = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(secs);
        if (!section && secs.length) setSection(secs[0]);
      } catch (err) {
        console.warn('Could not load sections', err);
        setSectionsList([]);
      }
    };

    fetchClasses();
    if (department) fetchSections(department);
  }, [department]);

  useEffect(() => {
    if (!department || !section) return;
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    setLoading(true);
    api.get(`/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`)
      .then(res => {
        setStudents(res.data || []);
        const m = {};
        (res.data || []).forEach(s => { m[s._id] = '0'; });
        setMarks(m);
      })
      .catch(err => { console.error(err); setStudents([]); })
      .finally(() => setLoading(false));
  }, [department, section]);

  const save = async (opts = {}) => {
    setMessage('');
    const records = Object.keys(marks).map(k => ({ student: k, mark: Number(marks[k]) }));
    const payload = { date: new Date().toISOString().split('T')[0], department, section, records, description, merge: opts.merge };
    try {
      const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      const resp = await api.post('/marks', payload);
      setMessage(resp.data?.message || 'Saved marks');
    } catch (err) {
      console.error('Save marks error', err);
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      if (status === 409 && body?.existingId) {
        const ok = window.confirm('A marks entry with the same description already exists. Do you want to merge your input into the existing marks?');
        if (ok) {
          // resend with merge flag
          await save({ merge: true });
          return;
        } else {
          setMessage('Save canceled; change description to create a new marks entry.');
          return;
        }
      }
      setMessage(body?.message || err.message || 'Save failed');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Enter Marks</h2>

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label>
          Department:
          <select value={department} onChange={e => setDepartment(e.target.value)} style={{ marginLeft: 8 }}>
            {classesList.length ? classesList.map(c => <option key={c} value={c}>{c}</option>) : <option>Loading...</option>}
          </select>
        </label>

        <label>
          Section:
          <select value={section} onChange={e => setSection(e.target.value)} style={{ marginLeft: 8 }}>
            {sectionsList.length ? sectionsList.map(s => <option key={s} value={s}>{s}</option>) : <option value={section}>Select section</option>}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', minWidth: 320 }}>
          Description:
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Reason / notes for these marks"
            style={{ marginTop: 6, resize: 'vertical' }}
          />
        </label>

        <span style={{ marginLeft: 'auto' }}>Date: {displayDate}</span>
        <button onClick={() => { /* trigger refetch by toggling section */ setSection(section); }} style={{ marginLeft: 8 }}>Load</button>
      </div>

      {loading && <div>Loading students...</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>#</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Student ID</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Mark</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={s._id}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{i+1}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.studentId}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{s.name}</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>
                <input value={marks[s._id] || ''} onChange={e => setMarks({ ...marks, [s._id]: e.target.value })} style={{ width: 80 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save Marks</button>
      </div>

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}

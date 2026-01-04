import React, { useState } from 'react';
import api from '../api/api';
import './PreviousAttendance.css';

export default function PreviousAttendance() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState(null);

  // Accept either MM-DD-YYYY or YYYY-MM-DD (date picker produces YYYY-MM-DD)
  const parseAndConvert = (val) => {
  if (!val) return null;

  // HTML date input always gives YYYY-MM-DD
  const re = /^\d{4}-\d{2}-\d{2}$/;
  return re.test(val) ? val : null;
 };


  const fetchFor = async (raw) => {
    setError('');
    setAttendance(null);
    const dateStr = parseAndConvert(raw);
    if (!dateStr) {
      setError('Invalid date format. Use MM-DD-YYYY');
      return;
    }
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const instance = api;
      if (stored?.token) instance.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
      const resp = await instance.get(`/attendance?date=${dateStr}`);
      setAttendance(resp.data || null);
      if (!resp.data || !resp.data.records || resp.data.records.length === 0) {
        setError(`No attendance found for ${raw}`);
      }
    } catch (err) {
      console.error('Fetch error', err);
      const msg = err?.response?.data?.message || err.message || 'Failed to fetch';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchFor(input);
    }
  };
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="previous-attendance">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Previous Attendence list</h2>
        <div>
          {/* <button onClick={() => fetchFor(input)} style={{ marginRight: 8 }}>Fetch</button> */}
          <button onClick={() => downloadExcel(input)}>Download</button>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Choose date: </label>
        <input
          type="date"
          placeholder="DD-MM-YYYY"
          value={input}
          onChange={(e) => fetchFor(e.target.value)}
          max={today}
          onKeyDown={onKeyDown}
          style={{ marginLeft: 8 }}
        />
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {attendance && attendance.records && attendance.records.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ background: 'blue', border: '1px solid #ddd', padding: 8 }}>Student ID</th>
              <th style={{ background: 'blue',border: '1px solid #ddd', padding: 8 }}>Name</th>
              <th style={{ background: 'blue',border: '1px solid #ddd', padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.records.map((r) => {
              const s = r.student || {};
              const sid = s.studentId || (s._id ? String(s._id) : '');
              const name = s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : (s.name || '');
              return (
                <tr key={sid + Math.random()}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{sid}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{name}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

async function downloadExcelRaw(dateRaw) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    throw new Error('Invalid date format');
  }

  const stored = JSON.parse(localStorage.getItem('user')) || null;
  const instance = api;

  if (stored?.token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
  }

  const resp = await instance.get(
    `/attendance/export?date=${dateRaw}&format=xlsx`,
    { responseType: 'blob' }
  );

  return { blob: resp.data, dateStr: dateRaw };
}


function downloadExcel(dateRaw) {
  downloadExcelRaw(dateRaw).then(({ blob, dateStr }) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${dateStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }).catch(err => {
    console.error('Download error', err);
    alert(err?.response?.data?.message || err.message || 'Download failed');
  });
}

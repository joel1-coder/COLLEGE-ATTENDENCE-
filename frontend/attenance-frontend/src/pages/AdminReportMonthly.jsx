import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminReportMonthly(){
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [view, setView] = useState('student');
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    api.get('/admin/departments').then(res => setDepartments(res.data || [])).catch(() => setDepartments([]));
  }, []);

  const fetchReport = async (p = 1, fmt) => {
    setLoading(true);
    try {
      const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;

      const params = { page: p, view };
      if (month) params.month = month;
      if (year) params.year = year;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (department) params.department = department;
      if (section) params.section = section;
      if (fmt) params.format = fmt;

      if (fmt) {
        // perform authenticated download (avoid losing SPA state)
        try {
          const res = await api.get('/admin/reports/monthly', { params, responseType: 'blob' });
          const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'] || '';
          let filename = `report-${month || startDate}-to-${endDate || year}.dat`;
          const m = disposition.match(/filename\*=UTF-8''(.+)$|filename="?([^;\n"]+)"?/i);
          if (m) filename = decodeURIComponent(m[1] || m[2]);
          const blob = new Blob([res.data], { type: res.headers['content-type'] });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Export error', err);
          if (err?.response && (err.response.status === 401 || err.response.status === 403)) {
            window.location.href = '/admin/login';
            return;
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      const res = await api.get('/admin/reports/monthly', { params });
      setData(res.data?.data || []);
      setPage(res.data?.page || 1);
      setPages(res.data?.pages || 1);
    } catch (err) {
      console.error('Fetch report error', err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        window.location.href = '/admin/login';
        return;
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Monthly Reports</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>Month:
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">-- select --</option>
            {[...Array(12)].map((_,i)=> <option key={i+1} value={String(i+1).padStart(2,'0')}>{i+1}</option>)}
          </select>
        </label>
        <label>Year:
          <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: 100, marginLeft: 8 }} />
        </label>
        <label>Or start date:
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>end date:
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>Department:
          <select value={department} onChange={e=>setDepartment(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
          </select>
        </label>
        <label>Section:
          <input value={section} onChange={e=>setSection(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>View:
          <select value={view} onChange={e=>setView(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="student">Per-student</option>
            <option value="class">Per-class</option>
          </select>
        </label>
        <button onClick={() => fetchReport(1)}>Generate</button>
        <button onClick={() => fetchReport(1,'csv')}>Export CSV</button>
        <button onClick={() => fetchReport(1,'xlsx')}>Export XLSX</button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && data && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>#</th>
                {view === 'student' ? (
                  <>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Student ID</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Name</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Department</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Section</th>
                  </>
                ) : (
                  <>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Department</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>Section</th>
                  </>
                )}
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Sessions</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Presents</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Absents</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Percent</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r,i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{i+1}</td>
                  {view === 'student' ? (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.studentId}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.department}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.section}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.department}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.section}</td>
                    </>
                  )}
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.sessions}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.presents}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.absents}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{Number(r.percent).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { if (page > 1) fetchReport(page-1); }} disabled={page<=1}>Prev</button>
            <span>Page {page} / {pages}</span>
            <button onClick={() => { if (page < pages) fetchReport(page+1); }} disabled={page>=pages}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}


// import React, { useEffect, useState, useCallback } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';

// export default function MarkRecord() {
//   const [department, setDepartment] = useState('');
//   const [section, setSection] = useState('');
//   const [classesList, setClassesList] = useState([]);
//   const [sectionsList, setSectionsList] = useState([]);
//   const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
//   const [records, setRecords] = useState([]);
//   const [markEntries, setMarkEntries] = useState([]);
//   const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [markTables, setMarkTables] = useState([]);



//   console.log(records,"recoreds")
//   console.log(markEntries,"markEntries")
//   const apiClient = useCallback(() => {
//     const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
//     const stored = JSON.parse(localStorage.getItem('user')) || null;
//     if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
//     return api;
//   }, []);

//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const res = await apiClient().get('/admin/departments');
//         const list = Array.isArray(res.data) ? res.data.map(d => d.name) : [];
//         setClassesList(list);
//         if (!department && list.length) setDepartment(list[0]);
//       } catch (err) {
//         console.warn('Failed to load departments', err);
//       }
//     };
//     fetch();
//   }, [apiClient, department]);

//   useEffect(() => {
//     if (!department) {
//       setSectionsList([]);
//       return;
//     }
//     const fetch = async () => {
//       try {
//         const res = await apiClient().get('/admin/sections', { params: { department } });
//         const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
//         setSectionsList(list);
//         if (!section && list.length) setSection(list[0]);
//       } catch (err) {
//         console.warn('Failed to load sections', err);
//         setSectionsList([]);
//       }
//     };
//     fetch();
//   }, [department, apiClient, section]);

//   // Fetch students for selected department/section and initialize records (default mark 0)
//   useEffect(() => {
//     if (!department || !section) return;
//     const fetchStudents = async () => {
//       setLoading(true);
//       try {
//         // debugger;
//         const api = apiClient();
//         const res = await api.get(`/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`);
//       //  console.log(res,"res")
//         const students = Array.isArray(res.data) ? res.data : [];
//         const defaultRecords = students.map(s => ({
//           id: s._id,
//           studentId: s.studentId || '',
//           name: s.name || '',
//           mark: 0,
//         }));
//         setRecords(defaultRecords);
//       } catch (err) {
//         console.warn('Failed to fetch students', err);
//         setRecords([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchStudents();
//   }, [department, section, apiClient]);

//  const fetchMarks = async () => {
//   if (!date || !department || !section) {
//     setMessage('Select date, department and section');
//     return;
//   }

//   const stored = JSON.parse(localStorage.getItem('user'));
//   if (!stored?.token) {
//     setMessage('Not authenticated — please log in');
//     return;
//   }

//   setLoading(true);
//   setMessage('');

//   try {
//     const api = apiClient();

//     // 1️⃣ Fetch students
//     const studentRes = await api.get(
//       `/students?department=${encodeURIComponent(department)}&section=${encodeURIComponent(section)}`
//     );
//     const students = Array.isArray(studentRes.data) ? studentRes.data : [];

//     // 2️⃣ Fetch marks
//     const marksRes = await api.get('/marks', {
//       params: { date, department, section }
//     });

//     let marksMap = {};

//     if (Array.isArray(marksRes.data) && marksRes.data.length > 0) {
//       // take latest mark entry (like attendance)
//       const latest = marksRes.data[marksRes.data.length - 1];

//       (latest.records || []).forEach(r => {
//         const studentId = r.student?._id || r.student;
//         marksMap[studentId] = r.mark;
//       });
//     }

//     // 3️⃣ Merge students + marks
//     const merged = students.map(s => ({
//       id: s._id,
//       studentId: s.studentId || '',
//       name: s.name || '',
//       mark: marksMap[s._id] ?? 0
//     }));

//     setRecords(merged);

//   } catch (err) {
//     console.error('Failed to fetch marks', err);
//     setMessage(err?.response?.data?.message || 'Fetch failed');
//     setRecords([]);
//   } finally {
//     setLoading(false);
//   }
// };


//   const showEntry = (index) => {
//     if (!markEntries || !markEntries[index]) return;
//     const doc = markEntries[index];
//     console.log(doc,"doc")
//     const normalized = (doc.records || []).map(r => ({
//       id: r.student?._id || r.student,
//       studentId: r.student?.studentId || '',
//       name: r.student?.name || '',
//       mark: r.mark ?? 0,
//     }));
//     setCurrentEntryIndex(index);
//     setRecords(normalized);
//   };
//   // showEntry(Math.max(0, 2))
//   const prevEntry = () => showEntry(Math.max(0, currentEntryIndex - 1));
//   const nextEntry = () => showEntry(Math.min(markEntries.length - 1, currentEntryIndex + 1));

//   const save = async () => {
//     if (!date || !department || !section) {
//       setMessage('Select date, department and section');
//       return;
//     }
//     const stored = JSON.parse(localStorage.getItem('user')) || null;
//     if (!stored?.token) {
//       setMessage('Not authenticated — please log in');
//       return;
//     }
//     setMessage('');
//     const payload = {
//       date,
//       department,
//       section,
//       records: records.map(r => ({ student: r.id, mark: Number(r.mark) })),
//     };
//     try {
//       const res = await apiClient().post('/marks', payload);
//       setMessage(res.data?.message || 'Saved');
//     } catch (err) {
//       console.error('Save failed', err);
//       if (err?.response?.status === 401) {
//         setMessage('Unauthorized — please log in again');
//         localStorage.removeItem('user');
//         window.location.href = '/login';
//         return;
//       }
//       setMessage(err?.response?.data?.message || 'Save failed');
//     }
//   };

//   const downloadExcel = () => {
//     if (!records || records.length === 0) {
//       setMessage('No records to download');
//       return;
//     }
//     const data = records.map((r, i) => ({
//       '#': i + 1,
//       'Student ID': r.studentId ?? '',
//       Name: r.name ?? '',
//       Mark: r.mark ?? '',
//     }));
//     const ws = XLSX.utils.json_to_sheet(data, { header: ['#', 'Student ID', 'Name', 'Mark'] });
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Marks');
//     const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([wbout], { type: 'application/octet-stream' });
//     const fname = `marks-${department || 'all'}-${section || 'all'}-${date}.xlsx`;
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.setAttribute('download', fname);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     setMessage('Download started');
//   };

//   return (
//     <div style={{ padding: 16 }}>
//       <h2>Mark Record</h2>
//       <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
//         <label style={{ display: 'flex', flexDirection: 'column' }}>
//           Department:
//           <select value={department} onChange={e => setDepartment(e.target.value)}>
//             {classesList.map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </label>
//         <label style={{ display: 'flex', flexDirection: 'column' }}>
//           Section:
//           <select value={section} onChange={e => setSection(e.target.value)}>
//             {sectionsList.map(s => <option key={s} value={s}>{s}</option>)}
//           </select>
//         </label>
//         <label style={{ display: 'flex', flexDirection: 'column' }}>
//           Date:
//           <input type="date" value={date} onChange={e => setDate(e.target.value)} />
//         </label>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <button onClick={fetchMarks} className="btn">Fetch</button>
//           <button onClick={save} className="btn" disabled={records.length === 0}>Save</button>
//           <button onClick={downloadExcel} className="btn secondary" disabled={records.length === 0}>Download</button>
//         </div>
//       </div>

//       {loading && <p>Loading...</p>}
//       {message && <p>{message}</p>}

//       <div className="table-responsive">
//         <table>
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Student ID</th>
//               <th>Name</th>
//               <th>Mark</th>
//             </tr>
//           </thead>
//           <tbody>
//             {records.map((r, i) => (
//               <tr key={r.id || i}>
//                 <td>{i + 1}</td>
//                 <td>{r.studentId}</td>
//                 <td>{r.name}</td>
//                 <td>
//                   <input value={r.mark} onChange={e => {
//                     const copy = [...records];
//                     copy[i] = { ...copy[i], mark: e.target.value };
//                     setRecords(copy);
//                   }} />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function MarkRecord() {
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [markTables, setMarkTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /* ---------------- API CLIENT ---------------- */
  const apiClient = useCallback(() => {
    const api = axios.create({
      baseURL: 'https://college-attendence.onrender.com/api'
    });
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    }
    return api;
  }, []);

  /* ---------------- LOAD DEPARTMENTS ---------------- */
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

  /* ---------------- LOAD SECTIONS ---------------- */
  useEffect(() => {
    if (!department) return;

    const fetchSections = async () => {
      try {
        const res = await apiClient().get('/admin/sections', {
          params: { department }
        });
        const list = Array.isArray(res.data) ? res.data.map(s => s.name) : [];
        setSectionsList(list);
        if (!section && list.length) setSection(list[0]);
      } catch (err) {
        console.warn('Failed to load sections', err);
      }
    };

    fetchSections();
  }, [department, apiClient, section]);

  /* ---------------- FETCH MARKS ---------------- */
  const fetchMarks = async () => {
    if (!date || !department || !section) {
      setMessage('Select date, department and section');
      return;
    }

    setLoading(true);
    setMessage('');
    setMarkTables([]);

    try {
      const api = apiClient();

      // 1️⃣ Fetch students
      const studentRes = await api.get('/students', {
        params: { department, section }
      });
      const students = Array.isArray(studentRes.data) ? studentRes.data : [];

      // 2️⃣ Fetch marks
      const marksRes = await api.get('/marks', {
        params: { date, department, section }
      });
      const markDocs = Array.isArray(marksRes.data) ? marksRes.data : [];

      // 3️⃣ Build tables
      const tables = markDocs.map(doc => {
        const marksMap = {};

        doc.records.forEach(r => {
          const id = r.student?._id || r.student;
          marksMap[id] = r.mark;
        });

        return {
          _id: doc._id,
          description: doc.description || 'No description',
          createdAt: doc.createdAt,
          records: students.map(s => ({
            id: s._id,
            studentId: s.studentId,
            name: s.name,
            mark: marksMap[s._id] ?? 0
          }))
        };
      });

      setMarkTables(tables);

    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch marks');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UPDATE MARK VALUE ---------------- */
  const updateMark = (tableIndex, recordIndex, value) => {
    const updated = [...markTables];
    updated[tableIndex].records[recordIndex].mark = value;
    setMarkTables(updated);
  };

  /* ---------------- SAVE TABLE ---------------- */
  const saveTable = async (table) => {
    try {
      await apiClient().put(`/marks/${table._id}`, {
        records: table.records.map(r => ({
          student: r.id,
          mark: Number(r.mark)
        }))
      });
      setMessage(`Saved: ${table.description}`);
    } catch (err) {
      console.error(err);
      setMessage('Save failed');
    }
  };

  /* ---------------- DOWNLOAD TABLE ---------------- */
  const downloadExcel = (table) => {
    const data = table.records.map((r, i) => ({
      '#': i + 1,
      'Student ID': r.studentId,
      Name: r.name,
      Mark: r.mark
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table.description);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${table.description}-${date}.xlsx`;
    link.click();
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 16 }}>
      <h2>Mark Record</h2>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label>
          Department
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {classesList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          Section
          <select value={section} onChange={e => setSection(e.target.value)}>
            {sectionsList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div className='mark-fetch'>
           <button  onClick={fetchMarks}>Fetch</button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}

      {/* ---------- MULTIPLE EDITABLE TABLES ---------- */}
      {markTables.map((table, tableIndex) => (
        <div key={table._id} style={{ marginBottom: 40 }}>

          <h3>
            {table.description}
            <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
              ({new Date(table.createdAt).toLocaleString()})
            </span>
          </h3>

          <div style={{ marginBottom: 8 }}>
            <button onClick={() => saveTable(table)}>Save</button>{' '}
            <button onClick={() => downloadExcel(table)}>Download</button>
          </div>

          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Mark</th>
              </tr>
            </thead>
            <tbody>
              {table.records.map((r, recordIndex) => (
                <tr key={r.id}>
                  <td>{recordIndex + 1}</td>
                  <td>{r.studentId}</td>
                  <td>{r.name}</td>
                  <td>
                    <input
                      type="number"
                      value={r.mark}
                      onChange={e =>
                        updateMark(tableIndex, recordIndex, e.target.value)
                      }
                    />
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

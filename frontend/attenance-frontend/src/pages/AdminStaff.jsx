import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminStaff(){
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newStaff, setNewStaff] = useState({ staffId: '', name: '', email: '', department: '', password: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ staffId: '', name: '', email: '', department: '', password: '' });

  const apiClient = () => {
    const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    return api;
  };

  const fetchStaff = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (q) params.q = q;
      const res = await apiClient().get('/staff', { params });
      setStaff(res.data?.data || []);
      setPage(res.data?.page || 1);
      setPages(res.data?.pages || 1);
    } catch (err) {
      console.error('Fetch staff error', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // not authorized — redirect to admin login
        window.location.href = '/admin/login';
        return;
      }
      setError(err?.response?.data?.message || err.message || 'Could not load staff');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiClient().post('/staff', newStaff);
      setNewStaff({ staffId: '', name: '', email: '', department: '', password: '' });
      fetchStaff();
    } catch (err) {
      console.error('Create staff error', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        window.location.href = '/admin/login';
        return;
      }
      setError(err?.response?.data?.message || err.message || 'Create failed');
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditingData({ staffId: u.staffId || '', name: u.name || '', email: u.email || '', department: u.department || '', password: '' });
  };

  const cancelEdit = () => { setEditingId(null); setEditingData({ staffId: '', name: '', email: '', department: '', password: '' }); };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient().put(`/staff/${editingId}`, editingData);
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      console.error('Update staff error', err);
      setError(err?.response?.data?.message || err.message || 'Update failed');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Staff Management</h2>

      <section style={{ marginBottom: 20 }}>
        <h3>Add Staff</h3>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Staff ID" value={newStaff.staffId || ''} onChange={e => setNewStaff({ ...newStaff, staffId: e.target.value })} />
          <input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required />
          <input placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required />
          <input placeholder="Department" value={newStaff.department || ''} onChange={e => setNewStaff({ ...newStaff, department: e.target.value })} />
          <input placeholder="Password" type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} required />
          <button type="submit">Create</button>
        </form>
      </section>

      <section>
        <h3>Existing Staff</h3>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Search by name, email, staffId or department" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <button onClick={() => { fetchStaff(1, search); }}>Search</button>
        </div>
        {loading ? <div>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>#</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Staff ID</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Department</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u, i) => (
                <tr key={u._id}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{i+1}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{u.staffId || ''}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {editingId === u._id ? (
                      <input value={editingData.name} onChange={e => setEditingData({ ...editingData, name: e.target.value })} />
                    ) : u.name}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {editingId === u._id ? (
                      <input value={editingData.email} onChange={e => setEditingData({ ...editingData, email: e.target.value })} />
                    ) : u.email}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {editingId === u._id ? (
                      <input value={editingData.department} onChange={e => setEditingData({ ...editingData, department: e.target.value })} />
                    ) : u.department || ''}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    {editingId === u._id ? (
                      <>
                        <input placeholder="New password" type="password" value={editingData.password} onChange={e => setEditingData({ ...editingData, password: e.target.value })} style={{ marginRight: 8 }} />
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={cancelEdit} style={{ marginLeft: 8 }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)}>Edit</button>
                        <button style={{ marginLeft: 8 }} onClick={async () => {
                          if (!window.confirm(`Delete staff ${u.name || u.email}? This action cannot be undone.`)) return;
                          try {
                            await apiClient().delete(`/staff/${u._id}`);
                            fetchStaff(page, search);
                          } catch (err) {
                            console.error('Delete staff error', err);
                            const status = err?.response?.status;
                            if (status === 401 || status === 403) { window.location.href = '/admin/login'; return; }
                            setError(err?.response?.data?.message || 'Delete failed');
                          }
                        }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (page > 1) { fetchStaff(page-1, search); } }} disabled={page<=1}>Prev</button>
          <span>Page {page} / {pages}</span>
          <button onClick={() => { if (page < pages) { fetchStaff(page+1, search); } }} disabled={page>=pages}>Next</button>
        </div>
      </section>
    </div>
  );
}

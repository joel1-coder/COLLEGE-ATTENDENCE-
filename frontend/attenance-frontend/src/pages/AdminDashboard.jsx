import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';
import ChartMarks from '../components/ChartMarks';
import ChartAttendance from '../components/ChartAttendance';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ staffCount: 0, studentCount: 0, sessionsToday: 0, presentsToday: 0, date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const api = axios.create({ baseURL: 'http://localhost:5000/api' });
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
        const res = await api.get('/admin/stats');
        setStats(res.data || {});
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span className="admin-user">{user?.email || 'Admin'}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="cards">
          <div className="card">
            <h3>Today's Attendance</h3>
            <p>{stats.presentsToday} presents / {stats.sessionsToday} records ({stats.date})</p>
            <div style={{ marginTop: 8 }}>
              <a href="/admin/attendance">Open Attendance</a>
              <span style={{ marginLeft: 8 }}>•</span>
              <a style={{ marginLeft: 8 }} href="/admin/report/monthly">Reports</a>
            </div>
          </div>
          <div className="card">
            <h3>Manage Staff</h3>
            <p>{stats.staffCount} staff accounts</p>
            <div style={{ marginTop: 8 }}><a href="/admin/staff">Open Staff</a></div>
          </div>
          <div className="card">
            <h3>Students</h3>
            <p>{stats.studentCount} students</p>
            <div style={{ marginTop: 8 }}><a href="/admin/students">Manage Students</a></div>
          </div>
        </section>
        <section style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h4>Top Marks</h4>
            <div>
              <ChartMarks limit={8} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4>Attendance %</h4>
            <div>
              <ChartAttendance limit={8} />
            </div>
          </div>
        </section>
        {loading && <div>Loading stats...</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;

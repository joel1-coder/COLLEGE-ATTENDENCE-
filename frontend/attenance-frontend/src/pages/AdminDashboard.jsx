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
        const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
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
        <section className="cards flashcards">
          <div className="flashcard attendance-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Today's Attendance</div>
              <div className="flashcard-stat">{(stats && (stats.presentsToday ?? stats.presents)) ?? 0}</div>
              <div className="flashcard-sub">of {(stats && (stats.sessionsToday ?? stats.sessions)) ?? 0} records</div>
            </div>
            <div className="flashcard-footer">
              <a href="/admin/attendance">Open Attendance</a>
              <a href="/admin/report/monthly">Reports</a>
            </div>
          </div>

          <div className="flashcard staff-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Manage Staff</div>
              <div className="flashcard-stat">{stats.staffCount}</div>
              <div className="flashcard-sub">staff accounts</div>
            </div>
            <div className="flashcard-footer"><a href="/admin/staff">Open Staff</a></div>
          </div>

          <div className="flashcard students-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Students</div>
              <div className="flashcard-stat">{stats.studentCount}</div>
              <div className="flashcard-sub">registered students</div>
            </div>
            <div className="flashcard-footer"><a href="/admin/students">Manage Students</a></div>
          </div>
        </section>
        {/* <section style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h4>Top Marks</h4>
            <div>
              <ChartMarks limit={5} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4>Attendance %</h4>
            <div>
              <ChartAttendance limit={5} />
            </div>
          </div>
        </section> */}
        {/* {loading && <div>Loading stats...</div>} */}
      </main>
    </div>
  );
};

export default AdminDashboard;

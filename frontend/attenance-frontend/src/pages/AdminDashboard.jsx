import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';
// ChartMarks and ChartAttendance are imported but currently commented-out below.
// They can be re-enabled later when chart data is stable.
// import ChartMarks from '../components/ChartMarks';
// import ChartAttendance from '../components/ChartAttendance';

// ✅ FIX #4 — Removed the duplicate Logout button from this component.
// Before: This page had its own <header> with a Logout button AND the NavBar also
//         had a Logout button → admin saw two logout buttons.
// After:  The <header> block with the extra logout is removed entirely.
//         The NavBar's logout button is the single source of truth.
//
// Also the old logout here called logout() without redirecting,
// leaving the user stuck on /admin until AdminProtected kicked them to /admin/login.
// Now the NavBar handles all of that correctly.

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    staffCount: 0,
    studentCount: 0,
    sessionsToday: 0,
    presentsToday: 0,
    date: ''
  });
  const [loading, setLoading] = useState(false);

  // 💡 Beginner tip: useEffect with [] as the second argument runs only ONCE
  // when the component first appears on screen. It's like "on page load".
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
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-page">
      {/* ✅ Header now only shows the title and email — no duplicate logout */}
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span className="admin-user">{user?.email || 'Admin'}</span>
          {/* Logout button REMOVED — NavBar handles it */}
        </div>
      </header>

      <main className="admin-main">
        <section className="cards flashcards">

          {/* Today's Attendance Card */}
          <div className="flashcard Attendance-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Today's Attendance</div>
              <div className="flashcard-stat">
                {(stats && (stats.presentsToday ?? stats.presents)) ?? 0}
              </div>
              <div className="flashcard-sub">
                of {(stats && (stats.sessionsToday ?? stats.sessions)) ?? 0} records
              </div>
            </div>
            <div className="flashcard-footer">
              <a href="/admin/Attendance">Open Attendance</a>
              <a href="/admin/report/monthly">Reports</a>
            </div>
          </div>

          {/* Staff Card */}
          <div className="flashcard staff-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Manage Staff</div>
              <div className="flashcard-stat">{stats.staffCount}</div>
              <div className="flashcard-sub">staff accounts</div>
            </div>
            <div className="flashcard-footer">
              <a href="/admin/staff">Open Staff</a>
            </div>
          </div>

          {/* Students Card */}
          <div className="flashcard students-card">
            <div className="flashcard-body">
              <div className="flashcard-title">Students</div>
              <div className="flashcard-stat">{stats.studentCount}</div>
              <div className="flashcard-sub">registered students</div>
            </div>
            <div className="flashcard-footer">
              <a href="/admin/student">Manage Students</a>
            </div>
          </div>

        </section>

        {/* Charts — currently disabled, uncomment to re-enable */}
        {/*
        <section style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h4>Top Marks</h4>
            <ChartMarks limit={5} />
          </div>
          <div style={{ flex: 1 }}>
            <h4>Attendance %</h4>
            <ChartAttendance limit={5} />
          </div>
        </section>
        */}

      </main>
    </div>
  );
};

export default AdminDashboard;
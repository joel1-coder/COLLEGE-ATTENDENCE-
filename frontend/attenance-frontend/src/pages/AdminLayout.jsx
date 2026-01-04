import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminLayout() {
  return (
    <div className="admin-wrapper">
      <nav className="admin-nav">
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/staff">Staff</Link>
        <Link to="/admin/student">Student</Link>
        <Link to="/admin/report">Report</Link>
        <Link to="/admin/assign">Assign</Link>
      </nav>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminLayout() {
  return (
    <div className="admin-wrapper">
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

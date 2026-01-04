import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";
import { AuthContext } from "../context/AuthContext";

function NavBar() {
  const { user, logout } = useContext(AuthContext);

  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">Attendance</Link>
        <div className="nav-links">
          {isLoginPage ? (
            <>
              <Link to="/admin">Admin</Link>
              <Link to="/login">Login</Link>
            </>
          ) : isAdmin ? (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              <Link to="/admin/assign">Assign</Link>
              <button onClick={handleLogout} type="button" style={{ cursor: "pointer", color: "#fff", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              {user && <Link to="/creation">Session Setup</Link>}
              <Link to="/previous-attendance">Attendance Records</Link>
              {user && <Link to="/editing-adding">Manage Entries</Link>}
              {user && <Link to="/enter-marks">Marks Portal</Link>}
              <Link to="/admin">Admin Panel</Link>
              {user ? (
                <button onClick={handleLogout} type="button" style={{ cursor: "pointer", color: "#fff", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}>Logout</button>
              ) : (
                <Link to="/login">Login</Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;

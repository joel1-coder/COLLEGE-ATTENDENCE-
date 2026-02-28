import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";
import { AuthContext } from "../context/AuthContext";

function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };
  useEffect(() => {
    // close mobile menu on route change
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutside(e) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);
  const logoLink = isAdmin ? '/admin' : '/';
  const logoText = isAdmin && 'Attendance';

  return (
    <nav className={`navbar ${isAdmin ? 'admin' : 'user'}`}>
      <div className="nav-container">
        <Link to={logoLink} className="nav-logo">{logoText}</Link>
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
              {/* <Link to="/admin/create-admin">Create Admin</Link> */}
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              {/* <Link to="/admin/assign">Assign</Link> */}
              <button onClick={handleLogout} type="button" style={{ cursor: "pointer", color: "#000", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              {user && <Link to="/creation">Session Setup</Link>}
              <Link to="/previous-attendance">Attendance Records</Link>
              {user && <Link to="/editing-adding">Manage Entries</Link>}
              {user && <Link to="/enter-marks">Marks Portal</Link>}
              {user && <Link to="/mark-record">Mark Record</Link>}
              <Link to="/admin">Admin Panel</Link>
                {user ? (
                <button onClick={handleLogout} type="button" style={{ cursor: "pointer", color: "#000", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}>Logout</button>
              ) : (
                <Link to="/login">Login</Link>
              )}
            </>
          )}
        </div>
        <button ref={buttonRef} className={`hamburger ${menuOpen ? 'open' : ''}`} aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        <div ref={menuRef} className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
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
                <button onClick={handleLogout} type="button" className="mobile-logout">Logout</button>
              </>
            ) : (
              <>
                <Link to="/">Home</Link>
                {user && <Link to="/creation">Session Setup</Link>}
                <Link to="/previous-attendance">Attendance Records</Link>
                {user && <Link to="/editing-adding">Manage Entries</Link>}
                {user && <Link to="/enter-marks">Marks Portal</Link>}
                {user && <Link to="/mark-record">Mark Record</Link>}
                <Link to="/admin/login">Admin Panel</Link>
                {user ? (
                  <button onClick={handleLogout} type="button" className="mobile-logout">Logout</button>
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

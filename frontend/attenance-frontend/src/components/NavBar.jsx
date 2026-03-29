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
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutside(e) {
      if (!menuOpen) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const logoLink = isAdmin ? '/admin' : '/';
  const logoText = 'Attendance';

  return (
    <nav className={`navbar ${isAdmin ? 'admin' : 'user'}`}>
      <div className="nav-container">
        <Link to={logoLink} className="nav-logo">{logoText}</Link>

        {/* ── DESKTOP LINKS ── */}
        <div className="nav-links">
          {isLoginPage ? (
            // On the login page itself — show Admin + Login options
            <>
              <Link to="/admin/login">Admin</Link>
              <Link to="/login">Login</Link>
            </>
          ) : isAdmin ? (
            // Logged in as admin
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              <button
                onClick={handleLogout}
                type="button"
                style={{
                  cursor: "pointer",
                  color: "#000",
                  marginLeft: 12,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                Logout
              </button>
            </>
          ) : user ? (
            // Logged in as staff
            <>
              <Link to="/">Home</Link>
              <Link to="/creation">Session Setup</Link>
              <Link to="/previous-Attendance">Attendance Records</Link>
              <Link to="/editing-adding">Manage Entries</Link>
              <Link to="/enter-marks">Marks Portal</Link>
              <Link to="/mark-record">Mark Record</Link>
              <button
                onClick={handleLogout}
                type="button"
                style={{
                  cursor: "pointer",
                  color: "#000",
                  marginLeft: 12,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            // Guest — not logged in at all
            <>
              <Link to="/previous-Attendance">Attendance Records</Link>
              <Link to="/login">Login</Link>
              <Link to="/admin/login">Admin</Link>
            </>
          )}
        </div>

        {/* ── HAMBURGER BUTTON (mobile) ── */}
        <button
          ref={buttonRef}
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(v => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        {/* ── MOBILE MENU ── */}
        <div ref={menuRef} className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          {isLoginPage ? (
            // On the login page itself
            <>
              <Link to="/admin/login">Admin</Link>
              <Link to="/login">Login</Link>
            </>
          ) : isAdmin ? (
            // Logged in as admin
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              <Link to="/admin/assign">Assign</Link>
              <button onClick={handleLogout} type="button" className="mobile-logout">
                Logout
              </button>
            </>
          ) : user ? (
            // Logged in as staff
            <>
              <Link to="/">Home</Link>
              <Link to="/creation">Session Setup</Link>
              <Link to="/previous-Attendance">Attendance Records</Link>
              <Link to="/editing-adding">Manage Entries</Link>
              <Link to="/enter-marks">Marks Portal</Link>
              <Link to="/mark-record">Mark Record</Link>
              <button onClick={handleLogout} type="button" className="mobile-logout">
                Logout
              </button>
            </>
          ) : (
            // Guest — not logged in
            <>
              <Link to="/previous-Attendance">Attendance Records</Link>
              <Link to="/login">Login</Link>
              <Link to="/admin/login">Admin</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default NavBar;
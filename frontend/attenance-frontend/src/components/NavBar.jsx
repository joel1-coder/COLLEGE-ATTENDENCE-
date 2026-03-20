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

  // ✅ FIX #7 — Also hide navbar on forgot-password and reset-password pages.
  // Previously only /login and /admin/login were covered.
  // These pages are visited by unauthenticated users so they should not see nav links.
  const isLoginPage = ['/login', '/admin/login', '/forgot-password', '/reset-password']
    .some(p => location.pathname.startsWith(p));

  const isAdmin = user?.role === 'admin';

  // ✅ FIX #10 — Logout redirects based on role.
  // Before: always went to /login even for admins.
  // After: admins go to /admin/login, staff go to /login.
  const handleLogout = () => {
    const wasAdmin = user?.role === 'admin';
    logout();
    window.location.href = wasAdmin ? '/admin/login' : '/login';
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutside(e) {
      if (!menuOpen) return;
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  // ✅ FIX #1 (from earlier audit) — Hide the entire navbar on login pages.
  // Previously the navbar was visible on /login and /admin/login.
  if (isLoginPage) return null;

  // ✅ FIX #5 — Remove "Attendance" logo text for admin.
  // Before: logoText was 'Attendance' for admin. Now it's empty so nothing shows.
  const logoLink = isAdmin ? '/admin' : '/';
  const logoText = ''; // Removed the logo text for all users (cleaner look)

  return (
    <nav className={`navbar ${isAdmin ? 'admin' : 'user'}`}>
      <div className="nav-container">
        <Link to={logoLink} className="nav-logo">{logoText}</Link>

        {/* ── DESKTOP NAV LINKS ── */}
        <div className="nav-links">
          {isAdmin ? (
            // ✅ Admin nav — clean set of links, no duplicate logout
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              {/* ✅ FIX #9 — Added Assign to desktop nav (was only in mobile before) */}
              <Link to="/admin/assign">Assign</Link>
              <button
                onClick={handleLogout}
                type="button"
                style={{ cursor: "pointer", color: "#000", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}
              >
                Logout
              </button>
            </>
          ) : (
            // ✅ Staff/user nav — "Admin Panel" link removed (Fix #4)
            <>
              <Link to="/">Home</Link>
              {user && <Link to="/creation">Session Setup</Link>}
              <Link to="/previous-Attendance">Attendance Records</Link>
              {user && <Link to="/editing-adding">Manage Entries</Link>}
              {user && <Link to="/enter-marks">Marks Portal</Link>}
              {user && <Link to="/mark-record">Mark Record</Link>}
              {/* ✅ FIX #4 — Removed <Link to="/admin">Admin Panel</Link> from staff nav */}
              {user ? (
                <button
                  onClick={handleLogout}
                  type="button"
                  style={{ cursor: "pointer", color: "#000", marginLeft: 12, background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}
                >
                  Logout
                </button>
              ) : (
                <Link to="/login">Login</Link>
              )}
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
          {isAdmin ? (
            // ✅ Admin mobile nav — matches desktop now (Assign included)
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/student">Student</Link>
              <Link to="/admin/report">Report</Link>
              <Link to="/admin/assign">Assign</Link>
              <button onClick={handleLogout} type="button" className="mobile-logout">Logout</button>
            </>
          ) : (
            // ✅ Staff mobile nav — "Admin Panel" link also removed here
            <>
              <Link to="/">Home</Link>
              {user && <Link to="/creation">Session Setup</Link>}
              <Link to="/previous-Attendance">Attendance Records</Link>
              {user && <Link to="/editing-adding">Manage Entries</Link>}
              {user && <Link to="/enter-marks">Marks Portal</Link>}
              {user && <Link to="/mark-record">Mark Record</Link>}
              {/* ✅ FIX #4 — Removed Admin Panel link from mobile staff nav too */}
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
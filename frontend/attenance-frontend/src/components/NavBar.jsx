import React, { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./NavBar.css";
import { AuthContext } from "../context/AuthContext";

function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  const isLoginPage = location.pathname === "/login" || location.pathname === "/admin/login";
  const isAdmin = user?.role === "admin";
  const logoLink = isAdmin ? "/admin" : "/";
  const navClass = ({ isActive }) => (isActive ? "active" : undefined);

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

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const loginLinks = (
    <>
      <NavLink to="/admin/login" className={navClass}>Admin</NavLink>
      <NavLink to="/login" className={navClass}>Login</NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
      <NavLink to="/admin/staff" className={navClass}>Staff</NavLink>
      <NavLink to="/admin/student" className={navClass}>Student</NavLink>
      <NavLink to="/admin/report" className={navClass}>Report</NavLink>
      <NavLink to="/admin/assign" className={navClass}>Assign</NavLink>
    </>
  );

  const staffLinks = (
    <>
      <NavLink to="/" end className={navClass}>Home</NavLink>
      <NavLink to="/creation" className={navClass}>Session Setup</NavLink>
      <NavLink to="/previous-Attendance" className={navClass}>Attendance Records</NavLink>
      <NavLink to="/editing-adding" className={navClass}>Manage Entries</NavLink>
      <NavLink to="/enter-marks" className={navClass}>Marks Portal</NavLink>
      <NavLink to="/mark-record" className={navClass}>Mark Record</NavLink>
    </>
  );

  const guestLinks = (
    <>
      <NavLink to="/previous-Attendance" className={navClass}>Attendance Records</NavLink>
      <NavLink to="/login" className={navClass}>Login</NavLink>
      <NavLink to="/admin/login" className={navClass}>Admin</NavLink>
    </>
  );

  const links = isLoginPage ? loginLinks : isAdmin ? adminLinks : user ? staffLinks : guestLinks;

  return (
    <nav className={`navbar ${isAdmin ? "admin" : "user"}`}>
      <div className="nav-container">
        <NavLink to={logoLink} className="nav-logo">
          <img src="/favicon.jpg" alt="cs lab crest" className="nav-logo-img" />
          <span>CS LAB Attendance</span>
        </NavLink>

        <div className="nav-links">
          {links}
          {(isAdmin || user) && (
            <button onClick={handleLogout} type="button">
              Logout
            </button>
          )}
        </div>

        <button
          ref={buttonRef}
          className={`hamburger ${menuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <div ref={menuRef} className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          {links}
          {(isAdmin || user) && (
            <button onClick={handleLogout} type="button" className="mobile-logout">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;

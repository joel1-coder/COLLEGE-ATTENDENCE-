/**
 * Onboarding.jsx — 3-step SaaS-style first-time setup wizard
 *
 * Step 1: Branding (college name + logo)
 * Step 2: Theme (primary/secondary colors)
 * Step 3: User accounts (admin + staff)
 * Final:  "Setting up workspace…" transition → redirect to /login
 */
import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { baseURL } from "../api/api";
import { useBranding } from "../context/BrandingContext";
import { AuthContext } from "../context/AuthContext";
import "./Onboarding.css";

/* ── PRESET PALETTES ── */
const PALETTES = [
  { name: "Navy",    primary: "#1E3A8A", secondary: "#F59E0B" },
  { name: "Forest",  primary: "#065F46", secondary: "#FBBF24" },
  { name: "Rose",    primary: "#9D174D", secondary: "#F97316" },
  { name: "Slate",   primary: "#334155", secondary: "#38BDF8" },
  { name: "Violet",  primary: "#4C1D95", secondary: "#34D399" },
];

const STEPS = [
  { label: "Step 1", title: "Branding" },
  { label: "Step 2", title: "Theme" },
  { label: "Step 3", title: "User Setup" },
];

/* ── VALIDATION HELPERS ── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { setBranding } = useBranding();
  const { markConfigured } = useContext(AuthContext);

  /* ── STEP STATE ── */
  const [step, setStep] = useState(1); // 1, 2, 3, or "done"

  /* ── STEP 1: BRANDING ── */
  const [collegeName, setCollegeName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [step1Errors, setStep1Errors] = useState({});
  const logoInputRef = useRef(null);

  /* ── STEP 2: THEME ── */
  const [primaryColor, setPrimaryColor] = useState("#1E3A8A");
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const [selectedPalette, setSelectedPalette] = useState("Navy");
  const [step2Errors, setStep2Errors] = useState({});

  /* ── STEP 3: USERS ── */
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [step3Errors, setStep3Errors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ══════════════════════════════════════════════════
     STEP 1 HANDLERS
  ══════════════════════════════════════════════════ */
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    const errs = {};
    if (!collegeName.trim()) errs.collegeName = "College name is required.";
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep1 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  /* ══════════════════════════════════════════════════
     STEP 2 HANDLERS
  ══════════════════════════════════════════════════ */
  const applyPalette = (palette) => {
    setSelectedPalette(palette.name);
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setStep2Errors({});
  };

  const validateStep2 = () => {
    const errs = {};
    if (!isValidHex(primaryColor)) errs.primaryColor = "Enter a valid hex color (e.g. #1E3A8A)";
    if (!isValidHex(secondaryColor)) errs.secondaryColor = "Enter a valid hex color (e.g. #F59E0B)";
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep2 = () => {
    if (!validateStep2()) return;
    setStep(3);
  };

  /* ══════════════════════════════════════════════════
     STEP 3 HANDLERS — Final submit
  ══════════════════════════════════════════════════ */
  const validateStep3 = () => {
    const errs = {};
    if (!isValidEmail(adminEmail)) errs.adminEmail = "Enter a valid email address.";
    if (adminPassword.length < 6) errs.adminPassword = "Password must be at least 6 characters.";
    if (!isValidEmail(staffEmail)) errs.staffEmail = "Enter a valid email address.";
    if (staffPassword.length < 6) errs.staffPassword = "Password must be at least 6 characters.";
    if (adminEmail && staffEmail && adminEmail === staffEmail) {
      errs.staffEmail = "Admin and Staff must have different emails.";
    }
    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompleteSetup = async () => {
    if (!validateStep3()) return;
    setGlobalError("");
    setSubmitting(true);

    try {
      // 1. Create users via backend
      await axios.post(`${baseURL}/auth/setup`, {
        admin: { email: adminEmail, password: adminPassword },
        staff: { email: staffEmail, password: staffPassword },
      });

      // 2. Save branding to localStorage via context
      setBranding({ collegeName, logoDataUrl, primaryColor, secondaryColor });

      // 3. Show completion screen
      setStep("done");
      markConfigured();

      // 4. After 2.5 s, redirect to login
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err) {
      setGlobalError(
        err?.response?.data?.message || "Setup failed. Please try again."
      );
      setSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════════════
     COMPLETION SCREEN
  ══════════════════════════════════════════════════ */
  if (step === "done") {
    return (
      <div className="ob-complete-screen">
        <div className="ob-spinner" />
        <h1 className="ob-complete-title">Setting up your workspace…</h1>
        <p className="ob-complete-sub">This will only take a moment.</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     MAIN WIZARD RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div className="onboarding-root">
      {/* ── SIDEBAR ── */}
      <aside className="onboarding-sidebar">
        <div className="ob-brand">
          <div className="ob-brand-icon">🎓</div>
          <span className="ob-brand-name">LAB Attendance</span>
        </div>

        <ul className="ob-steps-list">
          {STEPS.map((s, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isActive = step === num;
            return (
              <li
                key={s.title}
                className={`ob-step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              >
                <div className="ob-step-num">
                  {isDone ? "✓" : num}
                </div>
                <div className="ob-step-info">
                  <div className="ob-step-label">{s.label}</div>
                  <div className="ob-step-title">{s.title}</div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="ob-sidebar-footer">
          First-time setup · All data stays on your server.
        </p>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="onboarding-main">
        {/* ───────── STEP 1: BRANDING ───────── */}
        {step === 1 && (
          <div className="ob-card" key="step1">
            <div className="ob-card-header">
              <div className="ob-step-badge">⚙️ Step 1 of 3</div>
              <h1 className="ob-card-title">Set your institution's branding</h1>
              <p className="ob-card-subtitle">
                This name and logo will appear across the system — in the navbar, login page, and reports.
              </p>
              <p className="ob-login-link" style={{ marginTop: '12px', fontSize: '0.88rem', color: '#64748B' }}>
                Already have an account? <span onClick={() => navigate("/login")} style={{ color: '#1E3A8A', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Click here to log in</span>
              </p>
            </div>

            {/* College Name */}
            <div className="ob-field">
              <label className="ob-label">College / Institution Name *</label>
              <input
                className={`ob-input ${step1Errors.collegeName ? "error" : ""}`}
                type="text"
                placeholder="e.g. Sri Ramakrishna College of Arts & Science"
                value={collegeName}
                onChange={(e) => {
                  setCollegeName(e.target.value);
                  if (step1Errors.collegeName) setStep1Errors({});
                }}
              />
              {step1Errors.collegeName && (
                <span className="ob-error-text">{step1Errors.collegeName}</span>
              )}
            </div>

            {/* Logo Upload */}
            <div className="ob-field">
              <label className="ob-label">College Logo (optional)</label>
              <div
                className="ob-logo-upload"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoDataUrl ? (
                  <img src={logoDataUrl} alt="preview" className="ob-logo-preview" />
                ) : (
                  <div className="ob-logo-placeholder">🏛️</div>
                )}
                <div className="ob-logo-text">
                  <strong>{logoDataUrl ? "Logo selected ✓" : "Click to upload logo"}</strong>
                  <span>PNG, JPG or SVG · max 2 MB</span>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="ob-file-input"
                onChange={handleLogoSelect}
              />
            </div>

            <div className="ob-actions">
              <button className="ob-btn-next" onClick={handleNextStep1}>
                Next <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ───────── STEP 2: THEME ───────── */}
        {step === 2 && (
          <div className="ob-card" key="step2">
            <div className="ob-card-header">
              <div className="ob-step-badge">🎨 Step 2 of 3</div>
              <h1 className="ob-card-title">Choose your colour theme</h1>
              <p className="ob-card-subtitle">
                Pick a preset palette or set custom colours. The preview updates live.
              </p>
            </div>

            {/* Preset Palettes */}
            <div className="ob-field">
              <label className="ob-label">Presets</label>
              <div className="ob-palettes">
                {PALETTES.map((p) => (
                  <button
                    key={p.name}
                    className={`ob-palette-btn ${selectedPalette === p.name ? "selected" : ""}`}
                    onClick={() => applyPalette(p)}
                  >
                    <span className="ob-palette-swatch" style={{ background: p.primary }} />
                    <span className="ob-palette-swatch" style={{ background: p.secondary }} />
                    <span className="ob-palette-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom pickers */}
            <div className="ob-color-pickers">
              <div className="ob-color-field">
                <label className="ob-label">Primary Color</label>
                <div className="ob-color-row">
                  <input
                    type="color"
                    className="ob-color-swatch-input"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedPalette(null);
                    }}
                  />
                  <input
                    type="text"
                    className="ob-color-hex"
                    value={primaryColor}
                    maxLength={7}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedPalette(null);
                      if (step2Errors.primaryColor) setStep2Errors((p) => ({ ...p, primaryColor: "" }));
                    }}
                  />
                </div>
                {step2Errors.primaryColor && (
                  <span className="ob-error-text">{step2Errors.primaryColor}</span>
                )}
              </div>

              <div className="ob-color-field">
                <label className="ob-label">Secondary / Accent Color</label>
                <div className="ob-color-row">
                  <input
                    type="color"
                    className="ob-color-swatch-input"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedPalette(null);
                    }}
                  />
                  <input
                    type="text"
                    className="ob-color-hex"
                    value={secondaryColor}
                    maxLength={7}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedPalette(null);
                      if (step2Errors.secondaryColor) setStep2Errors((p) => ({ ...p, secondaryColor: "" }));
                    }}
                  />
                </div>
                {step2Errors.secondaryColor && (
                  <span className="ob-error-text">{step2Errors.secondaryColor}</span>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="ob-preview-panel">
              <div className="ob-preview-label">Live Preview</div>
              <div
                className="ob-preview-navbar"
                style={{ background: primaryColor }}
              >
                <div className="ob-preview-dot" />
                <span>{collegeName || "Your College Name"}</span>
              </div>
              <div className="ob-preview-buttons">
                <button
                  className="ob-preview-btn-primary"
                  style={{ background: primaryColor }}
                >
                  Primary Action
                </button>
                <button
                  className="ob-preview-btn-secondary"
                  style={{ background: secondaryColor }}
                >
                  Secondary
                </button>
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-back" onClick={() => setStep(1)}>← Back</button>
              <button className="ob-btn-next" onClick={handleNextStep2}>
                Next <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ───────── STEP 3: USERS ───────── */}
        {step === 3 && (
          <div className="ob-card" key="step3">
            <div className="ob-card-header">
              <div className="ob-step-badge">👤 Step 3 of 3</div>
              <h1 className="ob-card-title">Create your initial accounts</h1>
              <p className="ob-card-subtitle">
                Set up the Admin and Staff accounts. You can add more staff from the Admin dashboard later.
              </p>
            </div>

            {globalError && (
              <div className="ob-global-error">⚠️ {globalError}</div>
            )}

            {/* Admin Account */}
            <div className="ob-user-section">
              <p className="ob-user-section-title">
                🛡️ Admin Account{" "}
                <span className="ob-user-role-badge admin">Full Access</span>
              </p>
              <div className="ob-field">
                <label className="ob-label">Email Address *</label>
                <input
                  className={`ob-input ${step3Errors.adminEmail ? "error" : ""}`}
                  type="email"
                  placeholder="admin@college.edu"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (step3Errors.adminEmail) setStep3Errors((p) => ({ ...p, adminEmail: "" }));
                  }}
                />
                {step3Errors.adminEmail && (
                  <span className="ob-error-text">{step3Errors.adminEmail}</span>
                )}
              </div>
              <div className="ob-field" style={{ marginBottom: 0 }}>
                <label className="ob-label">Password * (min 6 characters)</label>
                <input
                  className={`ob-input ${step3Errors.adminPassword ? "error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (step3Errors.adminPassword) setStep3Errors((p) => ({ ...p, adminPassword: "" }));
                  }}
                />
                {step3Errors.adminPassword && (
                  <span className="ob-error-text">{step3Errors.adminPassword}</span>
                )}
              </div>
            </div>

            {/* Staff Account */}
            <div className="ob-user-section">
              <p className="ob-user-section-title">
                📋 Staff Account{" "}
                <span className="ob-user-role-badge staff">Limited Access</span>
              </p>
              <div className="ob-field">
                <label className="ob-label">Email Address *</label>
                <input
                  className={`ob-input ${step3Errors.staffEmail ? "error" : ""}`}
                  type="email"
                  placeholder="staff@college.edu"
                  value={staffEmail}
                  onChange={(e) => {
                    setStaffEmail(e.target.value);
                    if (step3Errors.staffEmail) setStep3Errors((p) => ({ ...p, staffEmail: "" }));
                  }}
                />
                {step3Errors.staffEmail && (
                  <span className="ob-error-text">{step3Errors.staffEmail}</span>
                )}
              </div>
              <div className="ob-field" style={{ marginBottom: 0 }}>
                <label className="ob-label">Password * (min 6 characters)</label>
                <input
                  className={`ob-input ${step3Errors.staffPassword ? "error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={staffPassword}
                  onChange={(e) => {
                    setStaffPassword(e.target.value);
                    if (step3Errors.staffPassword) setStep3Errors((p) => ({ ...p, staffPassword: "" }));
                  }}
                />
                {step3Errors.staffPassword && (
                  <span className="ob-error-text">{step3Errors.staffPassword}</span>
                )}
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-back" onClick={() => setStep(2)}>← Back</button>
              <button
                className="ob-btn-next"
                onClick={handleCompleteSetup}
                disabled={submitting}
              >
                {submitting ? "Creating accounts…" : "✅ Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

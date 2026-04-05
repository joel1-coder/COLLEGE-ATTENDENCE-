import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./Creation.css";

// ===========================================================
// 💡 BEGINNER EXPLANATION:
// This is the "Session Setup" page. It lets staff:
// 1. Add a Department (like "BSc CS")
// 2. Add a Section (like "A", "B") inside a department
// 3. Add students one-by-one OR import many at once from Excel/CSV
// ===========================================================

function Creation() {
  /* ---------------- STATES ----------------
   * Think of states like variables that React "watches".
   * When a state changes, the screen automatically updates.
   */
  const [newDepartment, setNewDepartment] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [sectionName, setSectionName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" }); // type = "success" | "error"

  const [student, setStudent] = useState({
    studentId: "",
    name: "",
    email: "",
    department: "",
    section: "",
  });

  // Import-related states
  const [importFile, setImportFile] = useState(null);        // The file user selected
  const [importPreview, setImportPreview] = useState([]);    // Rows parsed from the file
  const [importDept, setImportDept] = useState("");          // Department for bulk import
  const [importSection, setImportSection] = useState("");    // Section for bulk import
  const [importing, setImporting] = useState(false);         // Is import in progress?
  const [importResult, setImportResult] = useState(null);    // Result after import
  const fileInputRef = useRef(null);                         // Reference to the file <input>

  /* ---------------- API CLIENT ----------------
   * useCallback stops this function from being recreated every render.
   * It creates a pre-configured HTTP client with your backend URL + auth token.
   */
  const apiClient = useCallback(() => {
    const api = axios.create({
      baseURL: "https://college-attendence.onrender.com/api",
    });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return api;
  }, []);

  /* ---------------- HELPER: Show message ----------------
   * A small helper so we don't repeat the same code everywhere.
   * type = "success" gives green, "error" gives red.
   */
  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000); // Auto-hide after 5s
  };

  /* ---------------- LOAD DEPARTMENTS ----------------
   * useEffect runs AFTER the component first appears on screen.
   * This fetches the list of departments from the backend.
   */
  const loadDepartments = useCallback(async () => {
    try {
      const res = await apiClient().get("/admin/departments");
      const list = Array.isArray(res.data) ? res.data.map((d) => d.name) : [];
      setClassesList(list);
      if (list.length && !selectedDepartment) {
        setSelectedDepartment(list[0]);
      }
    } catch (err) {
      console.error("Load departments error", err);
    }
  }, [apiClient, selectedDepartment]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  /* ---------------- ADD DEPARTMENT ----------------
   * When user fills the "Department name" box and clicks "Add",
   * this sends a POST request to the backend to create it.
   */
  const handleAddDepartment = async (e) => {
    e.preventDefault(); // Stops page from refreshing (default form behavior)
    try {
      const res = await apiClient().post("/admin/departments", {
        name: newDepartment,
      });
      showMsg(`✅ Department "${res.data.name}" added!`);
      setNewDepartment("");
      loadDepartments();
    } catch (err) {
      showMsg(err?.response?.data?.message || "Failed to add department", "error");
    }
  };

  /* ---------------- ADD SECTION ----------------
   * Creates a new section inside the selected department.
   */
  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient().post("/admin/sections", {
        name: sectionName,
        department: selectedDepartment,
      });
      showMsg(`✅ Section "${res.data.name}" added!`);
      setSectionName("");
    } catch (err) {
      showMsg(err?.response?.data?.message || "Failed to add section", "error");
    }
  };

  /* ---------------- ADD SINGLE STUDENT ----------------
   * Creates one student record in the database.
   */
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: student.studentId || student.email,
        name: student.name,
        email: student.email,
        department: student.department,
        section: student.section,
      };
      const res = await apiClient().post("/admin/students", payload);
      showMsg(`✅ Student "${res.data.name}" added!`);
      setStudent({ studentId: "", name: "", email: "", department: "", section: "" });
    } catch (err) {
      showMsg(err?.response?.data?.message || "Failed to add student", "error");
    }
  };

  /* ================================================================
   * BULK IMPORT FEATURE — NEW!
   * ================================================================
   * 💡 HOW IT WORKS:
   * 1. User picks an Excel (.xlsx) or CSV file
   * 2. We READ the file in the browser using the "xlsx" library
   * 3. We show a PREVIEW of what will be imported
   * 4. User clicks "Confirm Import" and we send all rows to the backend
   *
   * Expected columns in the file:
   *   studentId | name | email | section
   *   (department is chosen from the dropdown above)
   * ================================================================
   */

  /* Step 1: User selects a file → parse it and show preview */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // FileReader is a built-in browser API to read files
    const reader = new FileReader();

    reader.onload = (evt) => {
      // Convert file binary data into a workbook (spreadsheet object)
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert the sheet into a JSON array: [{col1: val, col2: val}, ...]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      setImportPreview(rows.slice(0, 5)); // Show only first 5 rows as preview
    };

    reader.readAsArrayBuffer(file); // Read as binary
  };

  /* Step 2: User confirms → send all rows to backend */
  const handleBulkImport = async () => {
    if (!importFile) return showMsg("Please select a file first", "error");
    if (!importDept) return showMsg("Please select a department", "error");

    setImporting(true);
    setImportResult(null);

    // Re-read the full file (not just the preview)
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Map each row to our student format
        // 💡 We're flexible with column names — we try multiple options
        const students = rows.map((row, i) => {
          const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
          const get = (names) => {
            for (const n of names) {
              const found = Object.keys(row).find((k) => k.toLowerCase().trim() === n);
              if (found && row[found] !== "") return String(row[found]).trim();
            }
            return "";
          };

          return {
            studentId: get(["studentid", "student_id", "id", "roll", "rollno", "roll no", "rollnumber"]) || `IMPORT-${i + 1}`,
            name: get(["name", "student name", "studentname", "full name", "fullname"]),
            email: get(["email", "mail", "emailid", "email id"]),
            department: importDept,
            section: importSection || get(["section", "sec", "class"]),
          };
        }).filter((s) => s.name); // Skip rows with no name

        if (students.length === 0) {
          showMsg("No valid student rows found. Make sure your file has a 'name' column.", "error");
          setImporting(false);
          return;
        }

        // Send all students to backend using the bulk endpoint
        const res = await apiClient().post("/admin/students/bulk", { students });
        setImportResult({
          success: true,
          count: students.length,
          message: `✅ Successfully imported ${students.length} students!`,
        });
        showMsg(`✅ Imported ${students.length} students!`);

        // Reset
        setImportFile(null);
        setImportPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error("Bulk import error", err);
        setImportResult({
          success: false,
          message: err?.response?.data?.message || "Import failed. Check your file format.",
        });
        showMsg(err?.response?.data?.message || "Import failed", "error");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  /* Download a template Excel file so users know what columns to use */
  const downloadTemplate = () => {
    const templateData = [
      { studentId: "24UCS101", name: "Alice Johnson", email: "alice@college.edu", section: "A" },
      { studentId: "24UCS102", name: "Bob Smith", email: "bob@college.edu", section: "A" },
      { studentId: "24UCS103", name: "Carol White", email: "carol@college.edu", section: "B" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  /* ---------------- UI / RENDER ----------------
   * This is what users actually see on screen.
   */
  return (
    <div className="creation-page">
      <h2>Creation / Management</h2>

      {/* ── STATUS MESSAGE ── */}
      {message.text && (
        <div className={`creation-message ${message.type === "error" ? "creation-message--error" : ""}`}>
          {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PANEL 1: ADD DEPARTMENT
      ══════════════════════════════════════════ */}
      <section className="creation-panel">
        <h3>🏛️ Add Department</h3>
        <form onSubmit={handleAddDepartment}>
          <input
            placeholder="Department name (e.g. IBSc CS)"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </section>

      {/* ══════════════════════════════════════════
          PANEL 2: ADD SECTION
      ══════════════════════════════════════════ */}
      <section className="creation-panel">
        <h3>📂 Add Section</h3>
        <form onSubmit={handleAddSection}>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {classesList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            placeholder="Section name (e.g. A)"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </section>

      {/* ══════════════════════════════════════════
          PANEL 3: ADD SINGLE STUDENT
      ══════════════════════════════════════════ */}
      <section className="creation-panel">
        <h3>🎓 Add Student (Single)</h3>
        <form onSubmit={handleAddStudent} className="student-form">
          <input
            placeholder="Student ID (e.g. 24UCS101)"
            value={student.studentId}
            onChange={(e) => setStudent({ ...student, studentId: e.target.value })}
          />
          <input
            placeholder="Full Name"
            required
            value={student.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })}
          />
          <input
            placeholder="Email"
            required
            value={student.email}
            onChange={(e) => setStudent({ ...student, email: e.target.value })}
          />
          <select
            value={student.department}
            onChange={(e) => setStudent({ ...student, department: e.target.value })}
          >
            <option value="">Select Department</option>
            {classesList.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            placeholder="Section (e.g. A)"
            value={student.section}
            onChange={(e) => setStudent({ ...student, section: e.target.value })}
          />
          <button type="submit" className="btn-primary">Add Student</button>
        </form>
      </section>

      {/* ══════════════════════════════════════════
          PANEL 4: BULK IMPORT — NEW FEATURE! ✨
      ══════════════════════════════════════════ */}
      <section className="creation-panel import-panel">
        <h3>📥 Bulk Import Students (Excel / CSV)</h3>

        <p className="import-hint">
          Upload an Excel (.xlsx) or CSV (.csv) file to add many students at once.
          Your file should have columns: <strong>studentId, name, email, section</strong>.
          Department is chosen below.
        </p>

        {/* Download template button */}
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn-outline"
            onClick={downloadTemplate}
          >
            📋 Download Template
          </button>
          <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>
            Download a sample file to see the correct format
          </span>
        </div>

        {/* Row 1: Department + Section selectors */}
        <div className="import-controls">
          <label>
            Department:
            <select
              value={importDept}
              onChange={(e) => setImportDept(e.target.value)}
            >
              <option value="">— Select —</option>
              {classesList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label>
            Section (optional):
            <input
              placeholder="Leave blank to use file column"
              value={importSection}
              onChange={(e) => setImportSection(e.target.value.toUpperCase())}
              style={{ width: 140 }}
            />
          </label>
        </div>

        {/* Row 2: File picker */}
        <div className="import-file-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="file-input"
            id="import-file"
          />
          <label htmlFor="import-file" className="btn-file-pick">
            📂 Choose File
          </label>
          <span className="file-name">
            {importFile ? importFile.name : "No file chosen"}
          </span>
        </div>

        {/* Preview of first 5 rows */}
        {importPreview.length > 0 && (
          <div className="import-preview">
            <p style={{ fontWeight: 600, marginBottom: 6 }}>
              📄 Preview (first {importPreview.length} rows):
            </p>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    {Object.keys(importPreview[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirm Import button */}
        <button
          type="button"
          className="btn-import"
          onClick={handleBulkImport}
          disabled={importing || !importFile || !importDept}
        >
          {importing ? "⏳ Importing..." : "✅ Confirm Import"}
        </button>

        {/* Import result message */}
        {importResult && (
          <div className={`import-result ${importResult.success ? "import-result--ok" : "import-result--fail"}`}>
            {importResult.message}
          </div>
        )}
      </section>
    </div>
  );
}

export default Creation;
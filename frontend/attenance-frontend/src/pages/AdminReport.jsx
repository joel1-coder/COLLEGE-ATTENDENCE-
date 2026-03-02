import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminReport(){
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16 }}>
      <h2>Reports</h2>

      <div className="flashcards">
        <article className="flashcard">
          <h3>View Daily Attendance</h3>
          <p className="muted">View Attendance for a specific date and class.</p>
          <div className="card-actions">
            <Link to="/previous-Attendance"><button className="btn">Open</button></Link>
          </div>
        </article>

        <article className="flashcard">
          <h3>Monthly Reports</h3>
          <p className="muted">Generate aggregated monthly Attendance and marks summaries.</p>
          <div className="card-actions">
            <button className="btn" onClick={() => navigate('/admin/report/monthly')}>Generate</button>
          </div>
        </article>

        <article className="flashcard">
          <h3>Edit Attendance</h3>
          <p className="muted">Edit Attendance records for any date (admin-only).</p>
          <div className="card-actions">
            <Link to="/admin/Attendance"><button className="btn">Edit Attendance</button></Link>
          </div>
        </article>

        <article className="flashcard danger">
          <h3>Reset / Reopen Attendance</h3>
          <p className="muted">Reset Attendance for a date or reopen submissions for edits.</p>
          <div className="card-actions">
            <button className="btn" onClick={() => navigate('/admin/report/reset')}>Reset / Reopen</button>
          </div>
        </article>
      </div>
    </div>
  );
}


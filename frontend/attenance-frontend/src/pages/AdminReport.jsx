import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminReport(){
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16 }}>
      <h2>Reports</h2>

      <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>View Daily Attendance</h3>
          <p>View attendance for a specific date.</p>
          <Link to="/previous-attendance"><button>Open</button></Link>
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Monthly Reports</h3>
          <p>Generate aggregated monthly attendance and marks reports.</p>
          <button onClick={() => navigate('/admin/report/monthly')}>Generate</button>
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Edit Attendance</h3>
          <p>Edit attendance records (admin-only).</p>
          <Link to="/admin/attendance"><button>Edit Attendance</button></Link>
        </div>

        <div style={{ padding: 12, border: '1px solid #f8d7da', borderRadius: 6, background: '#fff5f5' }}>
          <h3>Reset / Reopen Attendance</h3>
          <p>Reset attendance for a date or reopen submission for edits.</p>
          <button onClick={() => navigate('/admin/report/reset')}>Reset / Reopen</button>
        </div>
      </div>
    </div>
  );
}


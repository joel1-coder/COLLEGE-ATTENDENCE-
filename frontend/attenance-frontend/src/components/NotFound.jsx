import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2>404 — Page Not Found</h2>
      <p>The page you requested does not exist.</p>
      <div style={{ marginTop: 12 }}>
        <Link to="/">Go to Home</Link>
      </div>
    </div>
  );
}

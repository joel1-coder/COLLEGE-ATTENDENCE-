import React, { useState } from 'react';
import api from '../api/api';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setMessage('');
    if (!email) return setMessage('Email required');
    setLoading(true);
    try {
      const resp = await api.post('/auth/forgot-password', { email });
      setMessage(resp.data?.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      console.error(err);
      setMessage(eadded err?.response?.data?.message || err.message || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Forgot Password</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Email: </label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={submit} style={{ marginLeft: 8 }} disabled={loading}>Send Reset Link</button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}

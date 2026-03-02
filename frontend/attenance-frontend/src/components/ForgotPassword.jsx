// ============================================================
// ForgotPassword.jsx — updated with toast notifications
// ============================================================
import React, { useState } from 'react';
import api from '../api/api';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  const submit = async () => {
    if (!email) { toast.warning('Email is required'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/auth/forgot-password', { email });
      toast.success(resp.data?.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <h2>Forgot Password</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Email: </label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={submit} style={{ marginLeft: 8 }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </div>
    </div>
  );
}
// ============================================================
// ResetPassword.jsx — updated with toast notifications
// ============================================================
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Toast from './Toast';
import useToast from '../Hooks/usetoast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    if (!token || !email) toast.error('Missing token or email in link');
  }, [token, email]);

  const submit = async () => {
    if (!newPassword) { toast.warning('Please enter a new password'); return; }
    setLoading(true);
    try {
      const resp = await api.post('/auth/reset-password', { email, token, newPassword });
      toast.success(resp.data?.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <Toast toasts={toasts} removeToast={removeToast} />
      <h2>Reset Password</h2>
      <div style={{ marginBottom: 12 }}>
        <div>Email: {email}</div>
        <label>New password: </label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={submit} style={{ marginLeft: 8 }} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}
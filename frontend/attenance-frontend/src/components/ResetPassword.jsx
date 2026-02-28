import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function ResetPassword(){
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) setMessage('Missing token or email in link');
  }, [token, email]);

  const submit = async () => {
    setMessage('');
    if (!newPassword) return setMessage('Enter a new password');
    setLoading(true);
    try {
      const resp = await api.post('/auth/reset-password', { email, token, newPassword });
      setMessage(resp.data?.message || 'Password reset');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || err.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Reset Password</h2>
      <div style={{ marginBottom: 12 }}>
        <div>Email: {email}</div>
        <label>New password: </label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={submit} style={{ marginLeft: 8 }} disabled={loading}>Reset</button>
      </div>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}

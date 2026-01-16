import React, { useState } from 'react';
import api from '../api/api';

export default function AdminCreateAdmin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email || !password) return setMessage('Email and password required');
    if (password !== confirm) return setMessage('Passwords do not match');
    try {
      const stored = JSON.parse(localStorage.getItem('user')) || null;
      const headers = stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
      const res = await api.post('/admin/users/admin', { name, email, password }, { headers });
      setMessage(res.data?.message || 'Admin created');
      setName(''); setEmail(''); setPassword(''); setConfirm('');
    } catch (err) {
      console.error('Create admin error', err);
      setMessage(err?.response?.data?.message || err.message || 'Failed');
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '12px auto' }}>
      <h3>Create Admin</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label>Confirm</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Create Admin</button>
        </div>
        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </form>
    </div>
  );
}

import axios from "axios";

// Ensure the API base URL always points to the /api root.
let raw = process.env.REACT_APP_API_URL || 'https://college-attendence.onrender.com';
raw = String(raw).replace(/\/+$/, '');
const baseURL = raw.endsWith('/api') ? raw : `${raw}/api`;
const api = axios.create({ baseURL });

// ✅ FIX #5 — Role-aware 401 redirect.
// Before: ALL 401 errors sent the user to /login — even admins.
// This meant if an admin's token expired on /admin/staff, they'd land on the
// staff login page (/login) instead of the admin login page (/admin/login).
//
// After: We check what page the user is currently on.
// If they're on an /admin path, redirect to /admin/login.
// Otherwise redirect to /login (for staff).
//
// 💡 Beginner tip: An "interceptor" is a function that runs automatically
// for EVERY request/response. Think of it as a security guard that checks
// every API response before handing it to your component.
api.interceptors.response.use(
  (resp) => resp, // Pass successful responses through unchanged
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('user'); // Clear invalid session data
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const isAdminPath = window.location.pathname.startsWith('/admin');
        const alreadyOnLogin = window.location.pathname === '/login' ||
                               window.location.pathname === '/admin/login';

        // Avoid infinite redirect loop if already on a login page
        if (!alreadyOnLogin) {
          window.location.href = isAdminPath ? '/admin/login' : '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export default api;
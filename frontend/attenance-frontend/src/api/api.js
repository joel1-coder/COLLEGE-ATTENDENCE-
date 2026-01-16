import axios from "axios";

// Ensure the API base URL always points to the /api root.
let raw = process.env.REACT_APP_API_URL || 'https://college-attendence.onrender.com';
raw = String(raw).replace(/\/+$/, '');
const baseURL = raw.endsWith('/api') ? raw : `${raw}/api`;
const api = axios.create({ baseURL });

// Response interceptor: on 401, clear stored user and redirect to login
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('user');
      } catch (e) {}
      if (typeof window !== 'undefined') {
        // avoid infinite loop if already on login
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
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

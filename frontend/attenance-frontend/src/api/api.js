import axios from "axios";

const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export default api;

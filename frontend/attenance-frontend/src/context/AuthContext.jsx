import { createContext, useState, useEffect } from "react";
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user')) || null;
    if (!stored?.token) {
      setInitializing(false);
      return;
    }

    // set header and verify token with backend
    axios.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
    axios.get('https://college-attendence.onrender.com/api/auth/verify')
      .then((res) => {
        if (res.data && res.data.valid) {
          setUser(stored);
        } else {
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import { baseURL } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  // null = unknown, true = first-time setup needed, false = system ready
  const [setupRequired, setSetupRequired] = useState(null);

  useEffect(() => {
    // First check if the system has been configured (any users exist)
    axios.get(`${baseURL}/auth/setup-status`)
      .then((res) => {
        const configured = res.data?.configured;
        setSetupRequired(!configured);
        if (!configured) {
          // System not set up — skip token verification
          setInitializing(false);
          return;
        }
        // System configured — now verify stored token
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        if (!stored?.token) {
          setInitializing(false);
          return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
        axios.get(`${baseURL}/auth/verify`)
          .then((verifyRes) => {
            if (verifyRes.data?.valid) {
              setUser(stored);
            } else {
              localStorage.removeItem('user');
              delete axios.defaults.headers.common['Authorization'];
            }
          })
          .catch(() => {
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          })
          .finally(() => setInitializing(false));
      })
      .catch(() => {
        // If we can't reach the backend, fall back to stored token
        setSetupRequired(false);
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        if (stored?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
          setUser(stored);
        }
        setInitializing(false);
      });
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

  // Called after onboarding completes to flip the flag
  const markConfigured = () => setSetupRequired(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing, setupRequired, markConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

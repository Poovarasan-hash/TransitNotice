import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('transit_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getCurrentUser()
      .then(data => {
        setUser(data.user);
        setPreferences(data.preferences);
      })
      .catch(err => {
        console.warn('Session expired or invalid token:', err.message);
        localStorage.removeItem('transit_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (emailOrUsername, password) => {
    const data = await api.login(emailOrUsername, password);
    localStorage.setItem('transit_token', data.token);
    setUser(data.user);
    // Fetch user preferences
    try {
      const meData = await api.getCurrentUser();
      setPreferences(meData.preferences);
    } catch (e) {
      // ignore
    }
    return data;
  };

  const register = async (username, email, password) => {
    const data = await api.register(username, email, password);
    localStorage.setItem('transit_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('transit_token');
    setUser(null);
    setPreferences(null);
  };

  const savePreferences = async (newPrefs) => {
    await api.updatePreferences(newPrefs);
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <AuthContext.Provider value={{ user, preferences, loading, login, register, logout, savePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

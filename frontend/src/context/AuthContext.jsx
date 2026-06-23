'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('rememberEmail') || '') : '');

  const fetchUser = useCallback(async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        token = sessionStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }
      }
      const res = await authAPI.getMe();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchUser();
    });
  }, [fetchUser]);

  const login = async (email, password, remember = false) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData, mustChangePassword } = res.data.data;
    if (remember) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('rememberEmail', email);
      setRememberEmail(email);
    } else {
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
      localStorage.removeItem('rememberEmail');
      setRememberEmail('');
    }
    setUser(userData);
    return { user: userData, mustChangePassword };
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberEmail');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
    setRememberEmail('');
    window.location.href = '/login';
  };

  const refetchUser = fetchUser;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser, rememberEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

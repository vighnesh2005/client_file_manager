import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storage from '../lib/storage';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await authAPI.getMe();
      setUser(res.data.data);
    } catch {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    await storage.setItem('accessToken', accessToken);
    if (refreshToken) {
      await storage.setItem('refreshToken', refreshToken);
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (allowed: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('taniisha_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('taniisha_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
      } catch (err) {
        console.warn('Stored token invalid or expired:', err);
        localStorage.removeItem('taniisha_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (u: string, p: string) => {
    const res = await api.login(u, p);
    localStorage.setItem('taniisha_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('taniisha_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const hasPermission = (allowed: UserRole[]) => {
    if (!user) return false;
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

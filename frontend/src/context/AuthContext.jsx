import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then((res) => {
          const profile = res?.user || res?.data;
          if (profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const receivedToken = res?.token || res?.data?.token;
    const receivedUser = res?.user || res?.data?.user;

    if (receivedToken) {
      setToken(receivedToken);
      setUser(receivedUser || null);
      localStorage.setItem('token', receivedToken);
      if (receivedUser) {
        localStorage.setItem('user', JSON.stringify(receivedUser));
      }
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Instant persona role switcher for demo accounts
  const switchRole = async (roleName) => {
    const roleEmailMap = {
      'Admin': 'admin@peoplepay360.com',
      'HR Manager': 'priya.patel@peoplepay360.com',
      'HR Payroll Admin': 'amit.singh@peoplepay360.com',
      'HR Payroll User': 'neha.gupta@peoplepay360.com',
      'Employee': 'rahul.sharma@peoplepay360.com'
    };

    const targetEmail = roleEmailMap[roleName];
    if (targetEmail) {
      return await login(targetEmail, 'Password@123');
    }
    throw new Error(`Demo account for role "${roleName}" is not configured.`);
  };

  // Permission helpers
  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return roles.includes(user.role);
  };

  const isEmployeeOnly = user?.role === 'Employee';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRole, hasRole, isEmployeeOnly }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

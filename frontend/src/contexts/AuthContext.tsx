import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<AuthResponse>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const res = await authApi.login(credentials);
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res));
    setToken(res.access_token);
    setUser(res);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, isLoading, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

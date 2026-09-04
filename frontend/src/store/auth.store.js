import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, saveToken, saveUser, getUser, clearAuth as clearStorage } from '../utils/storage';
import { authApi } from '../services/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (token) {
        // Option 1: Just rely on stored user object for fast load
        const storedUser = await getUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
        
        // Option 2: Validate token with backend quietly
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            await saveUser(res.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Token might be expired or invalid
          console.error("Token validation failed during restore:", error);
          await clearStorage();
        }
      }
    } catch (error) {
      console.error("Failed to restore session", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        const { token, user: userData } = res.data;
        
        await saveToken(token);
        await saveUser(userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'An error occurred during login';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await clearStorage();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

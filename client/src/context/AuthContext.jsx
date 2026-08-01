import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { registerAccessTokenSetter } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(window.__accessToken || null);
  const [loading, setLoading] = useState(true);

  // Subscribe to axiosInstance silent refresh updates
  useEffect(() => {
    registerAccessTokenSetter((token) => {
      setAccessToken(token);
    });
  }, []);

  // Check if session exists on load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // This will trigger silent token refresh if accessToken is null but httpOnly cookie is valid
        const response = await axiosInstance.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('No active session found on load.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password, role });
      
      if (response.data.success) {
        const { accessToken, user } = response.data;
        window.__accessToken = accessToken;
        setAccessToken(accessToken);
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      if (!error.response) {
        return {
          success: false,
          error: 'Cannot reach the API server. Start the backend on port 5000 (cd vastusetu/server && npm run dev).'
        };
      }
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.__accessToken = null;
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

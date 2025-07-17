import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screens, setScreens] = useState([]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setScreens([]);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('Fetching user profile...');
      const response = await axios.get('/api/users/me');
      console.log('User profile response:', response.data);
      setUser(response.data.user);
      
      // Fetch user's screens
      console.log('Fetching user screens...');
      const screensResponse = await axios.get('/api/users/me/screens');
      console.log('Screens response:', screensResponse.data);
      setScreens(screensResponse.data.screens);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      console.error('Error details:', error.response?.data || error.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Fetch user's screens after login
      console.log('Fetching screens after login...');
      const screensResponse = await axios.get('/api/users/me/screens');
      console.log('Post-login screens response:', screensResponse.data);
      setScreens(screensResponse.data.screens);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error details:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    screens,
    login,
    logout,
    refreshProfile: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token') || localStorage.getItem('authToken')
  );
  const [user, setUser] = useState<any | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!token) return null;
      const response = await authAPI.getProfile(token);
      console.log('Fetch User Profile Response:', response);
      if (response.success) {
        const userData = {
          email: response.email,
          user_type: response.user_type
        };
        setUser(userData);
        // Store user type in localStorage
        if (response.user_type) {
          localStorage.setItem('userType', response.user_type);
          console.log('Stored user type:', response.user_type);
        }
        return response;
      } else {
        logout();
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      logout();
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('Login Response:', response);
      
      if (response.success) {
        const token = response.token;
        setToken(token);
        // Store token in both locations for compatibility
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        
        // Set user type from login response
        if (response.user_type) {
          const userData = {
            email: email,
            user_type: response.user_type
          };
          setUser(userData);
          localStorage.setItem('userType', response.user_type);
          console.log('Set user type from login:', response.user_type);
        }
        
        // Fetch user profile and wait for it to complete
        const profileResponse = await fetchUserProfile();
        console.log('Profile Response after login:', profileResponse);
        
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
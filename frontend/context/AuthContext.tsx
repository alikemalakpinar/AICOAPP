import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface User {
  _id: string;
  email: string;
  full_name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';
console.log("👀 API_URL:", API_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });

    const accessToken = response.data.access_token;   // 🔥 backend field
    const refreshToken = response.data.refresh_token; // 🔥 backend field
    const newUser = response.data.user;

    if (!accessToken || !newUser) {
      throw new Error("Invalid login response");
    }

    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    setToken(accessToken);
    setUser(newUser);

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};


  const signup = async (email: string, password: string, full_name: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      full_name,
    });

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;
    const newUser = response.data.user;

    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('refresh_token', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    setToken(accessToken);
    setUser(newUser);

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Signup failed');
  }
};


  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

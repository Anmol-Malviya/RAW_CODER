import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Simple check to see if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Set initial state from token
            setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
            
            // Fetch complete profile from server
            try {
              const res = await api.get('/auth/profile');
              if (res.data) {
                setUser({ ...res.data, id: res.data._id || decoded.id });
              }
            } catch (profileError) {
              console.error('Failed to fetch profile on load', profileError);
            }
          }
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return null; // Wait for auth check

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

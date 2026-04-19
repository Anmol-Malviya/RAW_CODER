import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
          } else {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Set basic info from token immediately
            setUser({ id: decoded.id, role: decoded.role, name: decoded.name, email: decoded.email });

            // If name is missing, fetch full profile for robustness
            if (!decoded.name) {
              try {
                const response = await api.get('/auth/profile');
                const userData = response.data;
                setUser({ 
                  id: userData._id, 
                  role: userData.role, 
                  name: userData.name, 
                  email: userData.email 
                });
              } catch (e) {
                console.error('Failed to fetch profile', e);
              }
            }
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }} />
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/api';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  clientLogin: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const token = localStorage.getItem('electraflow_token');
    const storedUser = localStorage.getItem('electraflow_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Heartbeat — registra presença a cada 2 min enquanto logado
  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = () => {
      api.heartbeat().catch(() => { /* silencioso */ });
    };
    sendHeartbeat(); // envia imediatamente no login
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);

      const loggedUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: mapBackendRole(data.user.role),
        permissions: data.user.permissions || [],
        department: data.user.department,
        position: data.user.position,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('electraflow_token', data.access_token);
      localStorage.setItem('electraflow_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clientLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.clientLogin(email, password);

      const loggedUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: 'client' as UserRole,
        permissions: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('electraflow_token', data.access_token);
      localStorage.setItem('electraflow_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.register({ name, email, password });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('electraflow_token');
    localStorage.removeItem('electraflow_user');
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const hasPermission = useCallback((module: string) => {
    if (!user) return false;
    // Admin tem acesso total
    if (user.role === 'admin') return true;
    // Verifica permissões granulares
    const permissions = user.permissions || [];
    return permissions.includes(module);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        clientLogin,
        register,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Map backend role to frontend role for routing
function mapBackendRole(backendRole: string): UserRole {
  switch (backendRole) {
    case 'admin':
      return 'admin';
    case 'commercial':
      return 'commercial';
    case 'engineer':
      return 'engineer';
    case 'finance':
      return 'finance';
    case 'viewer':
      return 'viewer';
    default:
      return backendRole as UserRole;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

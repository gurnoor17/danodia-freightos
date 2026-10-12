'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, loginUser, registerUser, getMe, logoutUser, ApiError } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'danodia_freightos_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify authentication session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        if (typeof window === 'undefined') return;

        const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Verify with the backend to ensure the token hasn't expired or been modified
        const profile = await getMe(storedToken);
        setUser(profile);
        setToken(storedToken);
      } catch (err) {
        // If verification fails (expired/invalid), clean up client session
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await loginUser({ email, password });
      setToken(authData.token);
      setUser(authData.user);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, authData.token);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await registerUser({ name, email, password });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token;
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    try {
      if (currentToken) {
        await logoutUser(currentToken);
      }
    } catch {
      // Ignore network errors during logout
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

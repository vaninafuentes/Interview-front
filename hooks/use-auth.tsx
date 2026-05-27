import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthContextValue, AuthSession, LoginPayload, RegisterPayload, User } from '@/types/auth';
import * as authService from '@/services/auth-service';

const AUTH_STORAGE_KEY = 'auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return;

        const parsed: AuthSession = JSON.parse(stored);
        if (!parsed?.user || !parsed?.token) {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          return;
        }
        if (isMounted) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch (error) {
        console.error('Failed to restore auth session.', error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = async (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const clearSession = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const login = async (payload: LoginPayload) => {
    const session = await authService.login(payload);
    await persistSession(session);
  };

  const register = async (payload: RegisterPayload) => {
    const session = await authService.register(payload);
    await persistSession(session);
  };

  const logout = async () => {
    await clearSession();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    }),
    [isLoading, register, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}

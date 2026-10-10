/**
 * src/hooks/use-auth.tsx
 * ----------------------
 * Context + hook de autenticación.
 *
 * Capa: HOOKS
 * -----------
 * Gestiona el estado de sesión del usuario usando Context API.
 * Persiste la sesión en AsyncStorage para sobrevivir reinicios de la app.
 *
 * Flujo completo:
 *   1. Al iniciar la app: restaura sesión desde AsyncStorage
 *   2. Al login/register: llama al backend real → recibe AuthResponse con JWT
 *   3. Guarda { user, token } en AsyncStorage y en el estado React
 *   4. Axios inyecta el token automáticamente en cada request
 *   5. Al logout: limpia AsyncStorage y el estado
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type {
  AuthContextValue,
  AuthResponse,
  AuthSession,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/src/domain/auth';
import { loginRequest, registerRequest } from '@/src/data/api/auth-api';
import { authEvents } from '@/src/lib/auth-events';

/**
 * Decodifica el payload de un JWT y devuelve true si el token está vencido.
 * JWT = base64(header).base64(payload).signature
 * El campo `exp` es la expiración en segundos desde epoch.
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const payloadB64 = token.split('.')[1];
    // Normalizar base64url → base64 estándar
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (typeof decoded.exp !== 'number') return false;
    // exp está en segundos; Date.now() en ms
    return Date.now() / 1000 > decoded.exp;
  } catch {
    // Si no se puede decodificar, tratar como vencido por seguridad
    return true;
  }
};

const AUTH_STORAGE_KEY = 'auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión desde AsyncStorage al iniciar la app
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return;

        const parsed: AuthSession = JSON.parse(stored);
        const isValidSession = parsed?.user && parsed?.token;

        if (isValidSession && isMounted) {
          // Verificar si el token JWT ya venció
          if (isTokenExpired(parsed.token)) {
            console.warn('[Auth] Token expirado. Cerrando sesión automáticamente.');
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            // setIsLoading(false) se ejecuta en finally, user/token quedan null → redirige al login
          } else {
            setUser(parsed.user);
            setToken(parsed.token);
          }
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error('[Auth] Fallo al restaurar sesión:', error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => { isMounted = false; };
  }, []);

  /**
   * Convierte AuthResponse del backend a AuthSession local.
   * El backend devuelve id como number; lo convertimos a string para el dominio.
   */
  const buildSession = (response: AuthResponse): AuthSession => ({
    token: response.token,
    user: {
      id: String(response.id),
      name: response.name,
      email: response.email,
    },
  });

  /** Guarda la sesión en AsyncStorage y en el estado local */
  const persistSession = async (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  /** Limpia la sesión de AsyncStorage y del estado local */
  const clearSession = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  /** Login real con el backend */
  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    const session = buildSession(response);
    await persistSession(session);
  };

  /** Registro real con el backend */
  const register = async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    const session = buildSession(response);
    await persistSession(session);
  };

  const logout = async () => clearSession();

  /** Actualizar datos del perfil localmente en sesión persistida */
  const updateUser = async (updatedFields: Partial<User>) => {
    if (!user || !token) return;
    const updatedUser: User = { ...user, ...updatedFields };
    await persistSession({ user: updatedUser, token });
  };

  // Registrar clearSession como listener para que axios pueda disparar el logout
  // cuando recibe un 401 (token vencido o inválido en mitad de la sesión)
  useEffect(() => {
    authEvents.setLogoutListener(clearSession);
  }, []);

  // useMemo evita que el contexto se re-cree en cada render del Provider
  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout, updateUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
};

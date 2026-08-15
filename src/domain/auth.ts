/**
 * src/domain/auth.ts
 * ------------------
 * Modelos de dominio para autenticación.
 *
 * Capa: DOMAIN
 * ------------
 * Tipos puros sin dependencias externas.
 * Representan las entidades de auth que maneja la app.
 *
 * AuthResponse espeja el DTO del backend:
 *   AuthResponse.java → { token, id, name, email }
 */

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthSession = {
  user: User;
  token: string;
};

/** Respuesta del backend en login y register */
export type AuthResponse = {
  token: string;
  id: number;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};


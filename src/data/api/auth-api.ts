/**
 * src/data/api/auth-api.ts
 * ------------------------
 * Funciones puras para llamar a los endpoints de autenticación reales.
 *
 * Capa: DATA / API
 * ----------------
 * Patrón: Funciones puras, sin clases, sin estado de React.
 * Patrón Facade: usa axiosClient, que oculta la complejidad de configuración HTTP.
 *
 * Endpoints del backend:
 *   POST /api/auth/login    → 200 OK     + AuthResponse
 *   POST /api/auth/register → 201 Created + AuthResponse
 */

import { axiosClient } from '@/src/lib/axios';
import { API_ENDPOINTS } from '@/src/constants/api';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/src/domain/auth';

/**
 * Inicia sesión con email y contraseña.
 * Llama al endpoint real del backend.
 *
 * @param payload - Credenciales del usuario { email, password }
 * @returns Promise con AuthResponse { token, id, name, email }
 * @throws AxiosError si las credenciales son incorrectas (401) o hay error de red
 */
export const loginRequest = (payload: LoginPayload): Promise<AuthResponse> =>
  axiosClient
    .post<AuthResponse>(API_ENDPOINTS.auth.login, payload)
    .then((res) => res.data);

/**
 * Registra un nuevo usuario.
 * Llama al endpoint real del backend.
 *
 * @param payload - Datos del nuevo usuario { name, email, password }
 * @returns Promise con AuthResponse { token, id, name, email }
 * @throws AxiosError si el email ya existe (409) o hay error de red
 */
export const registerRequest = (payload: RegisterPayload): Promise<AuthResponse> =>
  axiosClient
    .post<AuthResponse>(API_ENDPOINTS.auth.register, payload)
    .then((res) => res.data);

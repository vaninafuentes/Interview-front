/**
 * src/lib/axios.ts
 * ----------------
 * Instancia configurada de Axios para toda la aplicación.
 *
 * Capa: LIB
 * ---------
 * La capa lib centraliza la inicialización de librerías de terceros.
 * Se crea UNA sola instancia de Axios (Singleton) y se exporta.
 * Todos los archivos de data/api/ importan este cliente, nunca `axios` directamente.
 *
 * ¿Por qué Axios en vez de fetch?
 *   1. Interceptores: inyecta el token JWT en cada request automáticamente
 *   2. Manejo de errores unificado en un solo lugar
 *   3. Timeout configurable
 *   4. Transforma automáticamente el body a JSON
 *   5. Tipado más limpio con genéricos: axiosClient.get<Question[]>(...)
 *
 * Patrón "Facade" (Fachada):
 *   Esta instancia esconde la complejidad de configurar Axios.
 *   Los archivos data/api/ solo llaman métodos limpios (.get, .post, etc.)
 *   sin mezclar configuración con lógica de negocio.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/src/constants/api';

const AUTH_STORAGE_KEY = 'auth-session';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /** Timeout de 10 segundos - si el servidor no responde, lanza error */
  timeout: 10_000,
});

/**
 * Interceptor de REQUEST:
 * Se ejecuta ANTES de cada petición.
 * Lee el token JWT de AsyncStorage e inyecta el header Authorization.
 * Así todos los endpoints protegidos reciben automáticamente el token.
 */
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch {
      // Si falla la lectura de AsyncStorage, continúa sin token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de RESPONSE:
 * Se ejecuta DESPUÉS de cada respuesta.
 * Centraliza el manejo de errores HTTP (401, 403, 500, etc.)
 * Extrae el mensaje de error del backend para mostrarlo en la UI.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Extraer mensaje del backend si existe, sino usar mensaje genérico
      const backendMessage = data?.message || data?.error || null;

      if (status === 401) {
        console.warn('[Axios] 401 - No autorizado');
      }
      if (status === 409) {
        console.warn('[Axios] 409 - Conflicto (email duplicado?)');
      }
      if (status >= 500) {
        console.error('[Axios] Error del servidor:', status);
      }

      // Re-lanzar con mensaje legible del backend para mostrar en formularios
      if (backendMessage) {
        return Promise.reject(new Error(backendMessage));
      }
    } else if (error.request) {
      console.error('[Axios] Sin respuesta del servidor (red caída o backend apagado)');
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verificá tu conexión.'));
    }
    return Promise.reject(error);
  }
);

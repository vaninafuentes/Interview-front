/**
 * src/constants/api.ts
 * --------------------
 * Archivo de constantes para la API del backend.
 *
 * REGLA: Nunca hardcodear URLs o strings mágicos en el código.
 * Todo string que se repite en más de un lugar → viene de acá.
 *
 * URL dinámica según entorno:
 *   - Web / iOS Simulator   → localhost:8080 (directo)
 *   - Expo Go en celular    → IP detectada automáticamente desde Metro
 *   - Emulador Android      → 10.0.2.2:8080 (alias al host)
 *
 * Con Expo Go en dispositivo físico, la app y la PC deben estar
 * en la misma red WiFi. Constants.expoConfig.hostUri da la IP de Metro
 * (ej: "192.168.1.X:8081"), de donde extraemos la IP del backend.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // En web: localhost funciona directo
  if (Platform.OS === 'web') return 'http://localhost:8080';

  // En Expo Go (físico o emulador): usar la IP del servidor Metro
  // hostUri tiene formato "192.168.X.X:8081" → tomamos solo la IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8080`;
  }

  // Fallback para Android emulator sin Expo Go
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';

  // Fallback para iOS simulator
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

/** Endpoints de la API - separados por recurso */
export const API_ENDPOINTS = {
  questions: {
    /** GET /api/questions → lista todas las preguntas */
    getAll: '/api/questions',
    /** GET /api/questions/:id → obtiene una pregunta por id */
    getById: (id: number) => `/api/questions/${id}`,
  },
  auth: {
    /** POST /api/auth/login */
    login: '/api/auth/login',
    /** POST /api/auth/register */
    register: '/api/auth/register',
  },
} as const;

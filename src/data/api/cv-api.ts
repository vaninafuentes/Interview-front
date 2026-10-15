/**
 * src/data/api/cv-api.ts
 * ----------------------
 * Funciones puras para llamar al endpoint de análisis de CV con IA.
 *
 * Capa: DATA / API
 * ----------------
 * Esta capa es el único lugar que habla con el backend sobre el CV.
 * Usa el axiosClient configurado en lib/axios.ts (Patrón Facade/Fachada).
 *
 * Reglas de esta capa:
 *   ✅ Solo funciones puras: input → HTTP → output tipado
 *   ✅ Usa axiosClient (nunca axios directamente)
 *   ✅ Usa constantes de API_ENDPOINTS (nunca strings hardcodeados)
 *   ✅ Retorna el tipo del dominio (CvAnalysisResponse)
 *   ❌ Sin lógica de UI, sin estados de React, sin efectos
 *
 * Endpoint del backend:
 *   POST /api/cv/analyze (multipart/form-data, campo "file") → 200 OK + CvAnalysisResponse
 *     Errores: 400 (sin archivo / no es PDF / supera 10 MB)
 *              401 (sin sesión válida)
 *              422 (PDF escaneado, sin texto extraíble)
 *              429 (rate limit de la IA)
 *              502 (fallo de la IA)
 */

import { axiosClient } from '@/src/lib/axios';
import { API_ENDPOINTS } from '@/src/constants/api';
import type { CvAnalysisResponse } from '@/src/domain/cv';

/** Único formato que acepta el backend (400 si se envía otro) */
export const CV_ALLOWED_MIME_TYPE = 'application/pdf';

/** Tamaño máximo que acepta el backend: 10 MB (400 si el PDF pesa más) */
export const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Status de error que el backend usa en este endpoint de forma esperada */
const EXPECTED_ERROR_STATUSES: readonly number[] = [400, 422, 429, 502];

/**
 * Archivo de CV listo para subir (subconjunto de DocumentPickerAsset de expo-document-picker).
 */
export type CvUploadFile = {
  /** URI local del archivo (file:// en nativo, blob:/data: en web) */
  uri: string;
  /** Nombre original del archivo, con su extensión */
  name: string;
  /** MIME type informado por el picker */
  mimeType?: string;
  /** En web el picker expone el File real, que es lo que necesita el FormData del navegador */
  file?: File;
};

/** Códigos de error ya normalizados, para que la UI elija el mensaje a mostrar */
export type CvAnalysisErrorCode =
  /** 400: sin archivo, no es PDF o supera los 10 MB */
  | 'INVALID_FILE'
  /** 422: el PDF no tiene texto extraíble (escaneado como imagen) */
  | 'NO_TEXT'
  /** 429: la IA está saturada, conviene reintentar en unos segundos */
  | 'AI_BUSY'
  /** 502: la IA no pudo procesar el CV */
  | 'AI_FAILURE'
  /** Red caída, timeout, 401 o 5xx: el `message` ya viene traducido por el interceptor de axios */
  | 'NETWORK'
  /** Cualquier otro caso sin mensaje útil */
  | 'UNKNOWN';

/**
 * Error de la API de análisis de CV.
 *
 * ¿Por qué una clase propia y no un Error plano?
 *   El interceptor global de axios (lib/axios.ts) colapsa TODO error HTTP a un
 *   `Error` plano con el mensaje del backend, perdiendo el status. Como la UI
 *   necesita mensajes distintos por caso (400 vs 422 vs 429), esta capa pide los
 *   status esperados con `validateStatus` y los traduce a un `code` estable.
 */
export class CvAnalysisError extends Error {
  /** Código estable con el que la UI decide el mensaje */
  readonly code: CvAnalysisErrorCode;
  /** Status HTTP original (undefined si la petición nunca llegó al backend) */
  readonly status?: number;

  constructor(code: CvAnalysisErrorCode, status?: number, message?: string) {
    super(message ?? `CV analysis failed (${code}${status ? ` - HTTP ${status}` : ''})`);
    this.name = 'CvAnalysisError';
    this.code = code;
    this.status = status;
  }
}

/** Traduce el status HTTP del backend a un código de error normalizado */
const mapStatusToErrorCode = (status: number): CvAnalysisErrorCode => {
  if (status === 400) return 'INVALID_FILE';
  if (status === 422) return 'NO_TEXT';
  if (status === 429) return 'AI_BUSY';
  if (status === 502) return 'AI_FAILURE';
  return 'UNKNOWN';
};

/**
 * Analiza el CV en PDF con la IA del backend y devuelve el perfil extraído.
 * Endpoint: POST /api/cv/analyze (multipart/form-data, campo "file")
 *
 * @param file - archivo elegido con expo-document-picker
 * @returns Promise con CvAnalysisResponse { role, seniority, skills, summary }
 * @throws CvAnalysisError con un `code` estable para que la UI muestre el mensaje correcto
 */
export const analyzeCv = async (file: CvUploadFile): Promise<CvAnalysisResponse> => {
  const formData = new FormData();

  // En web el navegador necesita el File real; en nativo React Native entiende { uri, name, type }.
  const filePart =
    file.file ?? { uri: file.uri, name: file.name, type: file.mimeType ?? CV_ALLOWED_MIME_TYPE };
  formData.append('file', filePart as any);

  try {
    const response = await axiosClient.post<CvAnalysisResponse>(
      API_ENDPOINTS.cv.analyze,
      formData,
      {
        // El header explícito evita que axios serialice el FormData a JSON
        // (el default del cliente es application/json). El boundary lo agrega RN/navegador.
        headers: { 'Content-Type': 'multipart/form-data' },
        // El timeout global del cliente (30s) está calibrado para el feedback de entrevista;
        // subir un PDF de hasta 10 MB + la extracción con IA necesitan más margen.
        timeout: 60_000,
        // Los status de error esperados se resuelven como respuesta válida para poder
        // distinguirlos por código; 401 y 5xx inesperados siguen el camino normal del interceptor.
        validateStatus: (status) => status < 400 || EXPECTED_ERROR_STATUSES.includes(status),
      }
    );

    if (response.status >= 400) {
      // La UI ya tiene un mensaje propio por código: el del backend no aporta.
      throw new CvAnalysisError(mapStatusToErrorCode(response.status), response.status);
    }

    return response.data;
  } catch (error) {
    // Un CvAnalysisError ya viene normalizado: no lo volvemos a envolver.
    if (error instanceof CvAnalysisError) throw error;

    // Red caída, 401 y 5xx: el interceptor global ya devolvió un Error con mensaje traducido.
    if (error instanceof Error) throw new CvAnalysisError('NETWORK', undefined, error.message);

    throw new CvAnalysisError('UNKNOWN');
  }
};

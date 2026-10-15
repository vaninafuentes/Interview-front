/**
 * src/hooks/use-analyze-cv.ts
 * ---------------------------
 * Custom hook para analizar el CV (PDF) con la IA del backend.
 *
 * Capa: HOOKS
 * -----------
 * Usa useMutation de React Query (no useQuery, porque es una acción del usuario,
 * no una carga de datos automática).
 *
 * Flujo:
 *   1. El usuario elige su CV en PDF
 *   2. Llama a analyzeCv({ uri, name, mimeType, file })
 *   3. El hook sube el archivo al backend (multipart)
 *   4. Retorna isPending (pantalla de análisis), error (código + mensaje) y analysis (perfil extraído)
 */

import { useMutation } from '@tanstack/react-query';
import { analyzeCv } from '@/src/data/api/cv-api';
import type { CvUploadFile } from '@/src/data/api/cv-api';
import type { CvAnalysisResponse } from '@/src/domain/cv';

/**
 * Hook para subir el CV y obtener el perfil extraído por la IA.
 *
 * Uso:
 * ```tsx
 * const { analyzeCv, isPending, analysis, reset } = useAnalyzeCv();
 *
 * // Cuando el usuario presiona "Analizar y Buscar Empleos":
 * const result = await analyzeCv(cvFile); // lanza CvAnalysisError si falla
 * ```
 */
export const useAnalyzeCv = () => {
  const mutation = useMutation<CvAnalysisResponse, Error, CvUploadFile>({
    mutationFn: analyzeCv,
  });

  return {
    /**
     * Sube el CV al backend y devuelve el perfil extraído.
     * Usa mutateAsync para poder esperar la respuesta (y capturar el error) dentro del flujo de la pantalla.
     */
    analyzeCv: mutation.mutateAsync,
    /** true mientras el CV se está subiendo y la IA lo analiza */
    isPending: mutation.isPending,
    /** true si el análisis falló */
    isError: mutation.isError,
    /** El error ocurrido (CvAnalysisError con código, o null si no hubo) */
    error: mutation.error,
    /** El perfil extraído del CV (undefined hasta que la IA responde) */
    analysis: mutation.data,
    /** Resetea el estado del mutation (al reiniciar el flujo o cambiar de CV) */
    reset: mutation.reset,
  };
};

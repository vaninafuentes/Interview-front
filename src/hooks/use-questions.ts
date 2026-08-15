/**
 * src/hooks/use-questions.ts
 * --------------------------
 * Custom hook para obtener la lista de preguntas de entrevista.
 *
 * Capa: HOOKS
 * -----------
 * Los hooks conectan la capa DATA con la UI.
 * Usan React Query para manejar el ciclo de vida completo:
 *   cache → loading → error → data → refetch
 *
 * Estrategia "Divide y Vencerás":
 *   Un hook por recurso. Este hook solo sabe de preguntas.
 *   No mezcles lógica de auth, perfil u otros recursos acá.
 *
 * ¿Por qué React Query y no useEffect + useState?
 *   - Cache automático: si ya cargó, no vuelve a pedir al servidor
 *   - Deduplicación: 3 componentes que usan este hook → 1 solo fetch
 *   - Retry automático en errores de red
 *   - Refetch inteligente al volver a la pantalla
 *   - Estados isLoading / isError / data manejados solos
 */

import { useQuery } from '@tanstack/react-query';
import { fetchQuestions } from '@/src/data/api/questions-api';
import type { Question } from '@/src/domain/question';

/** Query key única para el cache de React Query */
const QUESTIONS_QUERY_KEY = ['questions'] as const;

/**
 * Hook para obtener todas las preguntas de entrevista.
 *
 * Uso:
 * ```tsx
 * const { questions, isLoading, isError, error, refetch } = useQuestions();
 *
 * // Condicional con && (sin if innecesario):
 * isLoading && <ActivityIndicator />;
 *
 * // Condicional ternario:
 * isError ? <ErrorView /> : <QuestionsList questions={questions} />;
 * ```
 */
export const useQuestions = () => {
  const query = useQuery<Question[], Error>({
    queryKey: QUESTIONS_QUERY_KEY,
    queryFn: fetchQuestions,
  });

  return {
    /** Lista de preguntas (undefined mientras carga por primera vez) */
    questions: query.data,
    /** true durante el fetch inicial (sin datos en cache) */
    isLoading: query.isLoading,
    /** true si el fetch falló después de los reintentos */
    isError: query.isError,
    /** Objeto Error con el mensaje (null si no hubo error) */
    error: query.error,
    /** Fuerza un refetch manual (útil en pantalla de error) */
    refetch: query.refetch,
  };
};

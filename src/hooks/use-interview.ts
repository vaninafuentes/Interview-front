/**
 * src/hooks/use-interview.ts
 * --------------------------
 * Custom hook para enviar una respuesta de entrevista y recibir el feedback de la IA.
 *
 * Capa: HOOKS
 * -----------
 * Usa useMutation de React Query (no useQuery, porque es una acción del usuario,
 * no una carga de datos automática).
 *
 * ¿Por qué useMutation y no useQuery?
 *   - useQuery → lectura de datos (GET): se ejecuta automáticamente
 *   - useMutation → acción del usuario (POST/PUT/DELETE): se ejecuta manualmente
 *
 * Flujo:
 *   1. El usuario escribe su respuesta
 *   2. Llama a submitAnswer(questionId, userAnswer)
 *   3. El hook dispara el POST al backend
 *   4. Retorna isPending (spinner), isError (error), data (feedback)
 */

import { useMutation } from '@tanstack/react-query';
import { submitInterviewAnswer } from '@/src/data/api/interview-api';
import type { InterviewAnswerRequest, InterviewFeedbackResponse } from '@/src/domain/interview';

/**
 * Hook para enviar la respuesta del usuario y obtener el feedback de Grok AI.
 *
 * Uso:
 * ```tsx
 * const { submitAnswer, isPending, feedback, isError, reset } = useInterview();
 *
 * // Cuando el usuario presiona "Enviar":
 * submitAnswer({ questionId: 1, userAnswer: "Mi respuesta..." });
 *
 * // Mientras espera:
 * isPending && <ActivityIndicator />
 *
 * // Cuando llega el feedback:
 * feedback && <FeedbackCard data={feedback} />
 * ```
 */
export const useInterview = () => {
  const mutation = useMutation<InterviewFeedbackResponse, Error, InterviewAnswerRequest>({
    mutationFn: submitInterviewAnswer,
  });

  return {
    /** Envía la respuesta del usuario al backend para evaluación */
    submitAnswer: mutation.mutate,
    /** true mientras la API está procesando la respuesta */
    isPending: mutation.isPending,
    /** true si ocurrió un error en la evaluación */
    isError: mutation.isError,
    /** El error ocurrido (null si no hubo error) */
    error: mutation.error,
    /** El feedback de la IA (undefined si aún no se recibió) */
    feedback: mutation.data,
    /** Resetea el estado del mutation (para limpiar entre preguntas) */
    reset: mutation.reset,
  };
};

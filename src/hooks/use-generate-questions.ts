/**
 * src/hooks/use-generate-questions.ts
 * ------------------------------------
 * Custom hook para generar preguntas de entrevista via Groq AI.
 *
 * Usa useMutation porque es una acción iniciada por el usuario,
 * no una carga automática de datos.
 */

import { useMutation } from '@tanstack/react-query';
import { generateInterviewQuestions } from '@/src/data/api/interview-api';
import type { QuestionGenerationRequest, GeneratedQuestion } from '@/src/domain/interview';

export const useGenerateQuestions = () => {
  const mutation = useMutation<GeneratedQuestion[], Error, QuestionGenerationRequest>({
    mutationFn: generateInterviewQuestions,
  });

  return {
    /** Dispara la generación de preguntas */
    generate: mutation.mutate,
    /** true mientras Groq está generando */
    isPending: mutation.isPending,
    /** true si hubo error */
    isError: mutation.isError,
    /** El error (null si no hubo) */
    error: mutation.error,
    /** Las preguntas generadas (undefined hasta que llegan) */
    questions: mutation.data,
    /** Resetea el estado del mutation */
    reset: mutation.reset,
  };
};

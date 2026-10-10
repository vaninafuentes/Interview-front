/**
 * src/data/api/interview-api.ts
 * -----------------------------
 * Funciones de acceso a la API de entrevistas.
 */

import { axiosClient } from '@/src/lib/axios';
import { API_ENDPOINTS } from '@/src/constants/api';
import type {
  InterviewAnswerRequest,
  InterviewFeedbackResponse,
  QuestionGenerationRequest,
  GeneratedQuestion,
} from '@/src/domain/interview';

/**
 * Genera preguntas de entrevista usando Groq AI.
 * Endpoint: POST /api/interview/generate
 *
 * @param request - topic, difficulty, count
 * @returns lista de preguntas generadas
 */
export const generateInterviewQuestions = (
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> =>
  axiosClient
    .post<GeneratedQuestion[]>(API_ENDPOINTS.interview.generate, request)
    .then((res) => res.data);

/**
 * Envía la respuesta del usuario al backend para evaluación con Groq AI.
 * Endpoint: POST /api/interview/evaluate
 *
 * @param request - datos de la pregunta (id o texto) + respuesta del usuario
 * @returns feedback de la IA
 */
export const submitInterviewAnswer = (
  request: InterviewAnswerRequest
): Promise<InterviewFeedbackResponse> =>
  axiosClient
    .post<InterviewFeedbackResponse>(API_ENDPOINTS.interview.evaluate, request)
    .then((res) => res.data);

/**
 * Obtiene el historial de entrevistas del usuario autenticado.
 * Endpoint: GET /api/interview/history
 */
export const fetchInterviewHistory = (): Promise<import('@/src/domain/interview').InterviewHistoryItem[]> =>
  axiosClient
    .get<import('@/src/domain/interview').InterviewHistoryItem[]>(API_ENDPOINTS.interview.history)
    .then((res) => res.data);

/**
 * Obtiene las estadísticas acumuladas del usuario autenticado.
 * Endpoint: GET /api/interview/stats
 */
export const fetchInterviewStats = (): Promise<import('@/src/domain/interview').InterviewStats> =>
  axiosClient
    .get<import('@/src/domain/interview').InterviewStats>(API_ENDPOINTS.interview.stats)
    .then((res) => res.data);

/**
 * Solicita una pista para desbloquear al candidato durante una pregunta.
 * Endpoint: POST /api/interview/hint
 */
export const requestInterviewHint = (payload: {
  questionText: string;
  category?: string;
}): Promise<string> =>
  axiosClient
    .post<import('@/src/domain/interview').InterviewHintResponse>(API_ENDPOINTS.interview.hint, payload)
    .then((res) => res.data.hint);



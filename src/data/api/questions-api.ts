/**
 * src/data/api/questions-api.ts
 * -----------------------------
 * Funciones puras para llamar al endpoint de preguntas.
 *
 * Capa: DATA / API
 * ----------------
 * Esta capa es el único lugar que habla con el backend sobre preguntas.
 * Usa el axiosClient configurado en lib/axios.ts (Patrón Facade/Fachada).
 *
 * Reglas de esta capa:
 *   ✅ Solo funciones puras: input → HTTP → output tipado
 *   ✅ Usa axiosClient (nunca axios directamente)
 *   ✅ Usa constantes de API_ENDPOINTS (nunca strings hardcodeados)
 *   ✅ Retorna el tipo del dominio (Question)
 *   ❌ Sin lógica de UI, sin estados de React, sin efectos
 *   ❌ Sin clases - solo funciones
 *
 * Patrón "Divide y Vencerás":
 *   Cada recurso (questions, auth, etc.) tiene su propio archivo de API.
 *   No mezcles llamadas de distintos recursos en el mismo archivo.
 */

import { axiosClient } from '@/src/lib/axios';
import { API_ENDPOINTS } from '@/src/constants/api';
import type { Question } from '@/src/domain/question';

/**
 * Obtiene la lista completa de preguntas de entrevista.
 * Endpoint: GET /api/questions
 *
 * @returns Promise con el array de preguntas tipadas
 */
export const fetchQuestions = (): Promise<Question[]> =>
  axiosClient.get<Question[]>(API_ENDPOINTS.questions.getAll).then((res) => res.data);

/**
 * Obtiene una pregunta específica por su ID.
 * Endpoint: GET /api/questions/:id
 *
 * @param id - Identificador único de la pregunta
 * @returns Promise con la pregunta encontrada
 */
export const fetchQuestionById = (id: number): Promise<Question> =>
  axiosClient.get<Question>(API_ENDPOINTS.questions.getById(id)).then((res) => res.data);

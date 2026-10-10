/**
 * src/domain/interview.ts
 * -----------------------
 * Tipos del dominio para la funcionalidad de práctica de entrevistas.
 */

/** Pregunta generada dinámicamente por Groq AI (sin ID de BD) */
export type GeneratedQuestion = {
  text: string;
  category: string;
  difficulty: string;
};

/** Solicitud al backend para generar preguntas */
export type QuestionGenerationRequest = {
  topic: string;
  difficulty: string;
  count: number;
};

/** Configuración elegida por el usuario en la pantalla de setup */
export type InterviewSetupConfig = {
  topic: string;
  difficulty: string;
  count: number;
};

/** Solicitud al backend para evaluar la respuesta del usuario */
export type InterviewAnswerRequest =
  | {
      /** Modo 1: pregunta de BD */
      questionId: number;
      userAnswer: string;
    }
  | {
      /** Modo 2: pregunta generada por IA */
      questionText: string;
      questionCategory: string;
      questionDifficulty: string;
      userAnswer: string;
    };

/** Puntuaciones individuales por criterio de evaluación */
export type InterviewCriteria = {
  technicalKnowledge: number;
  relevance: number;
  clarity: number;
  communication: number;
  structure: number;
};

/** Respuesta del backend con el feedback de Groq AI */
export type InterviewFeedbackResponse = {
  score: number;
  criteria: InterviewCriteria;
  strengths: string[];
  mistakes: string[];
  recommendations: string[];
  feedback: string;
  modelAnswer?: string;
};

/** Ítem del historial de prácticas */
export type InterviewHistoryItem = {
  id: number;
  questionId?: number;
  questionText: string;
  category: string;
  difficulty: string;
  userAnswer: string;
  feedback: string;
  score: number;
  tips: string[];
  modelAnswer?: string;
  answeredAt: string;
};

/** Estadísticas agregadas del usuario */
export type InterviewStats = {
  totalSessions: number;
  averageScore: number;
  currentStreak: number;
  bestScore: number;
  categoryAverages: Record<string, number>;
  recentSessions: InterviewHistoryItem[];
};

/** Respuesta del endpoint de pistas */
export type InterviewHintResponse = {
  hint: string;
};

/** Estado de una sesión de práctica de entrevista en el frontend */
export type InterviewSessionState =
  | 'setup'       // El usuario configura el tema y dificultad
  | 'generating'  // Groq está generando las preguntas
  | 'answering'   // El usuario está respondiendo
  | 'evaluating'  // Esperando el feedback de la IA
  | 'feedback'    // Mostrando el feedback
  | 'complete';   // Todas las preguntas respondidas


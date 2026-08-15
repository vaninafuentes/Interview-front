/**
 * src/domain/question.ts
 * ----------------------
 * Modelo de dominio: Pregunta de entrevista.
 *
 * Capa: DOMAIN
 * ------------
 * El dominio define las entidades del negocio. Son interfaces/tipos puros
 * que no dependen de ninguna librería externa (ni Axios, ni React, nada).
 *
 * Espejo del modelo Question.java del backend:
 *   - id         → Long   (backend) → number (TypeScript)
 *   - text       → String (backend) → string (TypeScript)
 *   - category   → String (backend) → string (TypeScript)
 *   - difficulty → String (backend) → string (TypeScript)
 *
 * Tip: mantener estos tipos sincronizados con el backend garantiza
 * que Axios y React Query tipan correctamente las respuestas.
 */

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type Question = {
  /** Identificador único auto-generado por el backend */
  id: number;
  /** Texto completo de la pregunta de entrevista */
  text: string;
  /** Categoría: "Java", "React", "SQL", "Algoritmos", etc. */
  category: string;
  /** Nivel de dificultad */
  difficulty: QuestionDifficulty;
};

/**
 * src/domain/cv.ts
 * ----------------
 * Modelo de dominio: análisis del CV (currículum) con IA.
 *
 * Capa: DOMAIN
 * ------------
 * Tipos puros sin dependencias externas (ni Axios, ni React, nada).
 * Espejan el DTO que devuelve el backend en POST /api/cv/analyze:
 *
 *   CvAnalysisResponse.java → { role, seniority, skills, summary }
 *
 *   - role      → String   (backend) → string   (TypeScript)
 *   - seniority → String   (backend) → string   (TypeScript)
 *   - skills    → List     (backend) → string[] (TypeScript)
 *   - summary   → String   (backend) → string   (TypeScript)
 */

export type CvAnalysisResponse = {
  /** Puesto o rol detectado en el CV (ej: "Desarrollador Backend") */
  role: string;
  /** Seniority detectado (ej: "Semi Senior") */
  seniority: string;
  /** Habilidades / tecnologías detectadas en el CV */
  skills: string[];
  /** Resumen profesional generado por la IA a partir del CV */
  summary: string;
};

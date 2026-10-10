/**
 * app/(tabs)/interview.tsx
 * ------------------------
 * Ruta del tab "Entrevista" en Expo Router.
 * Solo importa y re-exporta InterviewScreen.
 *
 * Separación de capas:
 *   - app/(tabs)/interview.tsx → punto de entrada de la ruta (Expo Router)
 *   - src/screens/interview/interview-screen.tsx → lógica real
 *   - src/screens/interview/interview-view.tsx → UI pura
 */

import InterviewScreen from '@/src/screens/interview/interview-screen';

export default InterviewScreen;

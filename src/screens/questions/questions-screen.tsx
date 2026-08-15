/**
 * src/screens/questions/questions-screen.tsx
 * -------------------------------------------
 * Contenedor lógico de la pantalla de preguntas.
 *
 * Patrón Screen + View:
 * QuestionsScreen = LÓGICA
 * QuestionsView   = UI pura
 *
 * Responsabilidades de este archivo:
 *   1. Obtener datos con useQuestions() (hook → React Query → Axios → API)
 *   2. Definir el handler de presionar una pregunta
 *   3. Pasar todo a QuestionsView como props
 *
 * Flujo de datos (de abajo hacia arriba):
 *   Backend → Axios (lib/) → questions-api (data/) → useQuestions (hooks/) → QuestionsScreen → QuestionsView
 */

import { useQuestions } from '@/src/hooks/use-questions';
import { QuestionsView } from './questions-view';
import type { Question } from '@/src/domain/question';

export default function QuestionsScreen() {
  const { questions, isLoading, isError, error, refetch } = useQuestions();

  // Handler: qué hacer cuando el usuario presiona una pregunta
  // Por ahora loguea; luego se conectará a la navegación
  const handleQuestionPress = (question: Question) => {
    // TODO: router.push(`/questions/${question.id}`)
    console.log('[QuestionsScreen] Pregunta seleccionada:', question.id);
  };

  return (
    <QuestionsView
      questions={questions}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      onRetry={refetch}
      onQuestionPress={handleQuestionPress}
    />
  );
}

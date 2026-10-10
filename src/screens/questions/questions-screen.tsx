/**
 * src/screens/questions/questions-screen.tsx
 * -------------------------------------------
 * Contenedor lógico de la pantalla de banco de preguntas.
 */

import { useRouter } from 'expo-router';
import { useQuestions } from '@/src/hooks/use-questions';
import { QuestionsView } from './questions-view';
import type { Question } from '@/src/domain/question';

export default function QuestionsScreen() {
  const router = useRouter();
  const { questions, isLoading, isError, error, refetch } = useQuestions();

  /** Al presionar una pregunta, inicia una sesión de práctica inmediata con ella */
  const handleQuestionPress = (question: Question) => {
    router.push({
      pathname: '/(tabs)/interview',
      params: {
        questionText: question.text,
        category: question.category,
        difficulty: question.difficulty,
        questionId: question.id.toString(),
      },
    });
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

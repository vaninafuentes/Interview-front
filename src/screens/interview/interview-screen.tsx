/**
 * src/screens/interview/interview-screen.tsx
 * --------------------------------------------
 * Contenedor lógico de la pantalla de práctica de entrevista.
 *
 * Flujo de estados:
 *   1. 'setup'      → el usuario elige tema, dificultad y cantidad
 *   2. 'generating' → Groq genera las preguntas (spinner en SetupView)
 *   3. 'answering'  → el usuario responde con timer y soporte de audio/texto
 *   4. 'evaluating' → Groq evalúa con rubric de 5 dimensiones
 *   5. 'feedback'   → feedback granular + Respuesta Modelo Senior
 *   6. 'complete'   → Scorecard final consolidado con Job Readiness Score
 */

import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerateQuestions } from '@/src/hooks/use-generate-questions';
import { useInterview } from '@/src/hooks/use-interview';
import { requestInterviewHint } from '@/src/data/api/interview-api';
import { INTERVIEW_STATS_QUERY_KEY } from '@/src/hooks/use-interview-stats';
import { INTERVIEW_HISTORY_QUERY_KEY } from '@/src/hooks/use-interview-history';
import { InterviewSetupView } from './InterviewSetupView';
import { InterviewView } from './interview-view';
import type {
  GeneratedQuestion,
  InterviewSetupConfig,
  InterviewSessionState,
  InterviewFeedbackResponse,
} from '@/src/domain/interview';
import { useTranslation } from 'react-i18next';

export type SessionQuestionResult = {
  question: GeneratedQuestion;
  userAnswer: string;
  feedback: InterviewFeedbackResponse;
};

const DEFAULT_TIME_SECONDS = 120; // 2 minutos por pregunta

export default function InterviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    questionText?: string;
    category?: string;
    difficulty?: string;
    questionId?: string;
  }>();

  // Preguntas y control de sesión
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionState, setSessionState] = useState<InterviewSessionState>('setup');
  const [userAnswer, setUserAnswer] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  // Registro de resultados acumulados de toda la sesión
  const [sessionResults, setSessionResults] = useState<SessionQuestionResult[]>([]);

  // Pista inteligente (Hint)
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  // Cronómetro interactivo de respuesta
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_SECONDS);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  // Hook para generar preguntas via Groq
  const {
    generate,
    isPending: isGenerating,
    isError: isGenError,
    error: genError,
    questions: generatedQuestions,
    reset: resetGen,
  } = useGenerateQuestions();

  // Hook para evaluar respuestas via Groq
  const {
    submitAnswer,
    isPending: isEvaluating,
    feedback,
    isError: isEvalError,
    reset: resetEval,
  } = useInterview();

  // Detección de pregunta directa iniciada desde el Banco de Preguntas
  useEffect(() => {
    if (params.questionText && sessionState === 'setup') {
      const directQuestion: GeneratedQuestion = {
        text: params.questionText,
        category: params.category || 'General',
        difficulty: params.difficulty || 'MEDIUM',
      };
      setQuestions([directQuestion]);
      setCurrentIndex(0);
      setUserAnswer('');
      setHint(null);
      setTimeLeft(DEFAULT_TIME_SECONDS);
      setSessionResults([]);
      setSessionState('answering');
    }
  }, [params.questionText]);

  // Cuando Groq devuelve las preguntas generadas → pasar a 'answering'
  useEffect(() => {
    if (generatedQuestions && generatedQuestions.length > 0) {
      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setSessionResults([]);
      setUserAnswer('');
      setHint(null);
      setTimeLeft(DEFAULT_TIME_SECONDS);
      setSessionState('answering');
    }
  }, [generatedQuestions]);

  // Timer: cuenta regresiva durante la respuesta
  useEffect(() => {
    if (sessionState !== 'answering' || isPaused || !isTimerEnabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState, isPaused, isTimerEnabled]);

  // Máquina de estados de evaluación y almacenamiento de resultado
  useEffect(() => {
    if (isEvaluating) {
      setSessionState('evaluating');
    } else if (feedback) {
      setSessionState('feedback');
      const current = questions[currentIndex];
      if (current) {
        setSessionResults((prev) => {
          const alreadySaved = prev.some((r) => r.question.text === current.text);
          if (alreadySaved) return prev;
          return [
            ...prev,
            {
              question: current,
              userAnswer,
              feedback,
            },
          ];
        });
      }
    } else if (isEvalError) {
      setSessionState('answering');
    }
  }, [isEvaluating, feedback, isEvalError]);

  /** Iniciar nueva sesión configurada */
  const handleStart = (config: InterviewSetupConfig) => {
    resetGen();
    resetEval();
    setSessionResults([]);
    setHint(null);
    setTimeLeft(DEFAULT_TIME_SECONDS);
    setSessionState('generating');
    generate(config);
  };

  /** Enviar respuesta del usuario */
  const handleSubmit = () => {
    if (!userAnswer.trim() || questions.length === 0) return;
    const current = questions[currentIndex];
    submitAnswer({
      questionText: current.text,
      questionCategory: current.category,
      questionDifficulty: current.difficulty,
      userAnswer: userAnswer.trim(),
    });
  };

  /** Recibir texto transcripto por voz */
  const handleTranscriptReady = (text: string) => {
    setUserAnswer(text);
  };

  /** Solicitar pista orientativa para la pregunta actual */
  const handleAskHint = async () => {
    if (isHintLoading || questions.length === 0) return;
    const current = questions[currentIndex];
    setIsHintLoading(true);
    try {
      const responseHint = await requestInterviewHint({
        questionText: current.text,
        category: current.category,
      });
      setHint(responseHint);
    } catch {
      setHint(t('interview.hint_fallback'));
    } finally {
      setIsHintLoading(false);
    }
  };

  /** Avanzar a la siguiente pregunta o finalizar la sesión */
  const handleNext = () => {
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      setSessionState('complete');
      // Invalidar cache para que estadísticas y perfil se refresquen automáticamente
      queryClient.invalidateQueries({ queryKey: INTERVIEW_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTERVIEW_HISTORY_QUERY_KEY });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setHint(null);
      setTimeLeft(DEFAULT_TIME_SECONDS);
      setSessionState('answering');
      resetEval();
    }
  };

  /** Reiniciar y volver a la configuración */
  const handleStartOver = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswer('');
    setHint(null);
    setTimeLeft(DEFAULT_TIME_SECONDS);
    setSessionResults([]);
    setIsPaused(false);
    setSessionState('setup');
    resetGen();
    resetEval();
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);
  const handleAddExtraTime = () => setTimeLeft((prev) => prev + 30);

  // ── Setup / Generating / Paused ──────────────────────────────────────────
  if (sessionState === 'setup' || sessionState === 'generating' || isPaused) {
    return (
      <InterviewSetupView
        onStart={(config) => {
          setIsPaused(false);
          handleStart(config);
        }}
        isGenerating={isGenerating}
        generationError={
          isGenError ? (genError?.message ?? t('interview.error_generating')) : null
        }
        hasActiveSession={questions.length > 0 && sessionState !== 'complete'}
        onResume={handleResume}
      />
    );
  }

  // ── Entrevista activa / Feedback / Reporte final ──────────────────────────
  return (
    <InterviewView
      questions={questions}
      currentIndex={currentIndex}
      sessionState={sessionState}
      userAnswer={userAnswer}
      feedback={feedback}
      isError={isEvalError}
      hint={hint}
      isHintLoading={isHintLoading}
      timeLeft={timeLeft}
      isTimerEnabled={isTimerEnabled}
      sessionResults={sessionResults}
      onAnswerChange={setUserAnswer}
      onTranscriptReady={handleTranscriptReady}
      onAskHint={handleAskHint}
      onDismissHint={() => setHint(null)}
      onToggleTimer={() => setIsTimerEnabled((prev) => !prev)}
      onAddExtraTime={handleAddExtraTime}
      onSubmit={handleSubmit}
      onNext={handleNext}
      onStartOver={handleStartOver}
      onPause={handlePause}
      onGoToProfile={() => router.push('/(tabs)/profile')}
    />
  );
}

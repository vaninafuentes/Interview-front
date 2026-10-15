/**
 * src/screens/interview/interview-view.tsx
 * -----------------------------------------
 * Vista PURA de la pantalla de práctica de entrevista — Dark Mode Pro High-Tech.
 *
 * Estados visuales:
 *   1. answering  → Timer HUD llamativo + Pregunta + TTS + Pistas + Input texto/audio + Enviar
 *   2. evaluating → Núcleo de IA con pulso animado y fases dinámicas
 *   3. feedback   → Puntuación con barra de color + Criterios + Respuesta Modelo Senior
 *   4. complete   → Scorecard Final con Job Readiness Score y desglose
 */

import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { AudioRecorder } from './components/audio-recorder';
import { InterviewTimer } from './components/interview-timer';
import { AiEvaluatingOrb } from './components/ai-evaluating-orb';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import type {
  GeneratedQuestion,
  InterviewFeedbackResponse,
  InterviewSessionState,
} from '@/src/domain/interview';
import type { SessionQuestionResult } from './interview-screen';
import { useTranslation } from 'react-i18next';

type InterviewViewProps = {
  questions: GeneratedQuestion[];
  currentIndex: number;
  sessionState: InterviewSessionState;
  userAnswer: string;
  feedback: InterviewFeedbackResponse | undefined;
  isError: boolean;
  hint: string | null;
  isHintLoading: boolean;
  timeLeft: number;
  isTimerEnabled: boolean;
  sessionResults: SessionQuestionResult[];
  onAnswerChange: (text: string) => void;
  onTranscriptReady: (text: string) => void;
  onAskHint: () => void;
  onDismissHint: () => void;
  onToggleTimer: () => void;
  onAddExtraTime?: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onStartOver: () => void;
  onPause: () => void;
  onGoToProfile: () => void;
};

export const InterviewView = ({
  questions,
  currentIndex,
  sessionState,
  userAnswer,
  feedback,
  isError,
  hint,
  isHintLoading,
  timeLeft,
  isTimerEnabled,
  sessionResults,
  onAnswerChange,
  onTranscriptReady,
  onAskHint,
  onDismissHint,
  onToggleTimer,
  onAddExtraTime,
  onSubmit,
  onNext,
  onStartOver,
  onPause,
  onGoToProfile,
}: InterviewViewProps) => {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedResultIndex, setExpandedResultIndex] = useState<number | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Detener voz cuando cambie la pregunta o el estado
  useEffect(() => {
    Speech.stop().catch(() => {});
    setIsSpeaking(false);
  }, [currentIndex, sessionState]);

  // Listener para saber cuándo el teclado móvil está activo
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Text-to-Speech nativo (iOS, Android y Web) para reproducir la consigna
  const handleSpeakQuestion = async () => {
    try {
      const isSpeakingNow = await Speech.isSpeakingAsync();
      if (isSpeakingNow || isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      Speech.speak(currentQuestion?.text || '', {
        language: 'es-ES',
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      // Fallback a SpeechSynthesis en navegador web si Speech falla
      if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
        const synth = (window as any).speechSynthesis;
        if (isSpeaking) {
          synth.cancel();
          setIsSpeaking(false);
          return;
        }
        const utterance = new (window as any).SpeechSynthesisUtterance(currentQuestion?.text || '');
        utterance.lang = 'es-ES';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synth.cancel();
        setIsSpeaking(true);
        synth.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    }
  };

  // Estado: sin preguntas disponibles
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={styles.stateTitle}>{t('interview.no_questions')}</Text>
          <Text style={styles.stateMessage}>
            {t('interview.no_questions_setup_msg')}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onStartOver}>
            <Text style={styles.primaryButtonText}>{t('interview.configure_practice')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== ESTADO: SESIÓN COMPLETA (SCORECARD FINAL) =====
  if (sessionState === 'complete') {
    const totalAnswered = sessionResults.length;
    const avgScore =
      totalAnswered > 0
        ? Math.round(
            (sessionResults.reduce((acc, curr) => acc + curr.feedback.score, 0) / totalAnswered) *
              10
          ) / 10
        : 8.0;

    let readinessTitle = t('interview.readiness_ready_title');
    let readinessBadgeColor: string = Colors.success;
    let readinessDesc = t('interview.readiness_ready_desc');

    if (avgScore >= 8.5) {
      readinessTitle = t('interview.readiness_excellent_title');
      readinessBadgeColor = Colors.primary;
      readinessDesc = t('interview.readiness_excellent_desc');
    } else if (avgScore >= 6.5) {
      readinessTitle = t('interview.readiness_solid_title');
      readinessBadgeColor = Colors.warning;
      readinessDesc = t('interview.readiness_solid_desc');
    } else {
      readinessTitle = t('interview.readiness_practice_title');
      readinessBadgeColor = Colors.error;
      readinessDesc = t('interview.readiness_practice_desc');
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Scorecard */}
          <View style={styles.scorecardHero}>
            <Text style={styles.scorecardEmoji}>🏆</Text>
            <Text style={styles.scorecardTitle}>{t('interview.performance_report')}</Text>
            <Text style={styles.scorecardSubtitle}>
              {t('interview.session_summary', { count: totalAnswered })}
            </Text>

            <View style={styles.scorecardBadgeContainer}>
              <View
                style={[
                  styles.readinessPill,
                  { backgroundColor: readinessBadgeColor + '20', borderColor: readinessBadgeColor },
                ]}
              >
                <Text style={[styles.readinessPillText, { color: readinessBadgeColor }]}>
                  {readinessTitle}
                </Text>
              </View>
            </View>

            <View style={styles.scorecardScoreCircle}>
              <Text style={styles.scorecardBigNumber}>{avgScore}</Text>
              <Text style={styles.scorecardOutOf}>/10</Text>
            </View>
            <Text style={styles.scorecardDesc}>{readinessDesc}</Text>
          </View>

          {/* Desglose de preguntas respondidas */}
          <Text style={styles.sectionTitle}>{t('interview.questions_breakdown')}</Text>
          {sessionResults.map((item, idx) => {
            const isExpanded = expandedResultIndex === idx;
            return (
              <View key={idx} style={styles.resultItemCard}>
                <TouchableOpacity
                  style={styles.resultItemHeader}
                  activeOpacity={0.7}
                  onPress={() => setExpandedResultIndex(isExpanded ? null : idx)}
                >
                  <View style={styles.resultItemMeta}>
                    <Text style={styles.resultItemNumber}>#{idx + 1}</Text>
                    <View style={styles.resultItemTextContainer}>
                      <Text style={styles.resultItemQuestion} numberOfLines={isExpanded ? undefined : 2}>
                        {item.question.text}
                      </Text>
                      <Text style={styles.resultItemCategory}>
                        {item.question.category} • {item.question.difficulty}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultItemScoreBadge}>
                    <Text style={styles.resultItemScoreText}>{item.feedback.score}/10</Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.resultItemBody}>
                    <Text style={styles.resultSubLabel}>{t('interview.your_answer')}</Text>
                    <Text style={styles.resultAnswerText}>{item.userAnswer}</Text>

                    <Text style={[styles.resultSubLabel, { marginTop: 12 }]}>
                      {t('interview.feedback_label')}
                    </Text>
                    <Text style={styles.resultFeedbackText}>{item.feedback.feedback}</Text>

                    {item.feedback.modelAnswer && (
                      <View style={styles.resultModelCard}>
                        <View style={styles.modelHeader}>
                          <Feather name="award" size={16} color={Colors.primary} />
                          <Text style={styles.resultModelTitle}>
                            {t('interview.model_answer_suggested')}
                          </Text>
                        </View>
                        <Text style={styles.resultModelText}>{item.feedback.modelAnswer}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.scorecardActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onStartOver}>
              <Text style={styles.primaryButtonText}>{t('interview.start_over')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onGoToProfile}>
              <Text style={styles.secondaryButtonText}>{t('interview.view_profile_streak')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== ESTADO: SIMULACRO EN CURSO =====
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentWithKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Barra superior de navegación */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
              <Feather name="arrow-left" size={16} color={Colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.pauseButtonText}>{t('interview.exit')}</Text>
            </TouchableOpacity>

            <View style={styles.progressPill}>
              <Text style={styles.progressText}>
                {t('interview.question_of', {
                  current: currentIndex + 1,
                  total: questions.length,
                })}
              </Text>
            </View>
          </View>

          {/* Barra de progreso de la sesión */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` as any },
              ]}
            />
          </View>

          {/* CRONÓMETRO HUD COMPACTO Y LLAMATIVO */}
          {sessionState === 'answering' && (
            <InterviewTimer
              timeLeft={timeLeft}
              totalTime={120}
              isTimerEnabled={isTimerEnabled}
              onToggleTimer={onToggleTimer}
              onAddExtraTime={onAddExtraTime}
            />
          )}

          {/* Banner de tiempo cumplido / prórroga orientativa */}
          {sessionState === 'answering' && timeLeft === 0 && (
            <View style={styles.timeoutBanner}>
              <View style={styles.timeoutBannerHeader}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.timeoutBannerTitle}>{t('interview.time_up_title')}</Text>
              </View>
              <Text style={styles.timeoutBannerText}>
                {userAnswer.trim().length > 0
                  ? t('interview.time_up_msg_with_answer')
                  : t('interview.time_up_msg_no_answer')}
              </Text>
              <View style={styles.timeoutBannerActions}>
                {onAddExtraTime && (
                  <TouchableOpacity style={styles.timeoutExtraBtn} onPress={onAddExtraTime}>
                    <Feather name="clock" size={13} color="#D97706" />
                    <Text style={styles.timeoutExtraText}>{t('interview.extra_time_30')}</Text>
                  </TouchableOpacity>
                )}
                {userAnswer.trim().length > 0 && (
                  <TouchableOpacity style={styles.timeoutSubmitBtn} onPress={onSubmit}>
                    <Feather name="send" size={13} color="#FFFFFF" />
                    <Text style={styles.timeoutSubmitText}>{t('interview.send_now')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Tarjeta de la Pregunta */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.categoryBadgeContainer}>
                <Text style={styles.questionCategory}>{currentQuestion?.category}</Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{currentQuestion?.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.questionText}>{currentQuestion?.text}</Text>

            {/* Acciones de la Pregunta: Escuchar por voz y Pedir pista */}
            <View style={styles.questionActionsBar}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={handleSpeakQuestion}
                activeOpacity={0.7}
              >
                <Feather
                  name={isSpeaking ? 'volume-x' : 'volume-2'}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.actionIconText}>
                  {isSpeaking ? t('interview.mute') : t('interview.listen_question')}
                </Text>
              </TouchableOpacity>

              {sessionState === 'answering' && (
                <TouchableOpacity
                  style={styles.actionIconButton}
                  onPress={onAskHint}
                  disabled={isHintLoading}
                  activeOpacity={0.7}
                >
                  {isHintLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Feather name="help-circle" size={16} color={Colors.primary} />
                  )}
                  <Text style={styles.actionIconText}>{t('interview.ask_hint')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Pista inteligente del Mentor */}
          {hint && sessionState === 'answering' && (
            <View style={styles.hintCard}>
              <View style={styles.hintHeader}>
                <View style={styles.hintTitleRow}>
                  <Feather name="zap" size={16} color={Colors.primary} />
                  <Text style={styles.hintTitle}>{t('interview.hint_title')}</Text>
                </View>
                <TouchableOpacity onPress={onDismissHint} hitSlop={10}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          )}

          {/* ===== ESTADO: EVALUANDO CON NÚCLEO IA ANIMADO ===== */}
          {sessionState === 'evaluating' && <AiEvaluatingOrb />}

          {/* ===== ESTADO: RESPONDIENDO ===== */}
          {sessionState === 'answering' && (
            <View style={styles.answerSection}>
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputHeaderLabel}>{t('interview.your_answer_label')}</Text>
                {isKeyboardVisible && (
                  <TouchableOpacity
                    style={styles.hideKeyboardPill}
                    onPress={() => Keyboard.dismiss()}
                    activeOpacity={0.7}
                  >
                    <Feather name="chevron-down" size={13} color={Colors.primary} />
                    <Text style={styles.hideKeyboardText}>{t('interview.hide_keyboard')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.textInput}
                value={userAnswer}
                onChangeText={onAnswerChange}
                placeholder={t('interview.answer_placeholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                editable={true}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
              />

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>{t('interview.or_voice_answer')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Grabador de voz con onda animada */}
              <AudioRecorder
                onTranscriptReady={onTranscriptReady}
                disabled={sessionState !== 'answering'}
              />

              {isError && (
                <Text style={styles.errorText}>{t('interview.error_evaluating')}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !userAnswer.trim() && styles.primaryButtonDisabled,
                ]}
                onPress={onSubmit}
                disabled={!userAnswer.trim()}
                activeOpacity={0.8}
              >
                <Feather name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>{t('interview.send_for_evaluation')}</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* ===== ESTADO: FEEDBACK ===== */}
        {sessionState === 'feedback' && feedback && (
          <View style={styles.feedbackSection}>
            {/* Calificación Global */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>{t('interview.answer_score_label')}</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{feedback.score}</Text>
                <Text style={styles.scoreOutOf}>/10</Text>
              </View>
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      width: `${feedback.score * 10}%` as any,
                      backgroundColor:
                        feedback.score >= 7
                          ? Colors.difficultyEasy
                          : feedback.score >= 4
                          ? Colors.difficultyMedium
                          : Colors.difficultyHard,
                    },
                  ]}
                />
              </View>
            </View>

            {/* RESPUESTA MODELO SENIOR (BENCHMARK) */}
            {feedback.modelAnswer && (
              <View style={styles.modelAnswerCard}>
                <View style={styles.modelAnswerHeader}>
                  <Feather name="award" size={20} color={Colors.primary} />
                  <Text style={styles.modelAnswerTitle}>
                    {t('interview.model_answer_recommended')}
                  </Text>
                </View>
                <Text style={styles.modelAnswerSubtitle}>
                  {t('interview.model_answer_subtitle')}
                </Text>
                <Text style={styles.modelAnswerContent}>{feedback.modelAnswer}</Text>
              </View>
            )}

            {/* Criterios de Evaluación en 5 Ejes */}
            {feedback.criteria && (
              <View style={styles.criteriaCard}>
                <Text style={styles.sectionTitle}>{t('interview.criteria_breakdown')}</Text>
                {([
                  [t('interview.criteria_technical'), feedback.criteria.technicalKnowledge],
                  [t('interview.criteria_relevance'), feedback.criteria.relevance],
                  [t('interview.criteria_clarity'), feedback.criteria.clarity],
                  [t('interview.criteria_communication'), feedback.criteria.communication],
                  [t('interview.criteria_structure'), feedback.criteria.structure],
                ] as [string, number][]).map(([label, value]) => (
                  <View key={label} style={styles.criteriaRow}>
                    <Text style={styles.criteriaLabel}>{label}</Text>
                    <View style={styles.criteriaMini}>
                      <View style={styles.criteriaMiniBar}>
                        <View
                          style={[
                            styles.criteriaMiniBarFill,
                            {
                              width: `${value * 10}%` as any,
                              backgroundColor:
                                value >= 7
                                  ? Colors.difficultyEasy
                                  : value >= 4
                                  ? Colors.difficultyMedium
                                  : Colors.difficultyHard,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.criteriaScore}>{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Resumen */}
            <View style={styles.feedbackCard}>
              <Text style={styles.sectionTitle}>{t('interview.feedback_general')}</Text>
              <Text style={styles.feedbackText}>{feedback.feedback}</Text>
            </View>

            {/* Fortalezas */}
            {feedback.strengths && feedback.strengths.length > 0 && (
              <View style={styles.strengthsCard}>
                <Text style={styles.sectionTitle}>{t('interview.strengths_title')}</Text>
                {feedback.strengths.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Errores */}
            {feedback.mistakes && feedback.mistakes.length > 0 && (
              <View style={styles.mistakesCard}>
                <Text style={styles.sectionTitle}>{t('interview.improvements_title')}</Text>
                {feedback.mistakes.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Consejos Accionables */}
            {feedback.recommendations && feedback.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.sectionTitle}>{t('interview.recommendations_title')}</Text>
                {feedback.recommendations.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Botón siguiente */}
            <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>
                {isLastQuestion
                  ? t('interview.view_final_results')
                  : t('interview.next_question')}
              </Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  scrollContentWithKeyboard: {
    paddingBottom: 260,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emoji: {
    fontSize: 56,
  },
  stateTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // --- Barra de progreso ---
  progressBar: {
    height: 6,
    backgroundColor: '#E0E7FF',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },

  // --- Tarjeta de pregunta ---
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadgeContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  questionCategory: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  difficultyBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  questionText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginTop: 4,
  },
  questionActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // --- Hint Card ---
  hintCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // --- Banner de tiempo agotado ---
  timeoutBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    gap: 6,
  },
  timeoutBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeoutBannerTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeoutBannerText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  timeoutBannerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  timeoutExtraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timeoutExtraText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  timeoutSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  timeoutSubmitText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // --- Respuesta ---
  answerSection: {
    gap: Spacing.md,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -4,
  },
  inputHeaderLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  hideKeyboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  hideKeyboardText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 110,
    lineHeight: 22,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },

  // --- Botones ---
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // --- Feedback ---
  feedbackSection: {
    gap: Spacing.md,
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primary,
  },
  scoreOutOf: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  // --- Model Answer Card ---
  modelAnswerCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
  },
  modelAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelAnswerTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modelAnswerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modelAnswerContent: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },

  // --- Criterios ---
  criteriaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  criteriaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: '600',
  },
  criteriaMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  criteriaMiniBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E7FF',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  criteriaMiniBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  criteriaScore: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primaryDark,
    width: 20,
    textAlign: 'right',
  },

  // --- Feedback ---
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  feedbackText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },

  strengthsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.difficultyEasy,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  mistakesCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.difficultyHard,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  recommendationsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  listBullet: {
    fontSize: FontSize.md,
    color: Colors.primaryDark,
    marginTop: 1,
  },
  listText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // --- Scorecard Final ---
  scorecardHero: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 8,
  },
  scorecardEmoji: {
    fontSize: 48,
  },
  scorecardTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scorecardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scorecardBadgeContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  readinessPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  readinessPillText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scorecardScoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  scorecardBigNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.primary,
  },
  scorecardOutOf: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  scorecardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  resultItemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  resultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  resultItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  resultItemNumber: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    width: 28,
  },
  resultItemTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  resultItemQuestion: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  resultItemCategory: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultItemScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultItemScoreText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  resultItemBody: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surfaceAlt,
  },
  resultSubLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultAnswerText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  resultFeedbackText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resultModelCard: {
    marginTop: 12,
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resultModelTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  resultModelText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  scorecardActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});

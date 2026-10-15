/**
 * src/components/question-card.tsx
 * ---------------------------------
 * Tarjeta para mostrar una pregunta en el banco interactivo.
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Question, QuestionDifficulty } from '@/src/domain/question';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type QuestionCardProps = {
  question: Question;
  onPress?: (question: Question) => void;
};

const DIFFICULTY_COLOR: Record<QuestionDifficulty, string> = {
  EASY: Colors.difficultyEasy,
  MEDIUM: Colors.difficultyMedium,
  HARD: Colors.difficultyHard,
};

export const QuestionCard = ({ question, onPress }: QuestionCardProps) => {
  const { t } = useTranslation();

  // Etiquetas de dificultad: definidas dentro del componente para poder usar t()
  const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = {
    EASY: t('questions.difficulty_easy'),
    MEDIUM: t('questions.difficulty_medium'),
    HARD: t('questions.difficulty_hard'),
  };

  const difficultyColor = DIFFICULTY_COLOR[question.difficulty as QuestionDifficulty] ?? Colors.textMuted;
  const difficultyLabel = DIFFICULTY_LABEL[question.difficulty as QuestionDifficulty] ?? question.difficulty;

  const content = (
    <View style={styles.card}>
      {/* Header: categoría + badge de dificultad */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.category}>{question.category}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20', borderColor: difficultyColor }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {difficultyLabel}
          </Text>
        </View>
      </View>

      {/* Texto de la pregunta */}
      <Text style={styles.questionText}>{question.text}</Text>

      {/* Footer: ID + Acción rápida */}
      <View style={styles.footer}>
        <Text style={styles.questionId}>#{question.id}</Text>
        <View style={styles.practiceCta}>
          <Text style={styles.practiceCtaText}>{t('questions.practice_now')}</Text>
          <Feather name="arrow-right" size={14} color={Colors.primary} />
        </View>
      </View>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={() => onPress(question)} activeOpacity={0.75} style={styles.wrapper}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.wrapper}>{content}</View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  category: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  questionText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  questionId: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  practiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  practiceCtaText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});

/**
 * src/components/question-card.tsx
 * ---------------------------------
 * Tarjeta reutilizable para mostrar una pregunta de entrevista.
 *
 * Patrón: Componente Composable (Composición por Props)
 * ------------------------------------------------------
 * Recibe la `question` como prop y la renderiza.
 * No sabe cómo se obtuvo la pregunta (eso lo sabe el hook).
 * No maneja ningún estado propio.
 *
 * La propiedad `onPress` es opcional: si no se pasa, la card no es presionable.
 * → Condicional con && para renderizar el wrapper correcto
 *
 * Uso:
 * ```tsx
 * <QuestionCard
 *   question={item}
 *   onPress={() => navigate(`/questions/${item.id}`)}
 * />
 * ```
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Question, QuestionDifficulty } from '@/src/domain/question';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';

type QuestionCardProps = {
  question: Question;
  onPress?: (question: Question) => void;
};

/** Mapeo de dificultad → color de badge (programación funcional: objeto como lookup table) */
const DIFFICULTY_COLOR: Record<QuestionDifficulty, string> = {
  EASY: Colors.difficultyEasy,
  MEDIUM: Colors.difficultyMedium,
  HARD: Colors.difficultyHard,
};

/** Mapeo de dificultad → texto en español */
const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
};

export const QuestionCard = ({ question, onPress }: QuestionCardProps) => {
  const difficultyColor = DIFFICULTY_COLOR[question.difficulty as QuestionDifficulty] ?? Colors.textMuted;
  const difficultyLabel = DIFFICULTY_LABEL[question.difficulty as QuestionDifficulty] ?? question.difficulty;

  const content = (
    <View style={styles.card}>
      {/* Header: categoría + badge de dificultad */}
      <View style={styles.header}>
        <Text style={styles.category}>{question.category}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '22' }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {difficultyLabel}
          </Text>
        </View>
      </View>

      {/* Texto de la pregunta */}
      <Text style={styles.questionText}>{question.text}</Text>

      {/* Footer: ID de la pregunta */}
      <Text style={styles.questionId}>#{question.id}</Text>
    </View>
  );

  // Condicional con ternario: si tiene onPress → TouchableOpacity, sino → View
  return onPress ? (
    <TouchableOpacity onPress={() => onPress(question)} activeOpacity={0.7} style={styles.wrapper}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.wrapper}>{content}</View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  questionText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  questionId: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

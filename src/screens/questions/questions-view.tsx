/**
 * src/screens/questions/questions-view.tsx
 * -----------------------------------------
 * Vista PURA de la pantalla de preguntas.
 *
 * Patrón Screen + View:
 * QuestionsScreen → datos del hook → QuestionsView → renderiza
 *
 * Aplica:
 *   ✅ Ternario en lugar de if/else anidados
 *   ✅ && para condicionales simples
 *   ✅ .map implícito via FlatList
 *   ✅ useTranslation para todos los textos (i18n)
 *   ✅ Composición: QuestionCard, AppButton como props/componentes hijos
 */

import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '@/src/components/question-card';
import { AppButton } from '@/src/components/app-button';
import { Colors, Spacing, FontSize } from '@/src/theme';
import type { Question } from '@/src/domain/question';

type QuestionsViewProps = {
  questions: Question[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  onRetry: () => void;
  onQuestionPress: (question: Question) => void;
};

export const QuestionsView = ({
  questions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onQuestionPress,
}: QuestionsViewProps) => {
  const { t } = useTranslation();

  // Ternario anidado para manejar los 4 estados de la UI:
  // loading → error → vacío → datos
  // Alternativa con condicionales de retorno temprano por legibilidad:
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('questions.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.stateTitle}>{t('questions.error_title')}</Text>
          <Text style={styles.stateMessage}>
            {errorMessage ?? t('questions.error_fallback')}
          </Text>
          <View style={styles.actionButton}>
            <AppButton title={t('questions.retry')} onPress={onRetry} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // && para el estado vacío: si no hay datos, muestra pantalla vacía
  const isEmpty = !questions || questions.length === 0;
  if (isEmpty) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={styles.stateTitle}>{t('questions.empty_title')}</Text>
          <Text style={styles.stateMessage}>{t('questions.empty_message')}</Text>
          <View style={styles.actionButton}>
            <AppButton title={t('questions.reload')} onPress={onRetry} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Estado feliz: hay datos → FlatList con QuestionCard
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('questions.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('questions.subtitle_other', { count: questions!.length })}
          </Text>
        </View>

        {/* Lista usando FlatList (internamente usa .map optimizado) */}
        <FlatList<Question>
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <QuestionCard question={item} onPress={onQuestionPress} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  stateTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stateMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 200,
  },
});

/**
 * src/screens/questions/questions-view.tsx
 * -----------------------------------------
 * Vista del banco de preguntas con filtro en tiempo real por búsqueda y categoría.
 */

import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '@/src/components/question-card';
import { AppButton } from '@/src/components/app-button';
import { BackButton } from '@/src/components/back-button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
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
  questions = [],
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onQuestionPress,
}: QuestionsViewProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Obtener categorías únicas presentes en las preguntas
  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [questions]);

  // Filtrar por término de búsqueda y categoría
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesCategory =
        selectedCategory === 'ALL' || q.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [questions, searchQuery, selectedCategory]);

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
            {errorMessage ?? t('questions.error_message')}
          </Text>
          <View style={styles.actionButton}>
            <AppButton title={t('questions.retry')} onPress={onRetry} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BackButton />
            <Text style={styles.headerTitle}>{t('questions.title')}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('questions.subtitle', { count: questions.length })}
          </Text>

          {/* Barra de búsqueda */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('questions.search_placeholder')}
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Chips de Categorías */}
          <View style={styles.categoriesRow}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(cat) => cat}
              contentContainerStyle={styles.categoryChipsContainer}
              renderItem={({ item: cat }) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat === 'ALL' ? t('questions.filter_all') : cat}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>

        {/* Lista de preguntas filtradas */}
        {filteredQuestions.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emoji}>🔍</Text>
            <Text style={styles.stateTitle}>{t('questions.empty_title')}</Text>
            <Text style={styles.stateMessage}>
              {t('questions.empty_message', { query: searchQuery })}
            </Text>
          </View>
        ) : (
          <FlatList<Question>
            data={filteredQuestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <QuestionCard question={item} onPress={onQuestionPress} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  categoriesRow: {
    marginBottom: 6,
  },
  categoryChipsContainer: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: Spacing.xl,
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
    fontWeight: '800',
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

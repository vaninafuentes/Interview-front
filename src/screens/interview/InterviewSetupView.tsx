/**
 * src/screens/interview/InterviewSetupView.tsx
 * ---------------------------------------------
 * Pantalla de configuración del simulacro de entrevista.
 *
 * Características (Estilo aiApply):
 *   - Tarjetas atractivas con iconos ilustrados en paleta armoniosa
 *   - Badges de categoría (Técnica, Método STAR, Simulacro 360°)
 *   - Lista de características incluidas por modalidad
 *   - Sugerencias rápidas de temas (chips de un toque)
 *   - Selección visual de dificultad y cantidad de preguntas
 */

import type { InterviewSetupConfig } from '@/src/domain/interview';
import { BorderRadius, Colors, FontSize, Spacing } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CategoryInfo = {
  id: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  defaultTopic: string;
  defaultCount: number;
  defaultDiff: string;
  quickTopics: string[];
  features: string[];
};

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'technical',
    badge: 'CONOCIMIENTOS CLAVE',
    badgeColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    title: 'Entrevista por puesto / rol',
    desc: 'Preguntas sobre responsabilidades del puesto, herramientas clave, casos prácticos y resolución de problemas cotidianos.',
    icon: 'briefcase',
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    defaultTopic: 'Atención al Cliente y Ventas',
    defaultCount: 8,
    defaultDiff: 'MEDIUM',
    quickTopics: ['Ventas y Comercial', 'Administración', 'Atención al Cliente', 'Marketing Digital', 'Recursos Humanos', 'Tecnología / IT'],
    features: ['Feedback inmediato', 'Respuesta modelo sugerida', 'Casos prácticos del rol'],
  },
  {
    id: 'behavioral',
    badge: 'COMPETENCIAS',
    badgeColor: '#BE185D',
    badgeBg: '#FDF4FF',
    title: 'Habilidades blandas y conducta',
    desc: 'Situaciones de trabajo en equipo, resolución de conflictos, adaptabilidad, comunicación asertiva y toma de decisiones.',
    icon: 'users',
    iconColor: '#EC4899',
    iconBg: '#FDF4FF',
    defaultTopic: 'Liderazgo y trabajo en equipo',
    defaultCount: 5,
    defaultDiff: 'MEDIUM',
    quickTopics: ['Trabajo en equipo', 'Resolución de conflictos', 'Liderazgo', 'Presión y plazos', 'Comunicación asertiva'],
    features: ['Resolución de conflictos', 'Comunicación asertiva', 'Claridad al responder'],
  },
  {
    id: 'mock',
    badge: 'SIMULACIÓN INTEGRAL',
    badgeColor: '#047857',
    badgeBg: '#ECFDF5',
    title: 'Simulacro de entrevista completa',
    desc: 'Simulación integral de un proceso de selección: preguntas del puesto + preguntas de comportamiento con reporte final de desempeño.',
    icon: 'award',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    defaultTopic: 'Puesto a elección',
    defaultCount: 10,
    defaultDiff: 'HARD',
    quickTopics: ['Área Comercial', 'Administración / Finanzas', 'Coordinación de Equipo', 'Profesional Técnico'],
    features: ['Evaluación integral', 'Reporte con puntaje', 'Tiempo cronometrado'],
  },
];

const DIFFICULTIES = [
  { label: 'Fácil', value: 'EASY', color: Colors.difficultyEasy, bg: '#ECFDF5' },
  { label: 'Medio', value: 'MEDIUM', color: Colors.difficultyMedium, bg: '#FFFBEB' },
  { label: 'Difícil', value: 'HARD', color: Colors.difficultyHard, bg: '#FEF2F2' },
];

const COUNTS = [5, 8, 10];

type Props = {
  onStart: (config: InterviewSetupConfig) => void;
  isGenerating: boolean;
  generationError?: string | null;
  hasActiveSession?: boolean;
  onResume?: () => void;
};

export const InterviewSetupView = ({
  onStart,
  isGenerating,
  generationError,
  hasActiveSession,
  onResume,
}: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCat, setSelectedCat] = useState<CategoryInfo | null>(null);

  // Form state
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(5);

  const handleSelectCategory = (cat: CategoryInfo) => {
    setSelectedCat(cat);
    setTopic(cat.defaultTopic);
    setDifficulty(cat.defaultDiff);
    setCount(cat.defaultCount);
    setStep(2);
  };

  const handleStart = () => {
    if (!topic.trim() || isGenerating) return;
    onStart({ topic: topic.trim(), difficulty, count });
  };

  // ===== PASO 1: Elegir Categoría =====
  if (step === 1) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Header con Badge de confianza */}
          <View style={styles.headerArea}>
            <View style={styles.badgePill}>
              <Feather name="zap" size={13} color={Colors.primary} />
              <Text style={styles.badgePillText}>SIMULADOR DE ENTREVISTAS CON IA</Text>
            </View>
            <Text style={styles.title}>Elegí tu modalidad de práctica</Text>
            <Text style={styles.subtitle}>
              Seleccioná qué tipo de entrevista querés simular para recibir feedback especializado e inmediato.
            </Text>
          </View>

          {/* Botón para reanudar si hay sesión activa */}
          {hasActiveSession && (
            <TouchableOpacity style={styles.resumeCard} onPress={onResume} activeOpacity={0.85}>
              <View style={styles.resumeIcon}>
                <Feather name="play-circle" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeTitle}>Tenés una entrevista en curso</Text>
                <Text style={styles.resumeSubtitle}>Tocá acá para continuar donde dejaste</Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Tarjetas de Categorías */}
          <View style={styles.optionsContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.optionCard}
                onPress={() => handleSelectCategory(cat)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: cat.iconBg }]}>
                    <Feather name={cat.icon} size={22} color={cat.iconColor} />
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: cat.badgeBg }]}>
                    <Text style={[styles.categoryBadgeText, { color: cat.badgeColor }]}>
                      {cat.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.optionTitle}>{cat.title}</Text>
                <Text style={styles.optionDesc}>{cat.desc}</Text>

                {/* Chips de características */}
                <View style={styles.featurePillsRow}>
                  {cat.features.map((feat, idx) => (
                    <View key={idx} style={styles.featurePill}>
                      <Text style={styles.featurePillText}>✓ {feat}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.optionFooter}>
                  <Text style={[styles.startPromptText, { color: cat.iconColor }]}>
                    Elegir y configurar
                  </Text>
                  <View style={[styles.arrowCircle, { backgroundColor: cat.iconBg }]}>
                    <Feather name="arrow-right" size={15} color={cat.iconColor} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== PASO 2: Configurar Detalles =====
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
          disabled={isGenerating}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Cambiar modalidad</Text>
        </TouchableOpacity>

        <View style={styles.step2Header}>
          <View style={[styles.categoryBadge, { backgroundColor: selectedCat?.badgeBg, alignSelf: 'flex-start' }]}>
            <Text style={[styles.categoryBadgeText, { color: selectedCat?.badgeColor }]}>
              {selectedCat?.badge}
            </Text>
          </View>
          <Text style={styles.title}>{selectedCat?.title}</Text>
          <Text style={styles.subtitle}>Personalizá las preguntas que la IA va a formular</Text>
        </View>

        {/* Tema */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>¿Sobre qué tema o rol querés practicar?</Text>
          <TextInput
            style={styles.topicInput}
            value={topic}
            onChangeText={setTopic}
            placeholder="Ej: Ventas, Administración, Atención al cliente, IT..."
            placeholderTextColor={Colors.textMuted}
            editable={!isGenerating}
          />

          {/* Sugerencias rápidas de 1 toque */}
          {selectedCat?.quickTopics && (
            <View style={styles.quickTopicsContainer}>
              <Text style={styles.quickTopicsLabel}>Sugerencias rápidas:</Text>
              <View style={styles.quickTopicsRow}>
                {selectedCat.quickTopics.map((qt) => {
                  const isSelected = topic.toLowerCase() === qt.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={qt}
                      style={[
                        styles.quickTopicChip,
                        isSelected && styles.quickTopicChipSelected,
                      ]}
                      onPress={() => setTopic(qt)}
                    >
                      <Text
                        style={[
                          styles.quickTopicText,
                          isSelected && styles.quickTopicTextSelected,
                        ]}
                      >
                        {qt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Dificultad */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Nivel de exigencia</Text>
          <View style={styles.pillRow}>
            {DIFFICULTIES.map((d) => {
              const isSelected = difficulty === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.diffPill,
                    isSelected && {
                      backgroundColor: d.color,
                      borderColor: d.color,
                    },
                  ]}
                  onPress={() => setDifficulty(d.value)}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.diffPillText,
                      isSelected && styles.diffPillTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cantidad */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Cantidad de preguntas</Text>
          <View style={styles.pillRow}>
            {COUNTS.map((c) => {
              const isSelected = count === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.countPill, isSelected && styles.countPillSelected]}
                  onPress={() => setCount(c)}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.countPillText, isSelected && styles.countPillTextSelected]}>
                    {c}
                  </Text>
                  <Text style={[styles.countPillSub, isSelected && styles.countPillTextSelected]}>
                    preguntas
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Errores */}
        {generationError && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{generationError}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, (!topic.trim() || isGenerating) && styles.ctaButtonDisabled]}
          onPress={handleStart}
          disabled={!topic.trim() || isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.ctaText}>Generando preguntas con IA...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.ctaText}>Comenzar entrevista ahora</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 48, gap: Spacing.md },

  // Header Area
  headerArea: {
    marginBottom: 4,
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Reanudar Sesion
  resumeCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  resumeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  resumeSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    marginTop: 2,
  },

  // Opciones paso 1
  optionsContainer: { gap: 14 },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  featurePill: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  startPromptText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Paso 2
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  step2Header: {
    gap: 4,
    marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  quickTopicsContainer: {
    marginTop: 6,
    gap: 6,
  },
  quickTopicsLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  quickTopicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTopicChip: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickTopicChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  quickTopicText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  quickTopicTextSelected: {
    color: Colors.primaryDark,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  diffPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  diffPillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  diffPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 2,
  },
  countPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  countPillText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  countPillTextSelected: {
    color: '#FFFFFF',
  },
  countPillSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // Error / CTA
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});

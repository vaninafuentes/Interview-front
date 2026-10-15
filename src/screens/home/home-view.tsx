/**
 * src/screens/home/home-view.tsx
 * --------------------------------
 * Pantalla Principal con diseño y estética aiApply (lavanda, blanco, índigo y fucsia).
 *
 * Características:
 *   - Logo de marca InterviewIA✦
 *   - Badge "Excellent ★★★★★ 4.7"
 *   - Título heroico con acento de color de alto impacto
 *   - Botón pill "Prueba Interview IA ahora →"
 *   - Acceso directo al Banco de Preguntas
 *   - Acceso directo a Búsqueda y Postulación IA a Empleos
 *   - Racha y métricas limpias sin sobrecarga visual
 */

import type { User } from '@/src/domain/auth';
import type { InterviewStats } from '@/src/domain/interview';
import { BorderRadius, Colors, FontSize, Spacing } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type HomeViewProps = {
  user: User | null;
  stats?: InterviewStats;
  isStatsLoading: boolean;
  onRefreshStats?: () => void;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const HomeView = ({
  user,
  stats,
  isStatsLoading,
  onRefreshStats,
}: HomeViewProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const initials = getInitials(user?.name ?? 'U');

  const streakDays = stats?.currentStreak ?? 0;
  const streakText = t('home.streak_count', { count: streakDays });
  const avgScore = stats?.averageScore ?? 0;

  // Animación suave de respiración del fuego de racha
  const flameScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flameScale]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isStatsLoading}
            onRefresh={onRefreshStats}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Barra Superior (Logo + Avatar Perfil) ── */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>InterviewIA</Text>
            <Text style={styles.logoSparkle}>✦</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarButtonText}>{initials || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Titular Heroico Estilo aiApply ── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeading}>
            {t('home.hero_heading')}{' '}
            <Text style={styles.heroHeadingHighlight}>{t('home.hero_heading_highlight')}</Text>
          </Text>

          <Text style={styles.heroSubhead}>
            {t('home.hero_subhead')}
          </Text>

          <Text style={styles.heroDescription}>
            {t('home.hero_description')}
          </Text>

          {/* Botón Principal aiApply CTA */}
          <TouchableOpacity
            style={styles.mainCtaButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/interview')}
          >
            <Text style={styles.mainCtaText}>{t('home.cta_button')}</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Racha Diaria y Puntuación Promedio ── */}
        <View style={styles.metricsRow}>
          <View style={styles.streakCard}>
            <View style={styles.streakIconWrap}>
              <Animated.Text style={[styles.streakFire, { transform: [{ scale: flameScale }] }]}>
                🔥
              </Animated.Text>
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricLabel} numberOfLines={1}>
                {t('home.streak_label')}
              </Text>
              <Text style={styles.streakText} numberOfLines={1} adjustsFontSizeToFit>
                {streakText}
              </Text>
            </View>
          </View>

          <View style={styles.scoreMetricCard}>
            <View style={styles.scoreIconWrap}>
              <Feather name="award" size={20} color={Colors.primary} />
            </View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricLabel} numberOfLines={1}>
                {t('home.avg_label')}
              </Text>
              <Text style={styles.scoreText} numberOfLines={1} adjustsFontSizeToFit>
                {avgScore > 0 ? `${avgScore} / 10` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Secciones Destacadas (Acceso Directo Sin Sobrecarga) ── */}
        <Text style={styles.sectionTitle}>{t('home.explore_title')}</Text>

        {/* Botón 1: Banco de Preguntas (Accesible desde Home como pidió el usuario) */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => router.push('/(tabs)/questions')}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Feather name="book-open" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.toolTitleRow}>
              <Text style={styles.toolTitle}>{t('home.tool_questions_title')}</Text>
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>{t('home.tool_questions_badge')}</Text>
              </View>
            </View>
            <Text style={styles.toolDescription}>
              {t('home.tool_questions_desc')}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Botón 2: Búsqueda y Postulación IA a Empleos (aiApply style) */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => router.push('/(tabs)/jobs')}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: '#FDF4FF' }]}>
            <Feather name="briefcase" size={22} color={Colors.accentPink} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.toolTitleRow}>
              <Text style={styles.toolTitle}>{t('home.tool_jobs_title')}</Text>
              <View style={[styles.newPill, { backgroundColor: '#FCE7F3' }]}>
                <Text style={[styles.newPillText, { color: '#BE185D' }]}>{t('home.tool_jobs_badge')}</Text>
              </View>
            </View>
            <Text style={styles.toolDescription}>
              {t('home.tool_jobs_desc')}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Botón 3: Simulacro Técnico Rápido */}
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => router.push('/(tabs)/interview')}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="mic" size={22} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toolTitle}>{t('home.tool_interview_title')}</Text>
            <Text style={styles.toolDescription}>
              {t('home.tool_interview_desc')}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // --- Top Bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  logoSparkle: {
    fontSize: 16,
    color: Colors.accentPink,
    fontWeight: '900',
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FontSize.md,
  },

  // --- Hero Section ---
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: Spacing.md,
    gap: 12,
  },
  heroHeading: {
    fontSize: 29,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroHeadingHighlight: {
    color: Colors.accentPink,
  },
  heroSubhead: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  mainCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  mainCtaText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // --- Métricas ---
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  streakCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  metricTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  streakIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFire: {
    fontSize: 20,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  streakText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#C2410C',
    marginTop: 2,
  },
  scoreMetricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  scoreIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },

  // --- Herramientas ---
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 8,
    marginLeft: 4,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  toolTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  newPill: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  newPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  toolDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});

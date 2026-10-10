/**
 * src/screens/profile/profile-screen.tsx
 * -----------------------------------------
 * Pantalla de perfil de usuario estilo aiApply.
 *
 * Características:
 *   - Información de cuenta editable (Nombre, Email/Gmail, Rol profesional).
 *   - Métricas clave: Racha de práctica, Preguntas respondidas, Nota promedio, Mejor nota.
 *   - Promedio por cada sección / categoría evaluada.
 *   - Sin sobrecarga de historial ni botones redundantes de práctica.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/use-auth';
import { useInterviewStats } from '@/src/hooks/use-interview-stats';
import { Colors, BorderRadius, Spacing, FontSize } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { AppButton } from '@/src/components/app-button';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useInterviewStats();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados del formulario de edición
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editRole, setEditRole] = useState(user?.role || 'Profesional / Candidato');
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = async () => {
    await refetchStats();
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditRole(user?.role || 'Profesional / Candidato');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresá tu nombre y correo.');
      return;
    }
    setIsSaving(true);
    try {
      await updateUser({
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole.trim(),
      });
      setIsEditModalOpen(false);
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const streakDays = stats?.currentStreak ?? 0;
  const totalInterviews = stats?.totalSessions ?? 0;
  const avgScore = stats?.averageScore ?? 0;
  const bestScore = stats?.bestScore ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isStatsLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Header aiApply ── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editPillButton}
              onPress={handleOpenEdit}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={14} color={Colors.primary} />
              <Text style={styles.editPillText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Candidato'}</Text>
          <Text style={styles.userRole}>{user?.role || 'Profesional / Candidato'}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="mail" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{user?.email || 'sin-correo@ejemplo.com'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={12} color={Colors.success} />
              <Text style={styles.verifiedText}>Cuenta activa</Text>
            </View>
          </View>
        </View>

        {/* ── Tarjeta de Racha diaria ── */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.fireCircle}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
            </View>
            <View>
              <Text style={styles.streakLabel}>Racha de práctica</Text>
              <Text style={styles.streakValue}>
                {streakDays} {streakDays === 1 ? 'día consecutivo' : 'días consecutivos'}
              </Text>
            </View>
          </View>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>+10 pts hoy</Text>
          </View>
        </View>

        {/* ── Estadísticas Globales ── */}
        <Text style={styles.sectionHeader}>MÉTRICAS DE RENDIMIENTO</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="check-square" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{totalInterviews}</Text>
            <Text style={styles.statLabel}>Preguntas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FDF4FF' }]}>
              <Feather name="activity" size={18} color={Colors.accentPink} />
            </View>
            <Text style={styles.statValue}>{avgScore > 0 ? `${avgScore}/10` : '—'}</Text>
            <Text style={styles.statLabel}>Puntaje prom.</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="award" size={18} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{bestScore > 0 ? `${bestScore}/10` : '—'}</Text>
            <Text style={styles.statLabel}>Mejor nota</Text>
          </View>
        </View>

        {/* ── Promedio por cada sección / categoría ── */}
        <Text style={styles.sectionHeader}>PROMEDIO POR SECCIÓN</Text>
        <View style={styles.categoryCard}>
          {stats?.categoryAverages && Object.keys(stats.categoryAverages).length > 0 ? (
            Object.entries(stats.categoryAverages).map(([cat, score], index) => (
              <View
                key={cat}
                style={[
                  styles.categoryRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: Colors.borderLight },
                ]}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <Text style={styles.categoryScoreText}>{score} / 10</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, score * 10)}%` as any,
                        backgroundColor:
                          score >= 7.5
                            ? Colors.primary
                            : score >= 5
                            ? Colors.warning
                            : Colors.error,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCategories}>
              <Feather name="info" size={20} color={Colors.textMuted} />
              <Text style={styles.emptyCategoriesText}>
                Completá tu primer simulacro para ver el promedio desglosado por sección.
              </Text>
            </View>
          )}
        </View>

        {/* ── Botón de Cerrar Sesión ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de Edición de Perfil ── */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Información</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} hitSlop={12}>
                <Feather name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico (Gmail)</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="vos@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rol o especialidad deseada</Text>
              <TextInput
                style={styles.textInput}
                value={editRole}
                onChangeText={setEditRole}
                placeholder="Ej. Ventas, Administración, Marketing, IT..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setIsEditModalOpen(false)}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
              <AppButton
                title={isSaving ? 'Guardando...' : 'Guardar cambios'}
                onPress={handleSaveProfile}
                isLoading={isSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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

  // --- Header Card ---
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  editPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editPillText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  userRole: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
  },

  // --- Racha ---
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fireCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#9A3412',
    textTransform: 'uppercase',
  },
  streakValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#C2410C',
  },
  streakPill: {
    backgroundColor: '#FDBA74',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  streakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C2D12',
  },

  // --- Secciones y Métricas ---
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 8,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },

  // --- Promedio por sección ---
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryRow: {
    paddingVertical: 12,
    gap: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryScoreText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  emptyCategoriesText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // --- Logout ---
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginTop: 12,
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.error,
  },

  // --- Modal de Edición ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.full,
  },
  cancelModalText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});

/**
 * src/screens/home/home-view.tsx
 * --------------------------------
 * Vista PURA del Home: solo recibe props y renderiza UI.
 *
 * Patrón Screen + View (Divide y Vencerás):
 * ------------------------------------------
 * HOME-SCREEN → obtiene datos del hook (useAuth) → pasa props a HOME-VIEW
 * HOME-VIEW   → solo renderiza, sin llamadas a hooks de datos, sin lógica
 *
 * ¿Por qué separar Screen y View?
 *   - HomeView es testeable sin mocks de hooks
 *   - HomeView se puede reusar en un modal, una preview, un test, etc.
 *   - HomeScreen centraliza la lógica: qué datos mostrar y qué acciones tomar
 *
 * Aplica:
 *   ✅ Ternario en lugar de if/else
 *   ✅ && para condicionales simples
 *   ✅ Composición por props (recibe user, onLogout)
 *   ✅ useTranslation para textos (i18n)
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/src/components/app-button';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';
import type { User } from '@/src/domain/auth';

type HomeViewProps = {
  user: User | null;
  isLoggingOut: boolean;
  onLogout: () => void;
};

export const HomeView = ({ user, isLoggingOut, onLogout }: HomeViewProps) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Ternario: si tiene nombre lo muestra, si no "Usuario" */}
          <Text style={styles.title}>
            {t('home.greeting', { name: user?.name ?? 'Usuario' })}
          </Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          <AppButton
            title={t('home.logout')}
            onPress={onLogout}
            variant="secondary"
            isLoading={isLoggingOut}
          />
        </View>
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
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});

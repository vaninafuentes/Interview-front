/**
 * src/screens/profile/profile-screen.tsx
 * -----------------------------------------
 * Pantalla de perfil del usuario.
 *
 * Aplica patrón Screen + View simplificado:
 * Esta pantalla es pequeña, la lógica y la UI van juntas.
 *
 * Aplica:
 *   ✅ Ternario para valores opcionales (user?.name ?? '-')
 *   ✅ Composición via props (AppButton)
 *   ✅ useAuth desde src/hooks
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/src/components/app-button';
import { useAuth } from '@/src/hooks/use-auth';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Perfil</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nombre</Text>
            {/* Ternario: muestra el nombre o '-' si no existe */}
            <Text style={styles.value}>{user?.name ?? '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email ?? '-'}</Text>
          </View>
          <AppButton title="Cerrar sesión" onPress={logout} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  infoRow: { gap: 4 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: FontSize.md, color: Colors.textPrimary },
});

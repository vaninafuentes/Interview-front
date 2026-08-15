/**
 * src/screens/auth/login-screen.tsx
 * -----------------------------------
 * Pantalla de inicio de sesión.
 *
 * Patrón Screen + View aplicado parcialmente:
 * Esta pantalla maneja tanto lógica de formulario como UI (lógica de validación
 * está tan ligada al formulario que separarla en un View no agrega valor aquí).
 *
 * Aplica:
 *   ✅ Ternario / && para condicionales
 *   ✅ Composición via props (AppButton, AppInput)
 *   ✅ useAuth desde src/hooks
 */

import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/src/components/app-button';
import { AppInput } from '@/src/components/app-input';
import { useAuth } from '@/src/hooks/use-auth';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailRegex = /^\S+@\S+\.\S+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};
    if (!emailRegex.test(email.trim())) nextErrors.email = 'Ingresa un email válido.';
    if (password.trim().length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    setFormError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.card}>
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            {/* && para mostrar error de formulario solo cuando existe */}
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <AppButton title="Ingresar" onPress={handleLogin} isLoading={isSubmitting} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>
              <Link href="/register" style={styles.link}>Regístrate</Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing.lg, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: Spacing.lg, alignItems: 'center', width: '100%', maxWidth: 420 },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    width: '100%',
    maxWidth: 420,
  },
  formError: { color: Colors.error, marginBottom: Spacing.sm, textAlign: 'center' },
  footer: { marginTop: Spacing.md, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  link: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
});

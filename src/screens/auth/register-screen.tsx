/**
 * src/screens/auth/register-screen.tsx
 * --------------------------------------
 * Pantalla de registro de nuevo usuario.
 *
 * Aplica:
 *   ✅ Ternario / && para condicionales de UI
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

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const emailRegex = /^\S+@\S+\.\S+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    if (!name.trim()) nextErrors.name = 'Ingresa tu nombre.';
    if (!emailRegex.test(email.trim())) nextErrors.email = 'Ingresa un email válido.';
    if (password.trim().length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    setFormError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
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
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Completa los datos para registrarte</Text>
          </View>

          <View style={styles.card}>
            <AppInput label="Nombre" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" error={errors.password} />
            <AppInput label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" error={errors.confirmPassword} />

            {/* Ternario para error de formulario */}
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <AppButton title="Crear cuenta" onPress={handleRegister} isLoading={isSubmitting} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <Link href="/login" style={styles.link}>Inicia sesión</Link>
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

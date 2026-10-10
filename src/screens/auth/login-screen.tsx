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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

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
          
          <View style={styles.headerArea}>
            <View style={styles.iconContainer}>
              <Feather name="message-square" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Practicá tu próxima entrevista con feedback inmediato y personalizado</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formContainer}>
              <AppInput
                label="Correo electrónico"
                placeholder="vos@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />
              
              <AppInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
              />
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <AppButton title="Ingresar" onPress={handleLogin} isLoading={isSubmitting} />
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continuar con</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <FontAwesome5 name="google" size={18} color={Colors.textPrimary} />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tenés cuenta?</Text>
              <Link href="/register" style={styles.link}>Registrate</Link>
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
  container: { flexGrow: 1, justifyContent: 'center' },
  
  headerArea: { 
    backgroundColor: Colors.surfaceAlt, 
    paddingTop: 48, 
    paddingHorizontal: 24, 
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    flex: 1,
  },
  formContainer: {
    gap: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  formError: { color: Colors.error, marginBottom: Spacing.sm, textAlign: 'center', fontWeight: '600' },
  
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  googleButtonText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  
  footer: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

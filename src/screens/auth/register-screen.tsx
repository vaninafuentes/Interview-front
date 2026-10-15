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
import { useTranslation } from 'react-i18next';

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

// Email: exige algo@algo.tld, con un TLD de al menos 2 letras
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valida la contraseña contra las reglas de seguridad y devuelve el mensaje de
   * la PRIMERA regla que no se cumple (o undefined si está OK).
   *
   * Mostrar una sola regla a la vez hace el mensaje concreto y accionable,
   * en vez de un genérico "la contraseña no es válida".
   *
   * Las mismas reglas están replicadas en el backend (RegisterRequest),
   * que es la validación que realmente manda.
   */
  const validatePassword = (value: string): string | undefined => {
    if (value.length < 8) return t('auth.password_rule_length');
    if (!/[A-Z]/.test(value)) return t('auth.password_rule_uppercase');
    if (!/[a-z]/.test(value)) return t('auth.password_rule_lowercase');
    if (!/[^A-Za-z0-9]/.test(value)) return t('auth.password_rule_special');
    return undefined;
  };

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    if (!name.trim()) nextErrors.name = t('auth.error_name_required');
    if (!emailRegex.test(email.trim())) nextErrors.email = t('auth.error_email');

    // Se asigna solo si hay error: si no, la clave quedaría presente con valor
    // undefined y el conteo de Object.keys daría por fallida la validación.
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    if (confirmPassword !== password) nextErrors.confirmPassword = t('auth.error_passwords_match');
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
      const message = error instanceof Error ? error.message : t('auth.error_unexpected');
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
          
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('auth.register_title')}</Text>
              <Text style={styles.subtitle}>{t('auth.register_subtitle')}</Text>
            </View>

            <View style={styles.formContainer}>
              <AppInput label={t('auth.name')} placeholder={t('auth.name_placeholder')} value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
              <AppInput
                label={t('auth.email')}
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />
              <AppInput label={t('auth.password')} placeholder={t('auth.password_placeholder')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" error={errors.password} />
              <AppInput label={t('auth.confirm_password')} placeholder={t('auth.password_placeholder')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" error={errors.confirmPassword} />
              
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <AppButton title={t('auth.register_button')} onPress={handleRegister} isLoading={isSubmitting} style={styles.submitButton} />
            </View>
            
            <Text style={styles.termsText}>
              {t('auth.terms_text')}{'\n'}
              <Text style={styles.termsLink}>{t('auth.terms_link')}</Text>
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.login_link')}</Text>
              <Link href="/login" style={styles.link}>{t('auth.login_link_action')}</Link>
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
  
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  
  header: { paddingHorizontal: 4, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  
  formContainer: { gap: 4 },
  
  submitButton: { marginTop: 8 },
  
  formError: { color: Colors.error, marginBottom: Spacing.sm, textAlign: 'center', fontWeight: '600' },
  
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 18,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

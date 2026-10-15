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
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppButton } from '@/src/components/app-button';
import { AppInput } from '@/src/components/app-input';
import { useAuth } from '@/src/hooks/use-auth';
import { Colors, FontSize, Spacing } from '@/src/theme';
import { useTranslation } from 'react-i18next';

type LoginErrors = {
  email?: string;
  password?: string;
};

// Email: exige algo@algo.tld, con un TLD de al menos 2 letras
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};
    if (!emailRegex.test(email.trim())) nextErrors.email = t('auth.error_email');

    // Acá NO se valida el formato ni el largo de la contraseña a propósito:
    // un usuario registrado antes de las reglas de contraseña segura puede tener
    // una más corta, y bloquearlo en el login lo dejaría afuera de su propia cuenta.
    // La validación real la hace el backend al autenticar.
    if (!password) nextErrors.password = t('auth.error_password_required');

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
          
          <View style={styles.headerArea}>
            <View style={styles.iconContainer}>
              <Feather name="message-square" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{t('auth.login_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formContainer}>
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
              
              <AppInput
                label={t('auth.password')}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
              />
              
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() =>
                  Alert.alert(t('auth.coming_soon_title'), t('auth.forgot_password_msg'))
                }
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
              </TouchableOpacity>
              
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <AppButton title={t('auth.login_button')} onPress={handleLogin} isLoading={isSubmitting} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.register_link')}</Text>
              <Link href="/register" style={styles.link}>{t('auth.register_link_action')}</Link>
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
  
  footer: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});

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

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { useAuth } from '@/hooks/use-auth';

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

    if (!name.trim()) {
      nextErrors.name = 'Ingresa tu nombre.';
    }

    if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Ingresa un email válido.';
    }

    if (password.trim().length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

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
            <AppInput
              label="Nombre"
              value={name}
              onChangeText={(value) => setName(value)}
              autoCapitalize="words"
              error={errors.name}
            />
            <AppInput
              label="Email"
              value={email}
              onChangeText={(value) => setEmail(value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={(value) => setPassword(value)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />
            <AppInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={(value) => setConfirmPassword(value)}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <AppButton title="Crear cuenta" onPress={handleRegister} loading={isSubmitting} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <Link href="/login" style={styles.link}>
                Inicia sesión
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  formError: {
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#64748b',
  },
  link: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});

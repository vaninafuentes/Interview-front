/**
 * src/components/app-input.tsx
 * ----------------------------
 * Input reutilizable con label, mensaje de error y "ojito" para ver la contraseña.
 *
 * Patrón: Componente composable via props.
 * Recibe label, error, y cualquier prop nativa de TextInput.
 *
 * Si recibe `secureTextEntry` (es decir, si es un campo de contraseña), agrega
 * automáticamente el ícono de ojo para alternar entre texto oculto y visible.
 *
 * Uso:
 * ```tsx
 * <AppInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={errors.email}
 *   keyboardType="email-address"
 * />
 *
 * <AppInput
 *   label="Contraseña"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 *   error={errors.password}
 * />
 * ```
 */

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export const AppInput = ({ label, error, style, secureTextEntry, ...props }: AppInputProps) => {
  // El ojito es estado local del input: arranca siempre oculto.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = Boolean(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...props}
        />

        {/* El ojito solo aparece en campos de contraseña (&& para condicional de UI) */}
        {isPasswordField && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* && para mostrar error solo cuando existe */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: '600',
  },
  // El borde vive en el wrapper (y no en el TextInput) para que el ojito
  // quede dentro del mismo recuadro que el campo.
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeButton: {
    paddingLeft: 8,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    marginTop: 6,
    color: Colors.error,
    fontSize: FontSize.xs,
  },
});

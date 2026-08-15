/**
 * src/components/app-input.tsx
 * ----------------------------
 * Input reutilizable con label y mensaje de error.
 *
 * Patrón: Componente composable via props.
 * Recibe label, error, y cualquier prop nativa de TextInput.
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
 * ```
 */

import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export const AppInput = ({ label, error, style, ...props }: AppInputProps) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error ? styles.inputError : null, style]}
      placeholderTextColor={Colors.textMuted}
      {...props}
    />
    {/* && para mostrar error solo cuando existe */}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
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

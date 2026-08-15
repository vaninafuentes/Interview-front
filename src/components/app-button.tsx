/**
 * src/components/app-button.tsx
 * ------------------------------
 * Botón reutilizable de la aplicación.
 *
 * Patrón: Componente Composable
 * -----------------------------
 * Se configura mediante PROPS, no con lógica interna.
 * El padre le pasa todo lo que necesita: título, variante, acción, estado.
 *
 * Variantes:
 *   - 'primary'   → botón principal (fondo sólido azul)
 *   - 'secondary' → botón secundario (borde, sin fondo)
 *   - 'danger'    → acción destructiva (rojo)
 *
 * Uso:
 * ```tsx
 * <AppButton title="Guardar" onPress={handleSave} />
 * <AppButton title="Cancelar" variant="secondary" onPress={handleCancel} />
 * <AppButton title="Reintentar" onPress={refetch} isLoading={isLoading} />
 * ```
 */

import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { Colors, BorderRadius, FontSize } from '@/src/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
};

export const AppButton = ({ title, variant = 'primary', isLoading = false, disabled, style, ...rest }: AppButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {/* isLoading && spinner → condicional con && sin if */}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : Colors.primary}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.md,
    minHeight: 50,
  },
  // --- Variantes de botón ---
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  // --- Estado deshabilitado ---
  disabled: {
    opacity: 0.5,
  },
  // --- Texto por variante ---
  text: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: Colors.primary,
  },
  dangerText: {
    color: '#ffffff',
  },
  spinner: {
    marginRight: 8,
  },
});

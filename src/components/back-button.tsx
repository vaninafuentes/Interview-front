/**
 * src/components/back-button.tsx
 * ------------------------------
 * Botón circular de "volver atrás" para los headers de las pantallas que se
 * abren desde los accesos directos de la Home.
 *
 * El comportamiento de navegación vive en `useGoBack()` — este componente es
 * solo la parte visual, así que se puede reutilizar en cualquier pantalla.
 *
 * Uso:
 * ```tsx
 * <View style={styles.headerRow}>
 *   <BackButton />
 *   <Text style={styles.headerTitle}>Empleos</Text>
 * </View>
 * ```
 */

import { StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors } from '@/src/theme';
import { useGoBack } from '@/src/hooks/use-go-back';

export const BackButton = () => {
  const goBack = useGoBack();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={goBack}
      activeOpacity={0.7}
      hitSlop={10}
      accessibilityRole="button"
    >
      {/* paddingRight compensa el aire que trae el ícono chevron por defecto */}
      <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 3,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

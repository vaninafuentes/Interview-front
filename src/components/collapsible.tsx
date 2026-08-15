/**
 * src/components/collapsible.tsx
 * --------------------------------
 * Sección desplegable con título y contenido.
 *
 * Patrón: Componente composable que acepta `children`.
 * El estado de abierto/cerrado es local (useState).
 *
 * Uso:
 * ```tsx
 * <Collapsible title="Ver más">
 *   <Text>Contenido oculto</Text>
 * </Collapsible>
 * ```
 */

import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { IconSymbol } from '@/src/components/icon-symbol';
import { Colors, FontSize } from '@/src/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export const Collapsible = ({ children, title }: PropsWithChildren & { title: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {/* && para mostrar contenido solo cuando está abierto */}
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});

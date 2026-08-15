/**
 * src/hooks/use-theme-color.ts
 * ----------------------------
 * Hook para obtener un color del sistema de diseño según el tema activo (light/dark).
 *
 * Docs: https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/src/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  return colorFromProps ?? Colors[theme][colorName];
}

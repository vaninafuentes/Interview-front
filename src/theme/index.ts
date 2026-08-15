/**
 * src/theme/index.ts
 * ------------------
 * Sistema de diseño central de la aplicación.
 *
 * Capa: THEME
 * -----------
 * Define los tokens de diseño: colores, tipografía y espaciado.
 * Todos los componentes y screens importan sus valores desde acá.
 * Nunca hardcodees colores o tamaños directamente en componentes.
 *
 * Con NativeWind (Tailwind), estos valores también se definen en
 * tailwind.config.js para usarlos como clases CSS.
 */

export const Colors = {
  /** Colores de marca */
  primary: '#0a7ea4',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',

  /** Backgrounds */
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',

  /** Texto */
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  /** Estados */
  error: '#ef4444',
  errorLight: '#fee2e2',
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',

  /** Bordes */
  border: '#e2e8f0',
  borderFocus: '#0a7ea4',

  /** Dificultad de preguntas */
  difficultyEasy: '#22c55e',
  difficultyMedium: '#f59e0b',
  difficultyHard: '#ef4444',

  /** Esquemas light/dark para useThemeColor */
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

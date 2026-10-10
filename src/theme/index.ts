/**
 * src/theme/index.ts
 * ------------------
 * Sistema de diseño central de la aplicación — Dark Mode Pro High-Tech.
 *
 * Paleta moderna de alto contraste, legible y estética:
 *   - Background: Obsidian Space Slate (#0B0F19)
 *   - Superficies: Dark Slate (#111827 / #1E293B)
 *   - Acentos: Electric Amber & Gold Flame (#F59E0B / #FBBF24)
 *   - Tipografía: Blanco puro (#FFFFFF) y Slate (#94A3B8)
 */

export const Colors = {
  /** Colores de marca aiApply: Índigo / Violeta vibrante */
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99, 102, 241, 0.15)',
  accentPink: '#EC4899',
  accentPurple: '#8B5CF6',

  /** Backgrounds limpios estilo aiApply (lavanda suave y blanco puro) */
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EFFF',
  surfaceElevated: '#FFFFFF',

  /** Tipografía de alto contraste sobre fondo claro */
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',

  /** Estados y alertas */
  error: '#EF4444',
  errorLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  /** Bordes sutiles y estados activos */
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#6366F1',

  /** Dificultad de preguntas */
  difficultyEasy: '#10B981',
  difficultyMedium: '#F59E0B',
  difficultyHard: '#EF4444',

  /** Esquemas para useThemeColor */
  light: {
    text: '#111827',
    background: '#F8F7FF',
    tint: '#6366F1',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6366F1',
  },
  dark: {
    text: '#111827',
    background: '#F8F7FF',
    tint: '#6366F1',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6366F1',
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
  xxxl: 36,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

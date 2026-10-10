/**
 * src/components/icon-symbol.tsx
 * --------------------------------
 * Ícono multiplataforma: SF Symbols en iOS, Material Icons en Android/Web.
 * Garantiza un aspecto consistente en todas las plataformas.
 *
 * Fallback para Android y Web usando MaterialIcons.
 * La versión iOS está en icon-symbol.ios.tsx (Metro la elige automáticamente).
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconSymbolName =
  | 'house.fill'
  | 'paperplane.fill'
  | 'chevron.left.forwardslash.chevron.right'
  | 'chevron.right';

/** Mapeo de SF Symbols → Material Icons */
const MAPPING: Record<IconSymbolName, ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
};

export const IconSymbol = ({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) => <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;

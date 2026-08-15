/**
 * src/components/icon-symbol.ios.tsx
 * ------------------------------------
 * Versión iOS del componente IconSymbol: usa SF Symbols nativos.
 * Metro bundler elige este archivo automáticamente en builds de iOS.
 */

import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export const IconSymbol = ({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) => (
  <SymbolView
    weight={weight}
    tintColor={color}
    resizeMode="scaleAspectFit"
    name={name}
    style={[{ width: size, height: size }, style]}
  />
);

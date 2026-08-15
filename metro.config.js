/**
 * metro.config.js
 * ---------------
 * Configuración del bundler Metro para Expo con soporte de NativeWind.
 *
 * NativeWind v4 requiere que el CSS de Tailwind se procese a través del
 * transformer de Metro. Esta configuración activa esa integración.
 *
 * Docs: https://www.nativewind.dev/getting-started/expo-router
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  /** Apunta al archivo CSS global que contiene @import "tailwindcss" */
  input: './global.css',
});

/**
 * babel.config.js
 * ---------------
 * Configuración de Babel para Expo con NativeWind.
 *
 * El preset 'babel-preset-expo' activa la compilación de JSX/TSX para React Native.
 * El plugin 'nativewind/babel' transforma las clases de Tailwind en StyleSheets
 * de React Native durante la compilación.
 *
 * IMPORTANTE: Después de agregar este plugin, reiniciar el bundler con:
 *   npm run start -- --reset-cache
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind necesita saber qué archivos escanear para generar las clases
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Colores de marca sincronizados con src/theme/index.ts
        primary: {
          DEFAULT: '#0a7ea4',
          light: '#38bdf8',
          dark: '#0369a1',
        },
        surface: '#ffffff',
        background: '#f8fafc',
        // Dificultad de preguntas
        easy: '#22c55e',
        medium: '#f59e0b',
        hard: '#ef4444',
      },
    },
  },
  plugins: [],
};

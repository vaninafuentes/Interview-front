/**
 * src/i18n/index.ts
 * -----------------
 * Configuración de i18next para soporte multilenguaje.
 *
 * Capa: I18N
 * ----------
 * Centraliza todos los textos de la app en archivos JSON por idioma.
 * Los screens y componentes usan el hook `useTranslation()` para obtener
 * los textos en el idioma activo.
 *
 * Lenguajes soportados:
 *   - 'es' → Español (idioma por defecto)
 *   - 'en' → Inglés
 *
 * Uso en un componente/screen:
 * ```tsx
 * import { useTranslation } from 'react-i18next';
 *
 * function HomeView({ name }: { name: string }) {
 *   const { t } = useTranslation();
 *   return <Text>{t('home.greeting', { name })}</Text>;
 * }
 * ```
 *
 * Interpolación: `t('home.greeting', { name: 'Juan' })` → "Hola, Juan"
 * Pluralización: `t('questions.subtitle', { count: 5 })` → "5 preguntas disponibles"
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './es.json';
import en from './en.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    /** Idioma por defecto */
    lng: 'es',
    /** Idioma de respaldo si falta una clave en el idioma activo */
    fallbackLng: 'es',
    /** Desactiva modo debug en producción */
    debug: false,
    interpolation: {
      /** React ya escapa HTML, no es necesario hacerlo en i18next */
      escapeValue: false,
    },
  });

export default i18n;

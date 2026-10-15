/**
 * src/hooks/use-go-back.ts
 * ------------------------
 * Comportamiento de "volver atrás" para las pantallas alcanzables desde los
 * accesos directos de la Home (banco de preguntas, empleos y simulacro).
 *
 * ¿Por qué hace falta? Esas pantallas viven dentro del tab navigator, así que
 * no tienen una flecha de volver nativa como las de un stack. El botón lo
 * agregamos nosotros en el header de cada una.
 *
 * Estrategia:
 *   1. Si hay historial navegable → router.back() (respeta de dónde vino)
 *   2. Si no (entró por la tab bar o por un deep link) → va a la Home
 *
 * El fallback es lo que garantiza que el botón NUNCA quede sin hacer nada.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export const useGoBack = () => {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/home');
  }, [router]);
};

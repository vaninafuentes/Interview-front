// NativeWind: importar el CSS global para activar las clases de Tailwind
import '../global.css';
// i18n: inicializar el sistema de traducciones antes de renderizar cualquier componente
import '../src/i18n';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/src/hooks/use-auth';

/**
 * Instancia de QueryClient de TanStack Query.
 * Se crea fuera del componente para evitar recrearla en cada render.
 *
 * QueryClient maneja:
 *   - Cache global de todas las queries
 *   - Configuración de stale time, retry, refetch, etc.
 *   - Garbage collection de datos no usados
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" antes de re-validar
      staleTime: 1000 * 60 * 5, // 5 minutos
      // Reintentar 2 veces en caso de error de red
      retry: 2,
    },
  },
});

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }
    if (user && inAuthGroup) {
      router.replace('/home');
    }
  }, [isLoading, router, segments, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

/**
 * Layout raíz de la aplicación.
 *
 * Providers (de afuera hacia adentro):
 *   1. QueryClientProvider → cache de queries para toda la app (TanStack Query)
 *   2. AuthProvider        → estado de autenticación (usuario, token)
 *   3. RootNavigator       → navegación condicional (auth vs tabs)
 */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

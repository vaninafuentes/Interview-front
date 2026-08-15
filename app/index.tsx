/**
 * app/index.tsx
 * -------------
 * Punto de entrada raíz de la aplicación.
 * Redirige automáticamente según el estado de autenticación:
 *   - Autenticado  → /home
 *   - Sin sesión   → /login
 *   - Cargando     → null (no renderiza nada mientras verifica)
 */
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/hooks/use-auth';

export default function Index() {
  const { user, isLoading } = useAuth();

  // Ternario: cargando → null, autenticado → home, no autenticado → login
  return isLoading ? null : <Redirect href={user ? '/home' : '/login'} />;
}

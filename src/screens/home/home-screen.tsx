/**
 * src/screens/home/home-screen.tsx
 * ----------------------------------
 * Contenedor lógico del Home.
 *
 * El cierre de sesión vive en la pantalla de Perfil, no acá.
 */

import { useAuth } from '@/src/hooks/use-auth';
import { useInterviewStats } from '@/src/hooks/use-interview-stats';
import { HomeView } from './home-view';

export default function HomeScreen() {
  const { user } = useAuth();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useInterviewStats();

  return (
    <HomeView
      user={user}
      stats={stats}
      isStatsLoading={isStatsLoading}
      onRefreshStats={refetchStats}
    />
  );
}

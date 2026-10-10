/**
 * src/screens/home/home-screen.tsx
 * ----------------------------------
 * Contenedor lógico del Home.
 */

import { useState } from 'react';
import { useAuth } from '@/src/hooks/use-auth';
import { useInterviewStats } from '@/src/hooks/use-interview-stats';
import { HomeView } from './home-view';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useInterviewStats();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <HomeView
      user={user}
      stats={stats}
      isStatsLoading={isStatsLoading}
      isLoggingOut={isLoggingOut}
      onLogout={handleLogout}
      onRefreshStats={refetchStats}
    />
  );
}

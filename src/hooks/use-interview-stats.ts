/**
 * src/hooks/use-interview-stats.ts
 * --------------------------------
 * Custom hook con React Query para obtener estadísticas de práctica del usuario.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchInterviewStats } from '@/src/data/api/interview-api';
import type { InterviewStats } from '@/src/domain/interview';

export const INTERVIEW_STATS_QUERY_KEY = ['interview-stats'] as const;

export const useInterviewStats = () => {
  const query = useQuery<InterviewStats, Error>({
    queryKey: INTERVIEW_STATS_QUERY_KEY,
    queryFn: fetchInterviewStats,
    staleTime: 1000 * 30, // 30 segundos
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

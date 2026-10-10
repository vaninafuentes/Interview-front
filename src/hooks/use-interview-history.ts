/**
 * src/hooks/use-interview-history.ts
 * ----------------------------------
 * Custom hook con React Query para obtener el historial completo de entrevistas del usuario.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchInterviewHistory } from '@/src/data/api/interview-api';
import type { InterviewHistoryItem } from '@/src/domain/interview';

export const INTERVIEW_HISTORY_QUERY_KEY = ['interview-history'] as const;

export const useInterviewHistory = () => {
  const query = useQuery<InterviewHistoryItem[], Error>({
    queryKey: INTERVIEW_HISTORY_QUERY_KEY,
    queryFn: fetchInterviewHistory,
    staleTime: 1000 * 30, // 30 segundos
  });

  return {
    history: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

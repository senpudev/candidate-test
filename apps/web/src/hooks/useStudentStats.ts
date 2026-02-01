import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// Hook for getting detailed statistics of a student with TanStack Query.
export function useStudentStats(studentId: string | null) {
  return useQuery({
    queryKey: ['studentStats', studentId],
    queryFn: () => api.getStats(studentId!),
    enabled: !!studentId,
  });
}

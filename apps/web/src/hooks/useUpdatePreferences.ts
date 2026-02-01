import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// Hook for updating preferences of a student with TanStack Query.
export function useUpdatePreferences(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Record<string, unknown>) =>
      api.updatePreferences(studentId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
    },
  });
}

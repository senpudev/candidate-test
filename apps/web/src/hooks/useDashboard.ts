import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

/**
 * Hook for Dashboard page: fetches dashboard summary, courses, and centralizes
 * all data/actions that the dashboard would use (getDashboard, getCourses,
 * getStats, updatePreferences).
 *
 * Nota: Asumo que las estadísticas detalladas (getStats) y la actualización de
 * preferencias (updatePreferences) tendrían sentido como funciones que usaría el
 * dashboard; por eso las he añadido aquí y he separado la lógica del dashboard 
 * pero no están implementadas en la UI.
 */
export function useDashboard(studentId: string | null) {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', studentId],
    queryFn: () => api.getDashboard(studentId!),
    enabled: !!studentId,
  });

  const coursesQuery = useQuery({
    queryKey: ['courses', studentId],
    queryFn: () => api.getCourses(studentId!),
    enabled: !!studentId,
  });

  const statsQuery = useQuery({
    queryKey: ['studentStats', studentId],
    queryFn: () => api.getStats(studentId!),
    enabled: !!studentId,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: Record<string, unknown>) =>
      api.updatePreferences(studentId!, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentStats', studentId] });
    },
  });

  const isLoading =
    dashboardQuery.isLoading || coursesQuery.isLoading;
  const error = dashboardQuery.error ?? coursesQuery.error;
  const refetch = () => {
    dashboardQuery.refetch();
    coursesQuery.refetch();
    statsQuery.refetch();
  };

  return {
    dashboard: dashboardQuery.data,
    courses: coursesQuery.data,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    isLoading,
    error,
    refetch,
    isRefetching: dashboardQuery.isRefetching || coursesQuery.isRefetching,
    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}

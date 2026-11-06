import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * After anything that changes courses, lessons, enrollments or progress, refresh every view that
 * could show it (catalog, course pages, lesson pages, "my courses" and both dashboards).
 */
export const invalidateLearningData = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.coursesAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.lessonsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  ]);

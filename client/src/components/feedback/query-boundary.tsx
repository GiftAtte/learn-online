import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState } from './error-state';

interface QueryBoundaryProps<T> {
  /** The result of a TanStack Query hook (useGetAllCourses, useGetCourseById...). */
  query: UseQueryResult<T>;
  /** Shown during the first load. Use a skeleton that mirrors the final layout. */
  loading: ReactNode;
  /** Decides whether loaded data counts as "nothing to show" (e.g. an empty list). */
  isEmpty?: (data: T) => boolean;
  /** Shown instead of the content when `isEmpty` returns true. */
  empty?: ReactNode;
  /** Renders the content once data is available. */
  children: (data: T) => ReactNode;
}

/**
 * The single place that decides what a data-driven screen shows:
 * loading -> skeleton, failed -> error with "Try again", empty -> empty state, otherwise the content.
 * Pages describe the four outcomes once and never repeat the branching.
 *
 *   <QueryBoundary query={courses} loading={<Skeleton />} isEmpty={(d) => d.length === 0} empty={<EmptyState />}>
 *     {(courses) => <CourseList courses={courses} />}
 *   </QueryBoundary>
 */
export function QueryBoundary<T>({
  query,
  loading,
  isEmpty,
  empty,
  children,
}: QueryBoundaryProps<T>) {
  if (query.isPending) return <>{loading}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}

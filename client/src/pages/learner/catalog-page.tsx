import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pagination, TableToolbar, ToolbarSelect } from '@/components/data-display';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useGetAllCategories } from '@/core/hooks/queries/use-categories';
import { useGetAllCourses } from '@/core/hooks/queries/use-courses';
import type { CourseFilters } from '@/core/types/course.types';
import { CourseCard } from '@/components/courses/course-card';
import { CourseGridSkeleton } from '@/components/courses/course-card-skeleton';
import { CourseGrid } from '@/components/courses/course-grid';
import { useGetLearnerDashboard } from '@/core/hooks/queries/use-dashboard';
import { ContinueCard } from '@/components/dashboard/continue-card';
import { useDebouncedSearch } from '@/core/hooks/ui/use-debounced-search';
import { useUrlParams } from '@/core/hooks/ui/use-url-params';
import { pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { DEFAULT_SORT, parseSortOption } from '@/core/lib/table';
import { link, PATHS } from '@/router/paths';

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'title:asc', label: 'Title A to Z' },
  { value: 'learners:desc', label: 'Most popular' },
];

/**
 * Catalog: route "/learner/catalog" (open to everyone).
 * Search, filter by category, sort, and page through published courses. Signed-in learners also get
 * a "continue learning" banner. The search text, filters, sort and page all live in the URL.
 */
export default function CatalogPage() {
  const { user, isAdmin } = useSession();
  const [params, setParams] = useUrlParams({
    q: '',
    categoryId: '',
    sortBy: 'createdAt',
    sortDir: 'desc',
    page: '1',
  });
  const [search, setSearch] = useDebouncedSearch(params.q, (q) => setParams({ q, page: '1' }));

  const courses = useGetAllCourses({
    q: params.q,
    categoryId: params.categoryId,
    sortBy: params.sortBy as CourseFilters['sortBy'],
    sortDir: params.sortDir as CourseFilters['sortDir'],
    page: Number(params.page),
    pageSize: PAGE_SIZE,
  });
  const categories = useGetAllCategories();
  const dashboard = useGetLearnerDashboard(!!user && !isAdmin);

  const hasFilters = !!(params.q || params.categoryId);
  const clearFilters = () => {
    setSearch('');
    setParams({ q: '', categoryId: '', page: '1' });
  };

  return (
    <Page
      hero
      title="Find your next course"
      description="Short video lessons you can finish between everything else."
    >
      {/* Returning learners: one tap back into the lesson they were watching */}
      {dashboard.data?.continueLearning && (
        <ContinueCard resume={dashboard.data.continueLearning} />
      )}

      {/* Search, filter and sort: the same toolbar the admin tables use */}
      <div className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4">
        <TableToolbar
          search={{ value: search, onChange: setSearch, label: 'Search courses' }}
          filters={
            <>
              <ToolbarSelect
                label="Filter by category"
                value={params.categoryId}
                onChange={(categoryId) => setParams({ categoryId, page: '1' })}
                allLabel="All categories"
                options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
              <ToolbarSelect
                label="Sort by"
                value={`${params.sortBy}:${params.sortDir}`}
                onChange={(value) =>
                  setParams({ ...parseSortOption(value, DEFAULT_SORT), page: '1' })
                }
                options={SORT_OPTIONS}
              />
            </>
          }
          summary={courses.data && pluralize(courses.data.meta.total, 'course')}
          onClear={hasFilters ? clearFilters : undefined}
        />
      </div>

      {/* Results */}
      <QueryBoundary
        query={courses}
        loading={
          <CourseGrid>
            <CourseGridSkeleton count={6} />
          </CourseGrid>
        }
        isEmpty={(data) => data.items.length === 0}
        empty={
          hasFilters ? (
            <NoResultsState onClear={clearFilters} />
          ) : (
            <EmptyState
              icon={BookOpen}
              {...MESSAGES.empty.courses}
              action={
                isAdmin ? (
                  <Button asChild>
                    <Link to={PATHS.admin.courses}>Add a course</Link>
                  </Button>
                ) : undefined
              }
            />
          )
        }
      >
        {({ items, meta }) => (
          <div className="flex flex-col gap-6">
            <CourseGrid>
              {items.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  to={link(PATHS.learner.course, { courseId: course.id })}
                />
              ))}
            </CourseGrid>
            {/* A single page needs no paging controls; the toolbar already shows the count */}
            {meta.totalPages > 1 && (
              <Pagination
                page={meta.page}
                pageSize={meta.pageSize}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={(page) => {
                  setParams({ page: String(page) });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        )}
      </QueryBoundary>
    </Page>
  );
}

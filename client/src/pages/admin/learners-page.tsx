import type { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import {
  DataTable,
  MutedCell,
  TableToolbar,
  TitleCell,
  ToolbarSelect,
} from '@/components/data-display';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Avatar, ProgressBar } from '@/components/ui';
import { useGetAllLearners } from '@/core/hooks/queries/use-dashboard';
import type { AdminLearner, LearnerFilters } from '@/core/types/learner.types';
import { useDebouncedSearch } from '@/core/hooks/ui/use-debounced-search';
import { useUrlParams } from '@/core/hooks/ui/use-url-params';
import { formatDate, pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import { DEFAULT_SORT, fromSortingState, parseSortOption, toSortingState } from '@/core/lib/table';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { PagedFooter } from '@/components/data-display/paged-footer';
import { link, PATHS } from '@/router/paths';

// Sort choices for phones, where there are no clickable column headers: "field:direction".
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A to Z' },
  { value: 'name:desc', label: 'Name Z to A' },
];

const ENROLLED_OPTIONS = [
  { value: 'yes', label: 'Enrolled in a course' },
  { value: 'no', label: 'Not enrolled yet' },
];

const columns: ColumnDef<AdminLearner>[] = [
  {
    id: 'name',
    header: 'Learner',
    accessorFn: (learner) => learner.name,
    cell: ({ row }) => (
      <TitleCell
        leading={<Avatar name={row.original.name} />}
        title={row.original.name}
        subtitle={row.original.email}
        to={link(PATHS.admin.learner, { learnerId: row.original.id })}
      />
    ),
  },
  {
    id: 'createdAt',
    header: 'Joined',
    accessorFn: (learner) => learner.joinedAt,
    sortDescFirst: true,
    cell: ({ row }) => <MutedCell>{formatDate(row.original.joinedAt)}</MutedCell>,
  },
  {
    id: 'courses',
    header: 'Progress by course',
    cell: ({ row }) =>
      row.original.courses.length === 0 ? (
        <span className="text-ink-faint">Not enrolled yet</span>
      ) : (
        // One small progress line per course the learner is enrolled in.
        <ul className="flex w-full min-w-56 flex-col gap-2.5 md:min-w-72">
          {row.original.courses.map((course) => (
            <li key={course.courseId} className="flex flex-col gap-1 text-left">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{course.title}</span>
                <span className="shrink-0 font-medium text-ink-soft tnum">
                  {course.completedLessons} of {course.lessonCount}
                </span>
              </div>
              <ProgressBar
                value={course.progressPercent}
                label={`${course.title} progress`}
                size="sm"
              />
            </li>
          ))}
        </ul>
      ),
  },
];

/**
 * Admin learners: route "/admin/learners" (administrators only).
 * A data table of every learner with progress per course. Search by name or email, filter by whether
 * they have enrolled, sort by name or join date, and page through results (all handled by the API).
 */
export default function AdminLearnersPage() {
  const [params, setParams] = useUrlParams({
    q: '',
    enrolled: '',
    sortBy: DEFAULT_SORT.sortBy as string,
    sortDir: DEFAULT_SORT.sortDir as string,
    page: '1',
    pageSize: '10',
  });
  const [search, setSearch] = useDebouncedSearch(params.q, (q) => setParams({ q, page: '1' }));

  const learners = useGetAllLearners({
    q: params.q,
    enrolled: (params.enrolled || undefined) as LearnerFilters['enrolled'],
    sortBy: params.sortBy as LearnerFilters['sortBy'],
    sortDir: params.sortDir as LearnerFilters['sortDir'],
    page: Number(params.page),
    pageSize: Number(params.pageSize),
  });

  const hasFilters = !!(params.q || params.enrolled);
  const clearFilters = () => {
    setSearch('');
    setParams({ q: '', enrolled: '', page: '1' });
  };
  const data = learners.data;

  return (
    <Page title="Learners" description="Who is learning, and how far they’ve got.">
      {learners.isError ? (
        <ErrorState error={learners.error} onRetry={() => void learners.refetch()} />
      ) : (
        <DataTable
          caption="Learners and their progress"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(row) => row.id}
          mobileTitleColumn="name"
          loading={learners.isPending}
          busy={learners.isFetching && !learners.isPending}
          sorting={toSortingState(params.sortBy, params.sortDir)}
          onSortingChange={(sorting) =>
            setParams({ ...fromSortingState(sorting, DEFAULT_SORT), page: '1' })
          }
          toolbar={
            <TableToolbar
              search={{ value: search, onChange: setSearch, label: 'Search by name or email' }}
              filters={
                <ToolbarSelect
                  label="Filter by enrollment"
                  value={params.enrolled}
                  onChange={(enrolled) => setParams({ enrolled, page: '1' })}
                  allLabel="All learners"
                  options={ENROLLED_OPTIONS}
                />
              }
              sort={
                <ToolbarSelect
                  label="Sort by"
                  value={`${params.sortBy}:${params.sortDir}`}
                  onChange={(value) =>
                    setParams({ ...parseSortOption(value, DEFAULT_SORT), page: '1' })
                  }
                  options={SORT_OPTIONS}
                />
              }
              summary={data && pluralize(data.meta.total, 'learner')}
              onClear={hasFilters ? clearFilters : undefined}
            />
          }
          empty={
            hasFilters ? (
              <NoResultsState onClear={clearFilters} />
            ) : (
              <EmptyState icon={Users} {...MESSAGES.empty.learners} />
            )
          }
          footer={data && <PagedFooter meta={data.meta} setParams={setParams} />}
        />
      )}
    </Page>
  );
}

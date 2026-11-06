import type { ColumnDef } from '@tanstack/react-table';
import { Eye, EyeOff, ListVideo, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  DataTable,
  MutedCell,
  NumberCell,
  RowActions,
  TableToolbar,
  TitleCell,
  ToolbarSelect,
} from '@/components/data-display';
import { EmptyState, ErrorState, useConfirm } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { useGetAllCategories } from '@/core/hooks/queries/use-categories';
import {
  useGetAllCourses,
  useDeleteCourse,
  usePublishCourse,
} from '@/core/hooks/queries/use-courses';
import type { CourseFilters, CourseSummary } from '@/core/types/course.types';
import { CourseFormModal } from '@/components/courses/course-form-modal';
import { CourseThumb } from '@/components/courses/course-thumb';
import { PublishedBadge } from '@/components/courses/published-badge';
import { useDebouncedSearch } from '@/core/hooks/ui/use-debounced-search';
import { useEditTarget } from '@/core/hooks/ui/use-edit-target';
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
  { value: 'title:asc', label: 'Title A to Z' },
  { value: 'title:desc', label: 'Title Z to A' },
  { value: 'learners:desc', label: 'Most learners' },
  { value: 'lessons:desc', label: 'Most lessons' },
];

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

/**
 * Admin courses: route "/admin/courses" (administrators only).
 * A data table of every course with search, category and status filters, sortable columns and paging
 * (all done by the API, and kept in the URL). Create and edit happen in a modal; lessons are managed
 * on each course's own page.
 */
export default function AdminCoursesPage() {
  const confirm = useConfirm();
  const editor = useEditTarget<CourseSummary>();
  const deleteCourse = useDeleteCourse();
  const setPublished = usePublishCourse();
  const categories = useGetAllCategories();

  const [params, setParams] = useUrlParams({
    q: '',
    categoryId: '',
    status: '',
    sortBy: DEFAULT_SORT.sortBy as string,
    sortDir: DEFAULT_SORT.sortDir as string,
    page: '1',
    pageSize: '10',
  });
  const [search, setSearch] = useDebouncedSearch(params.q, (q) => setParams({ q, page: '1' }));

  const courses = useGetAllCourses({
    q: params.q,
    categoryId: params.categoryId,
    status: (params.status || undefined) as CourseFilters['status'],
    sortBy: params.sortBy as CourseFilters['sortBy'],
    sortDir: params.sortDir as CourseFilters['sortDir'],
    page: Number(params.page),
    pageSize: Number(params.pageSize),
  });

  const hasFilters = !!(params.q || params.categoryId || params.status);
  const clearFilters = () => {
    setSearch('');
    setParams({ q: '', categoryId: '', status: '', page: '1' });
  };

  const columns: ColumnDef<CourseSummary>[] = [
    {
      id: 'title',
      header: 'Course',
      accessorFn: (course) => course.title,
      cell: ({ row }) => (
        <TitleCell
          leading={<CourseThumb src={row.original.thumbnailUrl} />}
          title={row.original.title}
          subtitle={row.original.category.name}
          to={link(PATHS.admin.course, { courseId: row.original.id })}
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <PublishedBadge published={row.original.published} />,
    },
    {
      id: 'lessons',
      header: 'Lessons',
      accessorFn: (course) => course.lessonCount,
      sortDescFirst: true,
      cell: ({ row }) => <NumberCell value={row.original.lessonCount} />,
    },
    {
      id: 'learners',
      header: 'Learners',
      accessorFn: (course) => course.enrollmentCount ?? 0,
      sortDescFirst: true,
      cell: ({ row }) => <NumberCell value={row.original.enrollmentCount ?? 0} />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorFn: (course) => course.createdAt ?? '',
      sortDescFirst: true,
      cell: ({ row }) => (
        <MutedCell>{row.original.createdAt ? formatDate(row.original.createdAt) : ''}</MutedCell>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const course = row.original;
        return (
          <RowActions
            label={`Actions for ${course.title}`}
            actions={[
              {
                label: 'Manage lessons',
                icon: ListVideo,
                to: link(PATHS.admin.course, { courseId: course.id }),
              },
              { label: 'Edit details', icon: Pencil, onSelect: () => editor.openEdit(course) },
              {
                label: course.published ? 'Unpublish' : 'Publish',
                icon: course.published ? EyeOff : Eye,
                onSelect: () =>
                  setPublished.mutate({ id: course.id, published: !course.published }),
              },
              {
                label: 'Delete course',
                icon: Trash2,
                tone: 'danger',
                separated: true,
                onSelect: async () => {
                  if (await confirm({ ...MESSAGES.confirm.deleteCourse })) {
                    deleteCourse.mutate(course.id);
                  }
                },
              },
            ]}
          />
        );
      },
    },
  ];

  const data = courses.data;

  return (
    <Page
      title="Courses"
      description="Create and manage the courses learners see."
      actions={
        <Button onClick={editor.openNew}>
          <Plus className="size-4" aria-hidden />
          New course
        </Button>
      }
    >
      {courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
      ) : (
        <DataTable
          caption="Courses"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(row) => row.id}
          numericColumns={['lessons', 'learners']}
          loading={courses.isPending}
          busy={courses.isFetching && !courses.isPending}
          sorting={toSortingState(params.sortBy, params.sortDir)}
          onSortingChange={(sorting) =>
            setParams({ ...fromSortingState(sorting, DEFAULT_SORT), page: '1' })
          }
          toolbar={
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
                    label="Filter by status"
                    value={params.status}
                    onChange={(status) => setParams({ status, page: '1' })}
                    allLabel="All statuses"
                    options={STATUS_OPTIONS}
                  />
                </>
              }
              sort={
                <ToolbarSelect
                  label="Sort by"
                  value={`${params.sortBy}:${params.sortDir}`}
                  onChange={(value) =>
                    setParams({ ...parseSortOption(value, DEFAULT_SORT), page: '1' })
                  }
                  options={SORT_OPTIONS}
                  className="col-span-2"
                />
              }
              summary={data && pluralize(data.meta.total, 'course')}
              onClear={hasFilters ? clearFilters : undefined}
            />
          }
          empty={
            hasFilters ? (
              <NoResultsState onClear={clearFilters} />
            ) : (
              <EmptyState
                {...MESSAGES.empty.courses}
                action={<Button onClick={editor.openNew}>New course</Button>}
              />
            )
          }
          footer={data && <PagedFooter meta={data.meta} setParams={setParams} />}
        />
      )}

      {editor.isOpen && <CourseFormModal existing={editor.item} onClose={editor.close} />}
    </Page>
  );
}

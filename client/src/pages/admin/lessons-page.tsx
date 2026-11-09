import type { ColumnDef } from '@tanstack/react-table';
import { ListVideo, Pencil, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DataTable,
  MutedCell,
  RowActions,
  TableToolbar,
  TitleCell,
  ToolbarSelect,
} from '@/components/data-display';
import { PagedFooter } from '@/components/data-display/paged-footer';
import { EmptyState, ErrorState, useConfirm } from '@/components/feedback';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { LessonFormModal } from '@/components/lessons/lesson-form-modal';
import { LessonThumb } from '@/components/lessons/lesson-thumb';
import { useGetAllCourses } from '@/core/hooks/queries/use-courses';
import { useDeleteLesson, useGetAllLessons } from '@/core/hooks/queries/use-lessons';
import { useDebouncedSearch } from '@/core/hooks/ui/use-debounced-search';
import { useEditTarget } from '@/core/hooks/ui/use-edit-target';
import { useUrlParams } from '@/core/hooks/ui/use-url-params';
import { formatDate, formatDuration, pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import { DEFAULT_SORT, fromSortingState, parseSortOption, toSortingState } from '@/core/lib/table';
import { youTubeIdOf } from '@/core/lib/youtube';
import type { AdminLesson, LessonFilters } from '@/core/types/lesson.types';
import { link, PATHS } from '@/router/paths';

// Sort choices for phones, where there are no clickable column headers: "field:direction".
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'title:asc', label: 'Title A to Z' },
  { value: 'title:desc', label: 'Title Z to A' },
  { value: 'course:asc', label: 'Course, in lesson order' },
  { value: 'duration:desc', label: 'Longest first' },
  { value: 'duration:asc', label: 'Shortest first' },
];

/** Where a lesson's video comes from, in words an administrator would use. */
const sourceOf = (videoUrl: string) => (youTubeIdOf(videoUrl) ? 'YouTube' : 'Video file');

/**
 * Admin lessons: route "/admin/lessons" (administrators only).
 * Every lesson from every course in one table, with search, a course filter, sortable columns and
 * paging (all done by the API, and kept in the URL). Lessons are edited and deleted here; new lessons
 * are added on a course's own page, because a lesson always belongs to one course.
 */
export default function AdminLessonsPage() {
  const confirm = useConfirm();
  const editor = useEditTarget<AdminLesson>();
  const deleteLesson = useDeleteLesson();
  // The course filter lists courses by name. The API allows up to 50 per request.
  const courses = useGetAllCourses({ sortBy: 'title', sortDir: 'asc', pageSize: 50 });

  const [params, setParams] = useUrlParams({
    q: '',
    courseId: '',
    sortBy: DEFAULT_SORT.sortBy as string,
    sortDir: DEFAULT_SORT.sortDir as string,
    page: '1',
    pageSize: '10',
  });
  const [search, setSearch] = useDebouncedSearch(params.q, (q) => setParams({ q, page: '1' }));

  const lessons = useGetAllLessons({
    q: params.q,
    courseId: params.courseId,
    sortBy: params.sortBy as LessonFilters['sortBy'],
    sortDir: params.sortDir as LessonFilters['sortDir'],
    page: Number(params.page),
    pageSize: Number(params.pageSize),
  });

  const hasFilters = !!(params.q || params.courseId);
  const clearFilters = () => {
    setSearch('');
    setParams({ q: '', courseId: '', page: '1' });
  };

  const columns: ColumnDef<AdminLesson>[] = [
    {
      id: 'title',
      header: 'Lesson',
      accessorFn: (lesson) => lesson.title,
      cell: ({ row }) => (
        <TitleCell
          leading={
            <LessonThumb
              src={row.original.thumbnailUrl}
              durationSeconds={row.original.durationSeconds}
              compact
            />
          }
          title={row.original.title}
          subtitle={`Lesson ${row.original.order} · ${sourceOf(row.original.videoUrl)}`}
          to={link(PATHS.learner.lesson, { lessonId: row.original.id })}
        />
      ),
    },
    {
      id: 'course',
      header: 'Course',
      accessorFn: (lesson) => lesson.course.title,
      cell: ({ row }) => (
        <Link
          to={link(PATHS.admin.course, { courseId: row.original.course.id })}
          className="rounded-sm font-medium hover:underline"
        >
          {row.original.course.title}
          {!row.original.course.published && (
            <span className="ml-2 font-normal text-ink-faint">(draft)</span>
          )}
        </Link>
      ),
    },
    {
      id: 'duration',
      header: 'Length',
      accessorFn: (lesson) => lesson.durationSeconds,
      sortDescFirst: true,
      cell: ({ row }) => <MutedCell>{formatDuration(row.original.durationSeconds)}</MutedCell>,
    },
    {
      id: 'createdAt',
      header: 'Added',
      accessorFn: (lesson) => lesson.createdAt,
      sortDescFirst: true,
      cell: ({ row }) => <MutedCell>{formatDate(row.original.createdAt)}</MutedCell>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const lesson = row.original;
        return (
          <RowActions
            label={`Actions for ${lesson.title}`}
            actions={[
              { label: 'Edit lesson', icon: Pencil, onSelect: () => editor.openEdit(lesson) },
              {
                label: 'Preview',
                icon: Play,
                to: link(PATHS.learner.lesson, { lessonId: lesson.id }),
              },
              {
                label: 'Open course lessons',
                icon: ListVideo,
                to: link(PATHS.admin.course, { courseId: lesson.course.id }),
              },
              {
                label: 'Delete lesson',
                icon: Trash2,
                tone: 'danger',
                separated: true,
                onSelect: async () => {
                  if (await confirm({ ...MESSAGES.confirm.deleteLesson })) {
                    deleteLesson.mutate(lesson.id);
                  }
                },
              },
            ]}
          />
        );
      },
    },
  ];

  const data = lessons.data;

  return (
    <Page
      title="Lessons"
      description="Every lesson from every course. Add new lessons from a course’s own page."
      actions={
        <Button asChild variant="secondary">
          <Link to={PATHS.admin.courses}>
            <ListVideo className="size-4" aria-hidden />
            Go to courses
          </Link>
        </Button>
      }
    >
      {lessons.isError ? (
        <ErrorState error={lessons.error} onRetry={() => void lessons.refetch()} />
      ) : (
        <DataTable
          caption="Lessons"
          columns={columns}
          data={data?.items ?? []}
          getRowId={(row) => row.id}
          numericColumns={['duration']}
          loading={lessons.isPending}
          busy={lessons.isFetching && !lessons.isPending}
          sorting={toSortingState(params.sortBy, params.sortDir)}
          onSortingChange={(sorting) =>
            setParams({ ...fromSortingState(sorting, DEFAULT_SORT), page: '1' })
          }
          toolbar={
            <TableToolbar
              search={{ value: search, onChange: setSearch, label: 'Search lessons' }}
              filters={
                <ToolbarSelect
                  label="Filter by course"
                  value={params.courseId}
                  onChange={(courseId) => setParams({ courseId, page: '1' })}
                  allLabel="All courses"
                  options={(courses.data?.items ?? []).map((c) => ({
                    value: c.id,
                    label: c.title,
                  }))}
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
                  className="col-span-2"
                />
              }
              summary={data && pluralize(data.meta.total, 'lesson')}
              onClear={hasFilters ? clearFilters : undefined}
            />
          }
          empty={
            hasFilters ? (
              <NoResultsState onClear={clearFilters} />
            ) : (
              <EmptyState
                {...MESSAGES.empty.allLessons}
                action={
                  <Button asChild>
                    <Link to={PATHS.admin.courses}>Go to courses</Link>
                  </Button>
                }
              />
            )
          }
          footer={data && <PagedFooter meta={data.meta} setParams={setParams} />}
        />
      )}

      {editor.isOpen && editor.item && (
        <LessonFormModal
          courseId={editor.item.courseId}
          existing={editor.item}
          onClose={editor.close}
        />
      )}
    </Page>
  );
}

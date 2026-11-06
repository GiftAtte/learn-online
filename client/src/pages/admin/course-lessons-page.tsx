import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DataTable,
  NumberCell,
  RowActions,
  TableSkeleton,
  TableToolbar,
  TitleCell,
} from '@/components/data-display';
import { EmptyState, QueryBoundary, useConfirm } from '@/components/feedback';
import { Page, PageSkeleton } from '@/components/layout';
import { Button, Tooltip } from '@/components/ui';
import { useGetCourseById } from '@/core/hooks/queries/use-courses';
import { CourseFormModal } from '@/components/courses/course-form-modal';
import { PublishedBadge } from '@/components/courses/published-badge';
import { useDeleteLesson, useReorderLessons } from '@/core/hooks/queries/use-lessons';
import { LessonFormModal } from '@/components/lessons/lesson-form-modal';
import { useEditTarget } from '@/core/hooks/ui/use-edit-target';
import { formatDuration, pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import type { CourseDetail } from '@/core/types/course.types';
import type { Lesson } from '@/core/types/lesson.types';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { link, PATHS } from '@/router/paths';

/** The numbered bubble that anchors each lesson row (the same number learners see on the path). */
const OrderBubble = ({ order }: { order: number }) => (
  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-spruce-50 font-display text-base font-semibold text-spruce-700 tnum">
    {order}
  </span>
);

/**
 * Admin course: route "/admin/courses/:courseId" (administrators only).
 * Manage one course's lessons in a data table: search, add, edit, delete and reorder.
 * Forms open in modals. Reordering is only available while the full list is showing.
 */
export default function AdminCourseLessonsPage() {
  const { courseId = '' } = useParams();
  const course = useGetCourseById(courseId);

  return (
    <QueryBoundary
      query={course}
      loading={
        <PageSkeleton>
          <TableSkeleton />
        </PageSkeleton>
      }
    >
      {(data) => <CourseLessons course={data} />}
    </QueryBoundary>
  );
}

function CourseLessons({ course }: { course: CourseDetail }) {
  const confirm = useConfirm();
  const deleteLesson = useDeleteLesson();
  const reorder = useReorderLessons(course.id);
  const lessonEditor = useEditTarget<Lesson>();
  const [editingCourse, setEditingCourse] = useState(false);
  const [search, setSearch] = useState('');
  const { lessons } = course;

  const searching = search.trim() !== '';
  const visible = lessons.filter((lesson) =>
    `${lesson.title} ${lesson.description}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  /** Swaps a lesson with its neighbour and saves the new order. */
  const move = (index: number, direction: -1 | 1) => {
    const ids = lessons.map((lesson) => lesson.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate(ids);
  };

  const columns: ColumnDef<Lesson>[] = [
    {
      id: 'title',
      header: 'Lesson',
      cell: ({ row }) => (
        <TitleCell
          leading={<OrderBubble order={row.original.order} />}
          title={row.original.title}
          subtitle={row.original.description}
        />
      ),
    },
    {
      id: 'length',
      header: 'Length',
      cell: ({ row }) => <NumberCell value={formatDuration(row.original.durationSeconds)} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const lesson = row.original;
        const index = lessons.findIndex((l) => l.id === lesson.id);
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Tooltip content={searching ? 'Clear the search to reorder' : 'Move up'}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${lesson.title} up`}
                disabled={searching || index === 0 || reorder.isPending}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={searching ? 'Clear the search to reorder' : 'Move down'}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${lesson.title} down`}
                disabled={searching || index === lessons.length - 1 || reorder.isPending}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" aria-hidden />
              </Button>
            </Tooltip>
            <RowActions
              label={`Actions for ${lesson.title}`}
              actions={[
                {
                  label: 'Edit lesson',
                  icon: Pencil,
                  onSelect: () => lessonEditor.openEdit(lesson),
                },
                {
                  label: 'Preview',
                  icon: ExternalLink,
                  to: link(PATHS.learner.lesson, { lessonId: lesson.id }),
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
          </div>
        );
      },
    },
  ];

  return (
    <Page
      back={{ to: PATHS.admin.courses, label: 'Courses' }}
      title={course.title}
      description={`${course.category.name}, ${pluralize(lessons.length, 'lesson')}`}
      actions={
        <>
          <PublishedBadge published={course.published} />
          <Button variant="secondary" onClick={() => setEditingCourse(true)}>
            <Pencil className="size-4" aria-hidden />
            Edit course
          </Button>
          <Button onClick={lessonEditor.openNew}>
            <Plus className="size-4" aria-hidden />
            Add lesson
          </Button>
        </>
      }
    >
      <DataTable
        caption="Lessons in this course"
        columns={columns}
        data={visible}
        getRowId={(row) => row.id}
        mobileTitleColumn="title"
        numericColumns={['length']}
        toolbar={
          <TableToolbar
            search={{ value: search, onChange: setSearch, label: 'Search lessons' }}
            summary={pluralize(visible.length, 'lesson')}
            onClear={searching ? () => setSearch('') : undefined}
          />
        }
        empty={
          searching ? (
            <NoResultsState onClear={() => setSearch('')} clearLabel="Clear search" />
          ) : (
            <EmptyState
              {...MESSAGES.empty.lessons}
              action={<Button onClick={lessonEditor.openNew}>Add lesson</Button>}
            />
          )
        }
      />

      {lessonEditor.isOpen && (
        <LessonFormModal
          courseId={course.id}
          existing={lessonEditor.item}
          onClose={lessonEditor.close}
        />
      )}
      {editingCourse && (
        <CourseFormModal existing={course} onClose={() => setEditingCourse(false)} />
      )}
    </Page>
  );
}

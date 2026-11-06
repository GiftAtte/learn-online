import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, GraduationCap, Percent, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  DataTable,
  MutedCell,
  ProgressCell,
  StatGrid,
  StatTile,
  TableSkeleton,
  TitleCell,
} from '@/components/data-display';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { Page, PageSkeleton, SectionCard } from '@/components/layout';
import { PublishedBadge } from '@/components/courses/published-badge';
import { Avatar, Badge } from '@/components/ui';
import { useGetCourseActivity } from '@/core/hooks/queries/use-dashboard';
import { formatDate, formatDuration, pluralize } from '@/core/lib/format';
import type { CourseStatus } from '@/core/types/course.types';
import type { CourseActivity, CourseActivityLearner } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

const STATUS: Record<CourseStatus, { label: string; tone: 'success' | 'progress' | 'neutral' }> = {
  COMPLETED: { label: 'Completed', tone: 'success' },
  IN_PROGRESS: { label: 'In progress', tone: 'progress' },
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
};

const columns: ColumnDef<CourseActivityLearner>[] = [
  {
    id: 'learner',
    header: 'Learner',
    accessorFn: (l) => l.name,
    cell: ({ row }) => (
      <TitleCell
        leading={<Avatar name={row.original.name} />}
        title={row.original.name}
        subtitle={row.original.email}
        to={link(PATHS.admin.learner, { learnerId: row.original.userId })}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (l) => l.status,
    cell: ({ row }) => {
      const s = STATUS[row.original.status];
      return <Badge tone={s.tone}>{s.label}</Badge>;
    },
  },
  {
    id: 'progress',
    header: 'Progress',
    accessorFn: (l) => l.progressPercent,
    sortDescFirst: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <ProgressCell value={row.original.progressPercent} label={`${row.original.name} progress`} />
        <span className="shrink-0 text-sm text-ink-faint tnum">
          {row.original.completedLessons}/{row.original.lessonCount}
        </span>
      </div>
    ),
  },
  {
    id: 'enrolled',
    header: 'Enrolled',
    accessorFn: (l) => l.enrolledAt,
    sortDescFirst: true,
    cell: ({ row }) => <MutedCell>{formatDate(row.original.enrolledAt)}</MutedCell>,
  },
  {
    id: 'lastActive',
    header: 'Last active',
    accessorFn: (l) => l.lastActivityAt ?? '',
    sortDescFirst: true,
    cell: ({ row }) => (
      <MutedCell>
        {row.original.lastActivityAt ? formatDate(row.original.lastActivityAt) : 'Not yet'}
      </MutedCell>
    ),
  },
];

/**
 * Admin course activity: route "/admin/courses/:courseId/activity" (administrators only).
 * The full picture for one course: headline numbers, how many learners finished each lesson,
 * and every enrolled learner with their progress (click one to open their detail page).
 */
export default function AdminCourseActivityPage() {
  const { courseId = '' } = useParams();
  const activity = useGetCourseActivity(courseId);

  return (
    <QueryBoundary
      query={activity}
      loading={
        <PageSkeleton>
          <TableSkeleton />
        </PageSkeleton>
      }
    >
      {(data) => <ActivityView activity={data} />}
    </QueryBoundary>
  );
}

function ActivityView({ activity }: { activity: CourseActivity }) {
  const { course, summary, lessons, learners } = activity;
  return (
    <Page
      back={{ to: PATHS.admin.overview, label: 'Overview' }}
      title={course.title}
      description={`${course.category.name} · ${pluralize(course.lessonCount, 'lesson')}, ${formatDuration(course.totalDurationSeconds)}`}
      actions={<PublishedBadge published={course.published} />}
    >
      <StatGrid>
        <StatTile label="Enrolled" value={summary.enrolled} icon={Users} />
        <StatTile
          label="Completed"
          value={summary.completed}
          hint={`${summary.inProgress} in progress, ${summary.notStarted} not started`}
          icon={GraduationCap}
          tone="success"
        />
        <StatTile label="Completion rate" value={`${summary.completionRate}%`} icon={CheckCircle2} />
        <StatTile label="Average progress" value={`${summary.averageProgressPercent}%`} icon={Percent} />
      </StatGrid>

      <SectionCard title="Lessons" description="How many enrolled learners finished each lesson" flush>
        {lessons.length === 0 ? (
          <p className="p-6 text-ink-soft">This course has no lessons yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {lessons.map((lesson) => (
              <li key={lesson.lessonId} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 shrink-0 text-sm text-ink-faint tnum">{lesson.order}</span>
                <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                <span className="shrink-0 text-sm text-ink-soft tnum">
                  {lesson.completedLearners} of {summary.enrolled} finished
                  {lesson.startedLearners > 0 && `, ${lesson.startedLearners} watching`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <DataTable
        caption="Learners enrolled in this course"
        columns={columns}
        data={learners}
        getRowId={(row) => row.userId}
        mobileTitleColumn="learner"
        empty={
          <EmptyState
            icon={Users}
            title="No learners yet"
            description="Enrolled learners and their progress appear here."
          />
        }
      />
    </Page>
  );
}

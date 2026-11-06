import { BookOpen, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { StatGrid, StatTile } from '@/components/data-display';
import { EmptyState, QueryBoundary, useConfirm } from '@/components/feedback';
import { Page, PageSkeleton, SectionCard } from '@/components/layout';
import { Badge, Button, ProgressBar, Skeleton } from '@/components/ui';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useGetLearnerById } from '@/core/hooks/queries/use-dashboard';
import { useUpdateUserRole } from '@/core/hooks/queries/use-users';
import { formatClock, formatDate, formatDuration, pluralize } from '@/core/lib/format';
import type { LearnerDetail } from '@/core/types/learner.types';
import { PATHS } from '@/router/paths';

/**
 * Admin learner: route "/admin/learners/:learnerId" (administrators only).
 * One person in full: headline numbers, and for every enrolled course the status of each lesson
 * (completed, in progress with the saved position, or not started). Administrators can also
 * promote the person to administrator here.
 */
export default function AdminLearnerDetailPage() {
  const { learnerId = '' } = useParams();
  const learner = useGetLearnerById(learnerId);

  return (
    <QueryBoundary
      query={learner}
      loading={
        <PageSkeleton>
          <Skeleton className="h-40 w-full" />
        </PageSkeleton>
      }
    >
      {(data) => <LearnerDetailView learner={data} />}
    </QueryBoundary>
  );
}

function RoleAction({ learner }: { learner: LearnerDetail }) {
  const confirm = useConfirm();
  const { user: me } = useSession();
  const updateRole = useUpdateUserRole(learner.id);
  // Administrators can't change their own role (the API enforces it as well).
  if (me?.id === learner.id) return <Badge tone="brand">You</Badge>;

  const promote = learner.role === 'LEARNER';
  return (
    <Button
      variant="secondary"
      loading={updateRole.isPending}
      onClick={async () => {
        const ok = await confirm({
          title: promote ? `Make ${learner.name} an administrator?` : `Remove admin access?`,
          description: promote
            ? 'They will be able to manage courses, lessons and see every learner’s progress.'
            : `${learner.name} will become a regular learner.`,
          confirmLabel: promote ? 'Make administrator' : 'Make learner',
        });
        if (ok) updateRole.mutate(promote ? 'ADMIN' : 'LEARNER');
      }}
    >
      {promote ? 'Make administrator' : 'Make learner'}
    </Button>
  );
}

function LearnerDetailView({ learner }: { learner: LearnerDetail }) {
  const { summary } = learner;
  return (
    <Page
      back={{ to: PATHS.admin.learners, label: 'Learners' }}
      title={learner.name}
      description={`${learner.email} · joined ${formatDate(learner.joinedAt)}`}
      actions={
        <div className="flex items-center gap-3">
          {learner.role === 'ADMIN' && <Badge tone="brand">Administrator</Badge>}
          <RoleAction learner={learner} />
        </div>
      }
    >
      <StatGrid>
        <StatTile label="Enrolled" value={summary.enrolledCourses} icon={BookOpen} />
        <StatTile
          label="Courses finished"
          value={summary.completedCourses}
          icon={GraduationCap}
          tone="success"
        />
        <StatTile
          label="Lessons completed"
          value={summary.completedLessons}
          icon={CheckCircle2}
          tone="success"
        />
        <StatTile label="Watched" value={`${summary.minutesWatched} min`} icon={Clock} />
      </StatGrid>

      {learner.courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Not enrolled yet"
          description="Course progress appears here once this person enrolls."
        />
      ) : (
        learner.courses.map((course) => (
          <SectionCard
            key={course.courseId}
            title={course.title}
            description={`${course.category.name} · enrolled ${formatDate(course.enrolledAt)} · ${pluralize(course.lessonCount, 'lesson')}, ${formatDuration(course.totalDurationSeconds)}`}
            actions={
              <Badge tone={course.status === 'COMPLETED' ? 'success' : 'progress'}>
                {course.progressPercent}%
              </Badge>
            }
          >
            <ProgressBar
              value={course.progressPercent}
              label={`${course.title} progress`}
              className="mb-4"
            />
            <ol className="flex flex-col divide-y divide-line">
              {course.lessons.map((lesson) => (
                <li key={lesson.lessonId} className="flex items-center gap-3 py-3">
                  <span className="w-6 shrink-0 text-sm text-ink-faint tnum">{lesson.order}</span>
                  <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                  {lesson.completed ? (
                    <Badge tone="success">Completed</Badge>
                  ) : lesson.lastPositionSeconds > 0 ? (
                    <Badge tone="progress">
                      At {formatClock(lesson.lastPositionSeconds)} of{' '}
                      {formatClock(lesson.durationSeconds)}
                    </Badge>
                  ) : (
                    <Badge>Not started</Badge>
                  )}
                </li>
              ))}
            </ol>
          </SectionCard>
        ))
      )}
    </Page>
  );
}

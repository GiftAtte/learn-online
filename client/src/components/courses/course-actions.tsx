import { Link, useLocation } from 'react-router-dom';
import { useConfirm } from '@/components/feedback/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useCreateEnrollment, useDeleteEnrollment } from '@/core/hooks/queries/use-enrollments';
import { MESSAGES } from '@/core/lib/messages';
import type { CourseDetail } from '@/core/types/course.types';
import { link, PATHS } from '@/router/paths';

/**
 * The main button(s) on a course page. What it offers depends on who is looking:
 *   guest            -> sign in to enroll
 *   administrator    -> manage the course
 *   learner, new     -> enroll
 *   learner, enrolled-> start / continue / review (plus "Leave course")
 */
export function CourseActions({ course }: { course: CourseDetail }) {
  const { user, isAdmin } = useSession();
  const location = useLocation();
  const confirm = useConfirm();
  const enroll = useCreateEnrollment(course.id);
  const unenroll = useDeleteEnrollment(course.id);

  if (!user) {
    return (
      <Button asChild size="lg">
        {/* `state.from` sends them back here after signing in. */}
        <Link to={PATHS.signIn} state={{ from: location }}>
          Sign in to enroll
        </Link>
      </Button>
    );
  }

  if (isAdmin) {
    return (
      <Button asChild size="lg" variant="secondary">
        <Link to={link(PATHS.admin.course, { courseId: course.id })}>Manage course</Link>
      </Button>
    );
  }

  if (!course.enrolled) {
    return (
      <Button size="lg" loading={enroll.isPending} onClick={() => enroll.mutate()}>
        Enroll in this course
      </Button>
    );
  }

  // Enrolled: go to the first lesson that isn't finished yet (or the first lesson).
  const nextLesson = course.lessons.find((lesson) => !lesson.completed) ?? course.lessons[0];
  const started =
    course.completedLessons > 0 || course.lessons.some((l) => l.lastPositionSeconds > 0);
  const label =
    course.status === 'COMPLETED'
      ? 'Review course'
      : started
        ? 'Continue learning'
        : 'Start course';

  return (
    <div className="flex flex-col gap-2">
      {nextLesson && (
        <Button asChild size="lg" variant="accent">
          <Link to={link(PATHS.learner.lesson, { lessonId: nextLesson.id })}>{label}</Link>
        </Button>
      )}
      <Button
        variant="ghost"
        loading={unenroll.isPending}
        onClick={async () => {
          if (await confirm({ ...MESSAGES.confirm.unenroll })) unenroll.mutate();
        }}
      >
        Leave course
      </Button>
    </div>
  );
}

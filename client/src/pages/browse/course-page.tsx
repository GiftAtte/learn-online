import { useParams } from 'react-router-dom';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { Page, PageSkeleton, Section } from '@/components/layout';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useGetCourseById } from '@/core/hooks/queries/use-courses';
import { CourseSummaryCard } from '@/components/courses/course-summary-card';
import { LessonListSkeleton } from '@/components/lessons/lesson-card-skeleton';
import { LessonPath } from '@/components/lessons/lesson-path';
import { formatDuration, pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import type { CourseDetail } from '@/core/types/course.types';
import { useBrowsePaths } from '@/router/use-browse-paths';

/**
 * Course detail: route "/courses/:courseId" (open to everyone).
 * Shows the lesson path and a summary card with the right action for the viewer
 * (sign in, enroll, continue...). Lessons are locked until the learner enrolls.
 */
export default function CoursePage() {
  const { courseId = '' } = useParams();
  const course = useGetCourseById(courseId);

  return (
    <QueryBoundary
      query={course}
      loading={
        <PageSkeleton>
          <LessonListSkeleton />
        </PageSkeleton>
      }
    >
      {(data) => <CourseView course={data} />}
    </QueryBoundary>
  );
}

function CourseView({ course }: { course: CourseDetail }) {
  const { isAdmin } = useSession();
  const browse = useBrowsePaths();
  // Learners must enroll to watch; administrators can always preview.
  const canWatch = !!course.enrolled || isAdmin;

  return (
    <Page
      back={{ to: browse.catalog, label: 'All courses' }}
      title={course.title}
      description={course.description}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* On phones the summary card comes first (order-1), on desktop it sits to the right */}
        <Section
          title="Lessons"
          className="order-2 lg:order-1"
          action={
            <span className="text-sm text-ink-faint tnum">
              {pluralize(course.lessonCount, 'lesson')},{' '}
              {formatDuration(course.totalDurationSeconds)}
            </span>
          }
        >
          {course.lessons.length === 0 ? (
            <EmptyState {...MESSAGES.empty.lessons} />
          ) : (
            <LessonPath lessons={course.lessons} locked={!canWatch} />
          )}
        </Section>

        <CourseSummaryCard
          course={course}
          className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start"
        />
      </div>
    </Page>
  );
}

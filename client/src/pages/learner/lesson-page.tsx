import { useParams } from 'react-router-dom';
import { Alert, QueryBoundary } from '@/components/feedback';
import { Page, PageSkeleton, Section } from '@/components/layout';
import { ProgressBar, Skeleton } from '@/components/ui';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useGetLessonById } from '@/core/hooks/queries/use-lessons';
import { LessonListSkeleton } from '@/components/lessons/lesson-card-skeleton';
import { LessonNav } from '@/components/lessons/lesson-nav';
import { LessonPath } from '@/components/lessons/lesson-path';
import { LessonPlayerCard } from '@/components/lessons/lesson-player-card';
import type { LessonDetail } from '@/core/types/lesson.types';
import { link, PATHS } from '@/router/paths';

/**
 * Lesson: route "/learner/lessons/:lessonId" (signed-in; learners must be enrolled).
 * A focused video card with previous/next buttons, and the course's lessons beside it.
 * Watching saves progress, resumes where the learner stopped, and completes the lesson at the end.
 */
export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = useGetLessonById(lessonId);

  return (
    <QueryBoundary
      query={lesson}
      loading={
        <PageSkeleton>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
            <Skeleton className="aspect-video rounded-stage" />
            <LessonListSkeleton />
          </div>
        </PageSkeleton>
      }
    >
      {(detail) => <LessonView detail={detail} />}
    </QueryBoundary>
  );
}

function LessonView({ detail }: { detail: LessonDetail }) {
  const { isAdmin } = useSession();
  const { lesson, course, lessons } = detail;

  return (
    <Page
      back={{ to: link(PATHS.learner.course, { courseId: course.id }), label: course.title }}
      title={lesson.title}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Main column: the video and navigation */}
        <div className="flex min-w-0 flex-col gap-5">
          {isAdmin && (
            <Alert tone="info" title="You’re previewing this lesson">
              Progress isn’t saved for administrators.
            </Alert>
          )}
          <LessonPlayerCard detail={detail} trackProgress={!isAdmin} />
          <LessonNav
            previousLessonId={detail.previousLessonId}
            nextLessonId={detail.nextLessonId}
            completed={lesson.completed}
          />
        </div>

        {/* Side column: where this lesson sits in the course */}
        <Section title="Course lessons">
          <div className="flex items-center gap-3">
            <ProgressBar value={detail.courseProgressPercent} label="Course progress" size="sm" />
            <span className="text-sm text-ink-soft tnum">{detail.courseProgressPercent}%</span>
          </div>
          <LessonPath lessons={lessons} currentId={lesson.id} />
        </Section>
      </div>
    </Page>
  );
}

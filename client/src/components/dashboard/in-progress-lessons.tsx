import { Link } from 'react-router-dom';
import { Section } from '@/components/layout';
import { LessonPath } from '@/components/lessons/lesson-path';
import { Skeleton } from '@/components/ui';
import { ProgressBar } from '@/components/ui/progress';
import { useGetLessonById } from '@/core/hooks/queries/use-lessons';
import type { ResumeTarget } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

/**
 * Shown by default whenever a lesson is in progress: the course it belongs to, a banner with the
 * percentage done, and every lesson with its thumbnail and status (Completed / In progress / Not started).
 */
export function InProgressLessons({ resume }: { resume: ResumeTarget }) {
  const { data: detail, isPending } = useGetLessonById(resume.lessonId);

  if (isPending) return <Skeleton className="h-64 rounded-card" />;
  if (!detail) return null;

  return (
    <Section
      title={detail.course.title}
      action={
        <Link
          to={link(PATHS.learner.course, { courseId: detail.course.id })}
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          View course
        </Link>
      }
    >
      <div className="flex items-center gap-3 rounded-card bg-spruce-900 px-4 py-3 text-white">
        <span className="text-sm font-medium whitespace-nowrap">Course progress</span>
        <ProgressBar
          value={detail.courseProgressPercent}
          label="Course progress"
          size="sm"
          onDark
        />
        <span className="font-display text-lg font-semibold tnum">
          {detail.courseProgressPercent}%
        </span>
      </div>
      <LessonPath
        lessons={detail.lessons}
        currentId={detail.lesson.id}
        nextId={detail.nextLessonId}
      />
    </Section>
  );
}

import type { LessonSummary } from '@/core/types/lesson.types';
import { LessonCard } from './lesson-card';
import { link, PATHS } from '@/router/paths';

interface LessonPathProps {
  lessons: LessonSummary[];
  /** Highlights the lesson being watched. */
  currentId?: string;
  /** Not enrolled: every lesson shows a lock instead of linking. */
  locked?: boolean;
}

/**
 * A course's lessons as the numbered path (nodes joined by a line).
 * Used on the course page and beside the video, so both show lessons identically.
 */
export function LessonPath({ lessons, currentId, locked }: LessonPathProps) {
  return (
    <ol>
      {lessons.map((lesson, index) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          to={link(PATHS.learner.lesson, { lessonId: lesson.id })}
          current={lesson.id === currentId}
          locked={locked}
          last={index === lessons.length - 1}
        />
      ))}
    </ol>
  );
}

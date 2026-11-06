import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { link, PATHS } from '@/router/paths';

interface LessonNavProps {
  previousLessonId: string | null;
  nextLessonId: string | null;
  /** When the current lesson is done, "Next lesson" becomes the highlighted action. */
  completed: boolean;
}

/** Previous / next buttons under the video. */
export function LessonNav({ previousLessonId, nextLessonId, completed }: LessonNavProps) {
  return (
    <nav aria-label="Lesson navigation" className="flex items-center justify-between gap-3">
      {previousLessonId ? (
        <Button asChild variant="secondary">
          <Link to={link(PATHS.learner.lesson, { lessonId: previousLessonId })}>
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {nextLessonId && (
        <Button asChild variant={completed ? 'accent' : 'secondary'}>
          <Link to={link(PATHS.learner.lesson, { lessonId: nextLessonId })}>
            Next lesson
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      )}
    </nav>
  );
}

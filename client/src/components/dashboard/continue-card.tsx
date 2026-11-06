import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { formatClock } from '@/core/lib/format';
import type { ResumeTarget } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

/**
 * The most important action for a returning learner: resume the lesson they were watching.
 * A dark panel with the pencil progress stroke, so it stands out from the light catalog.
 */
export function ContinueCard({ resume }: { resume: ResumeTarget }) {
  const percent = Math.round((resume.lastPositionSeconds / resume.durationSeconds) * 100);
  return (
    <section
      aria-label="Continue learning"
      className="flex flex-col gap-5 rounded-stage bg-spruce-900 p-5 text-white shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-7"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:max-w-xl">
        <p className="text-sm text-spruce-200">Pick up where you left off</p>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl leading-snug font-semibold">{resume.lessonTitle}</h2>
          <p className="text-spruce-200">{resume.courseTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={percent}
            label="Lesson progress"
            size="sm"
            onDark
            className="max-w-64"
          />
          <span className="text-sm whitespace-nowrap text-spruce-200 tnum">
            {formatClock(resume.lastPositionSeconds)} of {formatClock(resume.durationSeconds)}
          </span>
        </div>
      </div>
      <Button asChild variant="accent" size="lg" className="w-full shrink-0 sm:w-auto">
        <Link to={link(PATHS.learner.lesson, { lessonId: resume.lessonId })}>
          <Play className="size-5 fill-current" aria-hidden />
          Resume lesson
        </Link>
      </Button>
    </section>
  );
}

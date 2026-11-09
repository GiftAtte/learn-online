import { Link } from 'react-router-dom';
import { ProgressStatusBadge } from '@/components/courses/progress-status-badge';
import { LessonThumb } from '@/components/lessons/lesson-thumb';
import { formatDate } from '@/core/lib/format';
import { lessonPicture } from '@/core/lib/youtube';
import type { LearnerDashboard } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

type Item = LearnerDashboard['recentActivity'][number];

const percentWatched = (item: Item) =>
  Math.min(100, Math.round((item.lastPositionSeconds / Math.max(1, item.durationSeconds)) * 100));

/** The lessons the learner touched most recently: thumbnail, progress status, and a link back to the lesson. */
export function RecentActivity({ items }: { items: LearnerDashboard['recentActivity'] }) {
  if (items.length === 0) {
    return <p className="text-[0.95rem] text-ink-soft">Lessons you watch will appear here.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item) => (
        <li key={item.lessonId}>
          <Link
            to={link(PATHS.learner.lesson, { lessonId: item.lessonId })}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-spruce-50/60"
          >
            <LessonThumb
              src={lessonPicture(item.thumbnailUrl, item.videoUrl)}
              durationSeconds={item.durationSeconds}
              completed={item.completed}
              compact
            />
            <span className="flex min-w-0 flex-col items-start gap-1">
              <span className="font-medium">{item.lessonTitle}</span>
              <ProgressStatusBadge status={item.completed ? 'COMPLETED' : 'IN_PROGRESS'} />
              <span className="text-sm text-ink-faint">
                {item.completed ? 'Finished' : `${percentWatched(item)}% watched`} ·{' '}
                {formatDate(item.updatedAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

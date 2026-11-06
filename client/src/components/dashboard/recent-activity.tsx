import { Link } from 'react-router-dom';
import { formatDate } from '@/core/lib/format';
import type { LearnerDashboard } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

/** The lessons the learner touched most recently; each links back to the lesson. */
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
            className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-spruce-50/60"
          >
            <span className="font-medium">{item.lessonTitle}</span>
            <span className="text-sm text-ink-faint">
              {item.completed ? 'Completed' : 'Watched'} {formatDate(item.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

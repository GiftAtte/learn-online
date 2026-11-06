import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/core/lib/format';
import type { AdminDashboard } from '@/core/types/dashboard.types';

/**
 * "Maya enrolled in TypeScript for Professionals" feed for the admin overview.
 * Content only: place it inside a flush <SectionCard>, which supplies the panel.
 */
export function RecentEnrollments({ items }: { items: AdminDashboard['recentEnrollments'] }) {
  if (items.length === 0) return <p className="p-5 text-ink-soft">No one has enrolled yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li
          key={`${item.user.id}-${item.course.id}`}
          className="flex items-center gap-3 px-5 py-3.5"
        >
          <Avatar name={item.user.name} size="sm" />
          <p className="min-w-0 flex-1 text-[0.95rem]">
            <span className="font-medium">{item.user.name}</span> enrolled in{' '}
            <span className="font-medium">{item.course.title}</span>
          </p>
          <span className="shrink-0 text-sm text-ink-faint">{formatDate(item.enrolledAt)}</span>
        </li>
      ))}
    </ul>
  );
}

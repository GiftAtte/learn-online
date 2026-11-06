import { Link } from 'react-router-dom';
import type { AdminDashboard } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

/**
 * A simple bar chart of how many learners are enrolled in each course, busiest first.
 * Bars are scaled to the biggest course. Each row links to that course's management page.
 * Content only: place it inside a <SectionCard>, which supplies the panel.
 */
export function EnrollmentsByCourse({ courses }: { courses: AdminDashboard['courses'] }) {
  const ranked = [...courses].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 6);
  const max = Math.max(1, ...ranked.map((c) => c.enrollmentCount));

  if (ranked.length === 0) return <p className="text-ink-soft">No courses yet.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {ranked.map((course) => (
        <li key={course.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[0.95rem]">
            <Link
              to={link(PATHS.admin.course, { courseId: course.id })}
              className="truncate font-medium underline-offset-4 hover:underline"
            >
              {course.title}
            </Link>
            <span className="shrink-0 font-medium tnum">{course.enrollmentCount}</span>
          </div>
          {/* The bar is decorative: the number beside it carries the information. */}
          <div className="h-2 overflow-hidden rounded-full bg-spruce-100" aria-hidden>
            <div
              className="h-full rounded-full bg-pencil-500 transition-[width] duration-500"
              style={{ width: `${(course.enrollmentCount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

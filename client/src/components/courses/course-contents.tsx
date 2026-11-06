import { Link } from 'react-router-dom';
import { useGetAllCourses } from '@/core/hooks/queries/use-courses';
import { formatDuration, pluralize } from '@/core/lib/format';
import { PATHS } from '@/router/paths';

const HOW_MANY = 6;

/**
 * The library as a table of contents: course titles, a dotted line, then how much is in each one,
 * like the front of a textbook. It uses the real, most popular courses, so the sign-in and sign-up
 * pages show what is waiting on the other side. If the courses cannot be loaded it shows nothing
 * (the panel then simply stays quiet) rather than an error.
 */
export function CourseContents() {
  const courses = useGetAllCourses({ sortBy: 'learners', sortDir: 'desc', pageSize: HOW_MANY });

  if (courses.isPending) {
    return (
      <div role="status" aria-label="Loading courses" className="flex flex-col gap-4">
        {Array.from({ length: HOW_MANY }, (_, i) => (
          <div key={i} className="h-5 w-full animate-pulse rounded-sm bg-white/10" />
        ))}
      </div>
    );
  }
  if (courses.isError || courses.data.items.length === 0) return null;

  const { items, meta } = courses.data;
  const more = meta.total - items.length;

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3.5">
        {items.map((course) => (
          <li key={course.id} className="flex items-baseline gap-3">
            <span className="min-w-0 truncate font-display text-[1.0625rem] text-white">
              {course.title}
            </span>
            {/* the dotted leader between the title and the figures */}
            <span
              aria-hidden
              className="min-w-4 flex-1 translate-y-[-0.2rem] border-b border-dotted border-white/35"
            />
            <span className="shrink-0 text-sm text-spruce-200 tnum">
              {pluralize(course.lessonCount, 'lesson')},{' '}
              {formatDuration(course.totalDurationSeconds)}
            </span>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="text-sm text-spruce-200">
          and {more} more.{' '}
          <Link
            to={PATHS.catalog}
            className="text-white underline decoration-pencil-500 underline-offset-4 hover:decoration-2"
          >
            Browse them all
          </Link>
        </p>
      )}
    </div>
  );
}

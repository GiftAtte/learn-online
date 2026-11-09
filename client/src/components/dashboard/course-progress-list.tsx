import { Link } from 'react-router-dom';
import { Card, ProgressBar } from '@/components/ui';
import { ProgressStatusBadge } from '@/components/courses/progress-status-badge';
import type { LearnerDashboard } from '@/core/types/dashboard.types';
import { link, PATHS } from '@/router/paths';

/** The learner's enrolled courses, each as a row with its progress bar. The whole row is one link. */
export function CourseProgressList({ courses }: { courses: LearnerDashboard['courses'] }) {
  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => (
        <li key={course.id}>
          <Card interactive padding="sm" className="relative flex flex-col gap-3 sm:p-5">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
              <div className="min-w-0 sm:flex-1">
                <h3 className="text-lg font-semibold">
                  <Link
                    to={link(PATHS.learner.course, { courseId: course.id })}
                    className="rounded-sm after:absolute after:inset-0 after:content-['']"
                  >
                    {course.title}
                  </Link>
                </h3>
                <p className="text-sm text-ink-faint">{course.category.name}</p>
              </div>
              <div className="order-first shrink-0 sm:order-last">
                <ProgressStatusBadge status={course.status} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={course.progressPercent} label={`${course.title} progress`} />
              <span className="w-24 shrink-0 text-right text-sm text-ink-soft tnum">
                {course.completedLessons} of {course.lessonCount}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
